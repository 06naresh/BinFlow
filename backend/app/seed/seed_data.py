from decimal import Decimal
from sqlalchemy import select
from app.db.session import SessionLocal
from app.models.entities import Category, Product, Supplier, StockMovement


def seed():
    db = SessionLocal()
    try:
        categories = ["Electronics", "Accessories", "Stationery"]
        category_map = {}
        for name in categories:
            obj = db.scalar(select(Category).where(Category.name == name))
            if obj is None:
                obj = Category(name=name)
                db.add(obj)
                db.flush()
            category_map[name] = obj.id

        supplier = db.scalar(select(Supplier).where(Supplier.name == "Global Supplies"))
        if supplier is None:
            db.add(Supplier(name="Global Supplies", email="orders@example.com",
                            phone="+91 9000000000", address="Hyderabad, India"))

        products = [
            ("ELEC-001", "Laptop Pro", "Electronics", Decimal("65000"), 5, 3),
            ("ELEC-002", "Wireless Mouse", "Electronics", Decimal("850"), 5, 2),
            ("ACC-001", "USB Cable", "Accessories", Decimal("250"), 10, 60),
            ("STA-001", "Notebook", "Stationery", Decimal("80"), 20, 200),
        ]
        for sku, name, cat, price, minimum, stock in products:
            obj = db.scalar(select(Product).where(Product.sku == sku))
            if obj is None:
                product = Product(sku=sku, name=name, category_id=category_map[cat],
                                   unit_price=price, minimum_stock=minimum, current_stock=stock)
                db.add(product)
                db.flush()
                if stock > 0:
                    db.add(StockMovement(product_id=product.id, movement_type="ADJUSTMENT_IN",
                                         quantity=stock, reference_type="SEED", notes="Opening sample balance"))
        db.commit()
        print("BinFlow sample data ready.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
