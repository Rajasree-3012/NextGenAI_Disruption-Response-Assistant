from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Enum as SAEnum
from sqlalchemy.orm import relationship
from datetime import datetime, timezone
import enum
from backend.database import Base


class UserRole(str, enum.Enum):
    admin = "admin"
    operator = "operator"
    viewer = "viewer"


class SupplierStatus(str, enum.Enum):
    active = "active"
    suspended = "suspended"
    under_review = "under_review"


class ShipmentStatus(str, enum.Enum):
    pending = "pending"
    in_transit = "in_transit"
    delayed = "delayed"
    delivered = "delivered"
    cancelled = "cancelled"


class OrderStatus(str, enum.Enum):
    pending = "pending"
    confirmed = "confirmed"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    at_risk = "at_risk"
    delayed = "delayed"
    cancelled = "cancelled"


class OrderPriority(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"


class DisruptionSeverity(str, enum.Enum):
    critical = "critical"
    high = "high"
    medium = "medium"
    low = "low"
    none = "none"


class User(Base):
    __tablename__ = "users"
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, index=True, nullable=False)
    email = Column(String(120), unique=True, index=True, nullable=False)
    full_name = Column(String(150), nullable=True)
    hashed_password = Column(String(255), nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.viewer, nullable=False)
    is_active = Column(Integer, default=1)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    disruptions = relationship("DisruptionNotice", back_populates="created_by_user")


class Warehouse(Base):
    __tablename__ = "warehouses"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(120), nullable=False)
    location = Column(String(200), nullable=True)
    capacity = Column(Integer, default=0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    stock_items = relationship("StockItem", back_populates="warehouse")


class Supplier(Base):
    __tablename__ = "suppliers"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False, index=True)
    contact_name = Column(String(150), nullable=True)
    contact_email = Column(String(120), nullable=True)
    contact_phone = Column(String(50), nullable=True)
    country = Column(String(100), nullable=True)
    status = Column(SAEnum(SupplierStatus), default=SupplierStatus.active, nullable=False)
    lead_time_days = Column(Integer, default=0)
    reliability_score = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    shipments = relationship("Shipment", back_populates="supplier")
    products = relationship("SupplierProduct", back_populates="supplier")


class Product(Base):
    __tablename__ = "products"
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False, index=True)
    sku = Column(String(80), unique=True, nullable=False, index=True)
    category = Column(String(100), nullable=True)
    unit = Column(String(50), default="units")
    unit_cost = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    stock_items = relationship("StockItem", back_populates="product")
    order_items = relationship("OrderItem", back_populates="product")
    shipment_items = relationship("ShipmentItem", back_populates="product")
    supplier_products = relationship("SupplierProduct", back_populates="product")


class SupplierProduct(Base):
    __tablename__ = "supplier_products"
    id = Column(Integer, primary_key=True, index=True)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    supplier_sku = Column(String(80), nullable=True)
    price = Column(Float, default=0.0)
    lead_time_days = Column(Integer, default=0)
    supplier = relationship("Supplier", back_populates="products")
    product = relationship("Product", back_populates="supplier_products")


class StockItem(Base):
    __tablename__ = "stock_items"
    id = Column(Integer, primary_key=True, index=True)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=0)
    reserved_quantity = Column(Integer, default=0)
    reorder_level = Column(Integer, default=0)
    reorder_quantity = Column(Integer, default=0)
    updated_at = Column(DateTime, default=lambda: datetime.now(timezone.utc), onupdate=lambda: datetime.now(timezone.utc))
    warehouse = relationship("Warehouse", back_populates="stock_items")
    product = relationship("Product", back_populates="stock_items")


class Shipment(Base):
    __tablename__ = "shipments"
    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(80), unique=True, index=True, nullable=False)
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=False)
    warehouse_id = Column(Integer, ForeignKey("warehouses.id"), nullable=True)
    status = Column(SAEnum(ShipmentStatus), default=ShipmentStatus.pending, nullable=False)
    carrier = Column(String(100), nullable=True)
    tracking_number = Column(String(150), nullable=True)
    expected_arrival = Column(DateTime, nullable=True)
    actual_arrival = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    supplier = relationship("Supplier", back_populates="shipments")
    items = relationship("ShipmentItem", back_populates="shipment")


class ShipmentItem(Base):
    __tablename__ = "shipment_items"
    id = Column(Integer, primary_key=True, index=True)
    shipment_id = Column(Integer, ForeignKey("shipments.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=0)
    shipment = relationship("Shipment", back_populates="items")
    product = relationship("Product", back_populates="shipment_items")


class Order(Base):
    __tablename__ = "orders"
    id = Column(Integer, primary_key=True, index=True)
    reference = Column(String(80), unique=True, index=True, nullable=False)
    customer_name = Column(String(200), nullable=False)
    customer_email = Column(String(120), nullable=True)
    customer_phone = Column(String(50), nullable=True)
    status = Column(SAEnum(OrderStatus), default=OrderStatus.pending, nullable=False)
    priority = Column(SAEnum(OrderPriority), default=OrderPriority.medium, nullable=False)
    expected_delivery = Column(DateTime, nullable=True)
    actual_delivery = Column(DateTime, nullable=True)
    notes = Column(Text, nullable=True)
    total_value = Column(Float, default=0.0)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "order_items"
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    quantity = Column(Integer, default=0)
    unit_price = Column(Float, default=0.0)
    order = relationship("Order", back_populates="items")
    product = relationship("Product", back_populates="order_items")


class DisruptionNotice(Base):
    __tablename__ = "disruption_notices"
    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(250), nullable=True)
    raw_text = Column(Text, nullable=False)
    source_type = Column(String(80), nullable=True)
    severity = Column(SAEnum(DisruptionSeverity), default=DisruptionSeverity.none, nullable=False)
    analysis_result = Column(Text, nullable=True)
    affected_orders_count = Column(Integer, default=0)
    affected_shipments_count = Column(Integer, default=0)
    affected_suppliers_count = Column(Integer, default=0)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=lambda: datetime.now(timezone.utc))
    created_by_user = relationship("User", back_populates="disruptions")
