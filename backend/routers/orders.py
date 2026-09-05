from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.models import User, Order, OrderItem
from backend.auth import get_current_user, require_operator
from backend.schemas import OrderOut, OrderCreate

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.get("/", response_model=list[OrderOut])
def list_orders(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
    ).order_by(Order.created_at.desc()).all()


@router.post("/", response_model=OrderOut)
def create_order(req: OrderCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if db.query(Order).filter(Order.reference == req.reference).first():
        raise HTTPException(status_code=400, detail="Order reference already exists")
    data = req.model_dump()
    items_data = data.pop("items", [])
    o = Order(**data)
    db.add(o)
    db.flush()
    for item in items_data:
        db.add(OrderItem(order_id=o.id, **item))
    db.commit()
    db.refresh(o)
    return db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
    ).filter(Order.id == o.id).first()


@router.patch("/{order_id}", response_model=OrderOut)
def update_order(order_id: int, req: OrderCreate, db: Session = Depends(get_db), _: User = Depends(require_operator)):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    data = req.model_dump()
    items_data = data.pop("items", [])
    for k, v in data.items():
        setattr(o, k, v)
    db.query(OrderItem).filter(OrderItem.order_id == o.id).delete()
    for item in items_data:
        db.add(OrderItem(order_id=o.id, **item))
    db.commit()
    return db.query(Order).options(
        joinedload(Order.items).joinedload(OrderItem.product),
    ).filter(Order.id == o.id).first()


@router.delete("/{order_id}")
def delete_order(order_id: int, db: Session = Depends(get_db), _: User = Depends(require_operator)):
    o = db.query(Order).filter(Order.id == order_id).first()
    if not o:
        raise HTTPException(status_code=404, detail="Order not found")
    db.delete(o)
    db.commit()
    return {"ok": True}
