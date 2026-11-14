from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, or_, func
from sqlalchemy.orm import Session
from app.db.session import get_db
from app.models.entities import Category, Product, Supplier, StockMovement, PurchaseReceipt
from app.schemas.dtos import (
    CategoryCreate, CategoryOut, ProductCreate, ProductUpdate, ProductOut,
    SupplierCreate, SupplierOut, ReceiptCreate, IssueCreate, MovementOut
)
from app.services.stock import receive_stock, issue_stock

router = APIRouter()


@router.get("/categories", response_model=list[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    return db.scalars(select(Category).order_by(Category.name)).all()


@router.post("/categories", response_model=CategoryOut, status_code=201)
def create_category(data: CategoryCreate, db: Session = Depends(get_db)):
    obj = Category(**data.model_dump())
    db.add(obj)
    try:
        db.commit()
        db.refresh(obj)
        return obj
    except Exception:
        db.rollback()
        raise HTTPException(409, "Category name already exists or is invalid")


@router.get("/products", response_model=list[ProductOut])
def list_products(
    search: str | None = None,
    category_id: int | None = None,
    low_stock: bool = False,
    db: Session = Depends(get_db),
):
    stmt = select(Product).where(Product.is_active.is_(True))
    if search:
        term = f"%{search.strip()}%"
        stmt = stmt.where(or_(Product.name.ilike(term), Product.sku.ilike(term)))
    if category_id:
        stmt = stmt.where(Product.category_id == category_id)
    if low_stock:
        stmt = stmt.where(Product.current_stock <= Product.minimum_stock)
    return db.scalars(stmt.order_by(Product.name)).all()


@router.post("/products", response_model=ProductOut, status_code=201)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    if data.category_id and db.get(Category, data.category_id) is None:
        raise HTTPException(404, "Category not found")
    obj = Product(**data.model_dump())
    db.add(obj)
    try:
        db.commit()
        db.refresh(obj)
        return obj
    except Exception:
        db.rollback()
        raise HTTPException(409, "SKU already exists or product data is invalid")


@router.patch("/products/{product_id}", response_model=ProductOut)
def update_product(product_id: int, data: ProductUpdate, db: Session = Depends(get_db)):
    obj = db.get(Product, product_id)
    if obj is None:
        raise HTTPException(404, "Product not found")
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(obj, key, value)
    db.commit()
    db.refresh(obj)
    return obj


@router.delete("/products/{product_id}", status_code=204)
def deactivate_product(product_id: int, db: Session = Depends(get_db)):
    obj = db.get(Product, product_id)
    if obj is None:
        raise HTTPException(404, "Product not found")
    obj.is_active = False
    db.commit()


@router.get("/suppliers", response_model=list[SupplierOut])
def list_suppliers(db: Session = Depends(get_db)):
    return db.scalars(select(Supplier).order_by(Supplier.name)).all()


@router.post("/suppliers", response_model=SupplierOut, status_code=201)
def create_supplier(data: SupplierCreate, db: Session = Depends(get_db)):
    obj = Supplier(**data.model_dump())
    db.add(obj)
    db.commit()
    db.refresh(obj)
    return obj


@router.post("/stock/receipts", status_code=201)
def create_receipt(data: ReceiptCreate, db: Session = Depends(get_db)):
    if db.get(Supplier, data.supplier_id) is None:
        raise HTTPException(404, "Supplier not found")
    try:
        receipt = receive_stock(db, data)
        return {
            "id": receipt.id,
            "reference_number": receipt.reference_number,
            "message": "Stock received successfully",
        }
    except HTTPException:
        raise
    except Exception:
        raise HTTPException(409, "Could not create receipt; check reference number and data")


@router.post("/stock/issues")
def create_issue(data: IssueCreate, db: Session = Depends(get_db)):
    return issue_stock(db, data)


@router.get("/stock/movements", response_model=list[MovementOut])
def list_movements(
    search: str | None = None,
    movement_type: str | None = None,
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
):
    stmt = select(StockMovement)
    if movement_type:
        stmt = stmt.where(StockMovement.movement_type == movement_type.upper())
    if search:
        stmt = stmt.join(Product).where(
            or_(Product.name.ilike(f"%{search}%"), Product.sku.ilike(f"%{search}%"))
        )
    return db.scalars(stmt.order_by(StockMovement.created_at.desc()).limit(limit)).all()


@router.get("/dashboard/summary")
def dashboard_summary(db: Session = Depends(get_db)):
    total_products = db.scalar(select(func.count(Product.id)).where(Product.is_active.is_(True))) or 0
    total_suppliers = db.scalar(select(func.count(Supplier.id))) or 0
    low_stock = db.scalar(
        select(func.count(Product.id)).where(
            Product.is_active.is_(True), Product.current_stock <= Product.minimum_stock
        )
    ) or 0
    total_units = db.scalar(
        select(func.coalesce(func.sum(Product.current_stock), 0)).where(Product.is_active.is_(True))
    ) or 0
    receipts = db.scalar(select(func.count(PurchaseReceipt.id))) or 0
    issues = db.scalar(select(func.count(StockMovement.id)).where(StockMovement.movement_type == "ISSUE")) or 0
    alerts = db.scalars(
        select(Product).where(
            Product.is_active.is_(True), Product.current_stock <= Product.minimum_stock
        ).order_by(Product.current_stock).limit(8)
    ).all()
    recent = db.scalars(
        select(StockMovement).order_by(StockMovement.created_at.desc()).limit(8)
    ).all()
    return {
        "total_products": total_products,
        "total_suppliers": total_suppliers,
        "low_stock_count": low_stock,
        "total_units": int(total_units),
        "receipt_count": receipts,
        "issue_count": issues,
        "low_stock_products": [
            {"id": p.id, "sku": p.sku, "name": p.name, "current_stock": p.current_stock,
             "minimum_stock": p.minimum_stock} for p in alerts
        ],
        "recent_movements": [
            {"id": m.id, "product_name": m.product.name, "movement_type": m.movement_type,
             "quantity": m.quantity, "created_at": m.created_at.isoformat()} for m in recent
        ],
    }
