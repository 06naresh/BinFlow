def setup_records(client):
    category = client.post("/api/v1/categories", json={"name": "Hardware"}).json()
    product = client.post("/api/v1/products", json={
        "sku": "HW-001", "name": "Hammer", "category_id": category["id"],
        "unit_price": 10, "minimum_stock": 3
    }).json()
    supplier = client.post("/api/v1/suppliers", json={"name": "Acme Supplies"}).json()
    return product, supplier


def test_receipt_then_issue_and_history(client):
    product, supplier = setup_records(client)
    receipt = client.post("/api/v1/stock/receipts", json={
        "supplier_id": supplier["id"], "reference_number": "RCV-001",
        "items": [{"product_id": product["id"], "quantity": 10, "unit_cost": 8}]
    })
    assert receipt.status_code == 201

    issue = client.post("/api/v1/stock/issues", json={
        "items": [{"product_id": product["id"], "quantity": 4}]
    })
    assert issue.status_code == 200

    products = client.get("/api/v1/products").json()
    assert products[0]["current_stock"] == 6

    movements = client.get("/api/v1/stock/movements").json()
    assert [m["movement_type"] for m in movements] == ["ISSUE", "RECEIPT"]


def test_negative_stock_is_rejected(client):
    product, supplier = setup_records(client)
    response = client.post("/api/v1/stock/issues", json={
        "items": [{"product_id": product["id"], "quantity": 1}]
    })
    assert response.status_code == 409
    current = client.get("/api/v1/products").json()[0]["current_stock"]
    assert current == 0


def test_low_stock_filter(client):
    product, supplier = setup_records(client)
    client.post("/api/v1/stock/receipts", json={
        "supplier_id": supplier["id"], "reference_number": "RCV-002",
        "items": [{"product_id": product["id"], "quantity": 2, "unit_cost": 8}]
    })
    assert len(client.get("/api/v1/products?low_stock=true").json()) == 1
