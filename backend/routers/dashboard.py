from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Supplier, Product, Shipment, Order, StockItem, DisruptionNotice
from backend.models import SupplierStatus, ShipmentStatus, OrderStatus
from backend.auth import get_current_user
from backend.schemas import DashboardStats

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("/stats", response_model=DashboardStats)
def get_stats(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return DashboardStats(
        total_suppliers=db.query(Supplier).count(),
        active_suppliers=db.query(Supplier).filter(Supplier.status == SupplierStatus.active).count(),
        total_products=db.query(Product).count(),
        total_shipments=db.query(Shipment).count(),
        in_transit_shipments=db.query(Shipment).filter(Shipment.status == ShipmentStatus.in_transit).count(),
        delayed_shipments=db.query(Shipment).filter(Shipment.status == ShipmentStatus.delayed).count(),
        total_orders=db.query(Order).count(),
        pending_orders=db.query(Order).filter(Order.status == OrderStatus.pending).count(),
        at_risk_orders=db.query(Order).filter(Order.status == OrderStatus.at_risk).count(),
        total_disruptions=db.query(DisruptionNotice).count(),
        low_stock_items=db.query(StockItem).filter(
            StockItem.quantity <= StockItem.reorder_level,
            StockItem.reorder_level > 0,
        ).count(),
    )
