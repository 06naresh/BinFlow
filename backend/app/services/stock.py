from fastapi import HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session
from app.models.entities import Product, PurchaseReceipt, ReceiptItem, StockMovement


def receive_stock(db: Session, payload):
    try:
        receipt = PurchaseReceipt(
            supplier_id=payload.supplier_id,
            reference_number=payload.reference_number,
            notes=payload.notes,
        )
        db.add(receipt)
        db.flush()

        for item in payload.items:
            product = db.scalar(
                select(Product).where(Product.id == item.product_id).with_for_update()
            )
            if product is None:
                raise HTTPException(404, f"Product {item.product_id} not found")
            product.current_stock += item.quantity
            db.add(ReceiptItem(
                receipt_id=receipt.id, product_id=product.id,
                quantity=item.quantity, unit_cost=item.unit_cost
            ))
            db.add(StockMovement(
                product_id=product.id, movement_type="RECEIPT",
                quantity=item.quantity, reference_type="RECEIPT",
                reference_id=receipt.id, notes=payload.notes
            ))
        db.commit()
        db.refresh(receipt)
        return receipt
    except Exception:
        db.rollback()
        raise


def issue_stock(db: Session, payload):
    try:
        # Lock product rows in stable ID order to reduce deadlock risk.
        ids = sorted({item.product_id for item in payload.items})
        products = db.scalars(
            select(Product).where(Product.id.in_(ids)).order_by(Product.id).with_for_update()
        ).all()
        by_id = {p.id: p for p in products}
        if len(by_id) != len(ids):
            missing = next(pid for pid in ids if pid not in by_id)
            raise HTTPException(404, f"Product {missing} not found")

        # Aggregate repeated product lines before checking balances.
        requested = {}
        for item in payload.items:
            requested[item.product_id] = requested.get(item.product_id, 0) + item.quantity

        for product_id, quantity in requested.items():
            product = by_id[product_id]
            if product.current_stock < quantity:
                raise HTTPException(
                    409,
                    f"Insufficient stock for {product.name}. Available: {product.current_stock}, requested: {quantity}",
                )

        for product_id, quantity in requested.items():
            product = by_id[product_id]
            product.current_stock -= quantity
            db.add(StockMovement(
                product_id=product_id, movement_type="ISSUE",
                quantity=quantity, notes=payload.notes
            ))
        db.commit()
        return {"message": "Stock issued successfully", "items": len(requested)}
    except Exception:
        db.rollback()
        raise
