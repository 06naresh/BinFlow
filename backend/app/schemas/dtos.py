from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, EmailStr


class ORMModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


# -------------------------
# Categories
# -------------------------

class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    description: str | None = None


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    description: str | None = None


class CategoryOut(ORMModel):
    id: int
    name: str
    description: str | None


# -------------------------
# Products
# -------------------------

class ProductCreate(BaseModel):
    sku: str = Field(min_length=1, max_length=50)
    name: str = Field(min_length=1, max_length=160)
    description: str | None = None
    category_id: int | None = None
    unit_price: Decimal = Field(default=0, ge=0)
    minimum_stock: int = Field(default=5, ge=0)


class ProductUpdate(BaseModel):
    sku: str | None = Field(default=None, min_length=1, max_length=50)
    name: str | None = Field(default=None, min_length=1, max_length=160)
    description: str | None = None
    category_id: int | None = None
    unit_price: Decimal | None = Field(default=None, ge=0)
    minimum_stock: int | None = Field(default=None, ge=0)
    is_active: bool | None = None


class ProductOut(ORMModel):
    id: int
    sku: str
    name: str
    description: str | None
    category_id: int | None
    unit_price: Decimal
    minimum_stock: int
    current_stock: int
    is_active: bool
    created_at: datetime


# -------------------------
# Suppliers
# -------------------------

class SupplierCreate(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None


class SupplierUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    email: EmailStr | None = None
    phone: str | None = None
    address: str | None = None


class SupplierOut(ORMModel):
    id: int
    name: str
    email: str | None
    phone: str | None
    address: str | None
    created_at: datetime


# -------------------------
# Stock receipts and issues
# -------------------------

class ReceiptItemIn(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)
    unit_cost: Decimal = Field(ge=0)


class ReceiptCreate(BaseModel):
    supplier_id: int
    reference_number: str = Field(min_length=1, max_length=80)
    notes: str | None = None
    items: list[ReceiptItemIn] = Field(min_length=1)


class IssueItemIn(BaseModel):
    product_id: int
    quantity: int = Field(gt=0)


class IssueCreate(BaseModel):
    notes: str | None = None
    items: list[IssueItemIn] = Field(min_length=1)


class MovementOut(ORMModel):
    id: int
    product_id: int
    movement_type: str
    quantity: int
    reference_type: str | None
    reference_id: int | None
    notes: str | None
    created_at: datetime