from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.models import User, Shipment, ShipmentItem
from backend.auth import get_current_user, require_operator
from backend.schemas import ShipmentOut, ShipmentCreate

router = APIRouter(prefix="/api/shipments", tags=["shipments"])


@router.get("/", response_model=list[ShipmentOut])
def list_shipments(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Shipment).options(
        joinedload(Shipment.supplier),
        joinedload(Shipment.items).joinedload(ShipmentItem.product),
    ).order_by(Shipment.created_at.desc()).all()


@router.post("/", response_model=ShipmentOut)
def create_shipment(req: ShipmentCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if db.query(Shipment).filter(Shipment.reference == req.reference).first():
        raise HTTPException(status_code=400, detail="Shipment reference already exists")
    data = req.model_dump()
    items_data = data.pop("items", [])
    s = Shipment(**data)
    db.add(s)
    db.flush()
    for item in items_data:
        db.add(ShipmentItem(shipment_id=s.id, **item))
    db.commit()
    db.refresh(s)
    return db.query(Shipment).options(
        joinedload(Shipment.supplier),
        joinedload(Shipment.items).joinedload(ShipmentItem.product),
    ).filter(Shipment.id == s.id).first()


@router.patch("/{shipment_id}", response_model=ShipmentOut)
def update_shipment(shipment_id: int, req: ShipmentCreate, db: Session = Depends(get_db), _: User = Depends(require_operator)):
    s = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")
    data = req.model_dump()
    items_data = data.pop("items", [])
    for k, v in data.items():
        setattr(s, k, v)
    db.query(ShipmentItem).filter(ShipmentItem.shipment_id == s.id).delete()
    for item in items_data:
        db.add(ShipmentItem(shipment_id=s.id, **item))
    db.commit()
    return db.query(Shipment).options(
        joinedload(Shipment.supplier),
        joinedload(Shipment.items).joinedload(ShipmentItem.product),
    ).filter(Shipment.id == s.id).first()


@router.delete("/{shipment_id}")
def delete_shipment(shipment_id: int, db: Session = Depends(get_db), _: User = Depends(require_operator)):
    s = db.query(Shipment).filter(Shipment.id == shipment_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Shipment not found")
    db.delete(s)
    db.commit()
    return {"ok": True}
