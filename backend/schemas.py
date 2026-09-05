from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional, List, Any
from datetime import datetime
from backend.models import UserRole, SupplierStatus, ShipmentStatus, OrderStatus, OrderPriority, DisruptionSeverity


# Auth
class Token(BaseModel):
    user: "UserOut"


class RegisterRequest(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    email: str
    full_name: Optional[str] = None
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(character.isupper() for character in value) or not any(character.isdigit() for character in value):
            raise ValueError("Password must contain an uppercase letter and a number")
        return value


# User
class UserOut(BaseModel):
    id: int
    username: str
    email: str
    full_name: Optional[str]
    role: UserRole
    is_active: int
    created_at: datetime
    model_config = {"from_attributes": True}


class UserCreate(BaseModel):
    username: str = Field(min_length=3, max_length=80)
    email: str
    full_name: Optional[str] = None
    password: str = Field(min_length=8, max_length=128)

    @field_validator("password")
    @classmethod
    def validate_password(cls, value: str) -> str:
        if not any(character.isupper() for character in value) or not any(character.isdigit() for character in value):
            raise ValueError("Password must contain an uppercase letter and a number")
        return value
    role: UserRole = UserRole.viewer


class UserUpdate(BaseModel):
    full_name: Optional[str] = None
    role: Optional[UserRole] = None
    is_active: Optional[int] = None


# Warehouse
class WarehouseBase(BaseModel):
    name: str
    location: Optional[str] = None
    capacity: int = 0


class WarehouseCreate(WarehouseBase):
    pass


class WarehouseOut(WarehouseBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


# Supplier
class SupplierBase(BaseModel):
    name: str
    contact_name: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    country: Optional[str] = None
    status: SupplierStatus = SupplierStatus.active
    lead_time_days: int = 0
    reliability_score: float = 0.0


class SupplierCreate(SupplierBase):
    pass


class SupplierOut(SupplierBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


# Product
class ProductBase(BaseModel):
    name: str
    sku: str
    category: Optional[str] = None
    unit: str = "units"
    unit_cost: float = 0.0


class ProductCreate(ProductBase):
    pass


class ProductOut(ProductBase):
    id: int
    created_at: datetime
    model_config = {"from_attributes": True}


# Stock
class StockItemBase(BaseModel):
    warehouse_id: int
    product_id: int
    quantity: int = 0
    reserved_quantity: int = 0
    reorder_level: int = 0
    reorder_quantity: int = 0


class StockItemCreate(StockItemBase):
    pass


class StockItemOut(StockItemBase):
    id: int
    updated_at: datetime
    product: Optional[ProductOut] = None
    warehouse: Optional[WarehouseOut] = None
    model_config = {"from_attributes": True}


# Shipment Items
class ShipmentItemBase(BaseModel):
    product_id: int
    quantity: int = 0


class ShipmentItemCreate(ShipmentItemBase):
    pass


class ShipmentItemOut(ShipmentItemBase):
    id: int
    product: Optional[ProductOut] = None
    model_config = {"from_attributes": True}


# Shipment
class ShipmentBase(BaseModel):
    reference: str
    supplier_id: int
    warehouse_id: Optional[int] = None
    status: ShipmentStatus = ShipmentStatus.pending
    carrier: Optional[str] = None
    tracking_number: Optional[str] = None
    expected_arrival: Optional[datetime] = None
    notes: Optional[str] = None


class ShipmentCreate(ShipmentBase):
    items: List[ShipmentItemCreate] = []


class ShipmentOut(ShipmentBase):
    id: int
    actual_arrival: Optional[datetime]
    created_at: datetime
    items: List[ShipmentItemOut] = []
    supplier: Optional[SupplierOut] = None
    model_config = {"from_attributes": True}


# Order Items
class OrderItemBase(BaseModel):
    product_id: int
    quantity: int = 0
    unit_price: float = 0.0


class OrderItemCreate(OrderItemBase):
    pass


class OrderItemOut(OrderItemBase):
    id: int
    product: Optional[ProductOut] = None
    model_config = {"from_attributes": True}


# Order
class OrderBase(BaseModel):
    reference: str
    customer_name: str
    customer_email: Optional[str] = None
    customer_phone: Optional[str] = None
    status: OrderStatus = OrderStatus.pending
    priority: OrderPriority = OrderPriority.medium
    expected_delivery: Optional[datetime] = None
    notes: Optional[str] = None
    total_value: float = 0.0


class OrderCreate(OrderBase):
    items: List[OrderItemCreate] = []


class OrderOut(OrderBase):
    id: int
    actual_delivery: Optional[datetime]
    created_at: datetime
    items: List[OrderItemOut] = []
    model_config = {"from_attributes": True}


# Disruption
class DisruptionCreate(BaseModel):
    raw_text: str


class DisruptionOut(BaseModel):
    id: int
    title: Optional[str]
    raw_text: str
    source_type: Optional[str]
    severity: DisruptionSeverity
    analysis_result: Optional[Any]
    affected_orders_count: int
    affected_shipments_count: int
    affected_suppliers_count: int
    created_at: datetime
    created_by_user: Optional[UserOut] = None
    model_config = {"from_attributes": True}


# Dashboard
class DashboardStats(BaseModel):
    total_suppliers: int
    active_suppliers: int
    total_products: int
    total_shipments: int
    in_transit_shipments: int
    delayed_shipments: int
    total_orders: int
    pending_orders: int
    at_risk_orders: int
    total_disruptions: int
    low_stock_items: int
