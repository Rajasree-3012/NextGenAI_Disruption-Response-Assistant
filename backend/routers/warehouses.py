from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Warehouse
from backend.auth import get_current_user, require_operator
from backend.schemas import WarehouseOut, WarehouseCreate

router = APIRouter(prefix="/api/warehouses", tags=["warehouses"])


@router.get("/", response_model=list[WarehouseOut])
def list_warehouses(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Warehouse).order_by(Warehouse.name).all()


@router.post("/", response_model=WarehouseOut)
def create_warehouse(req: WarehouseCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    w = Warehouse(**req.model_dump())
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


@router.patch("/{warehouse_id}", response_model=WarehouseOut)
def update_warehouse(warehouse_id: int, req: WarehouseCreate, db: Session = Depends(get_db), _: User = Depends(require_operator)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    for k, v in req.model_dump().items():
        setattr(w, k, v)
    db.commit()
    db.refresh(w)
    return w


@router.delete("/{warehouse_id}")
def delete_warehouse(warehouse_id: int, db: Session = Depends(get_db), _: User = Depends(require_operator)):
    w = db.query(Warehouse).filter(Warehouse.id == warehouse_id).first()
    if not w:
        raise HTTPException(status_code=404, detail="Warehouse not found")
    db.delete(w)
    db.commit()
    return {"ok": True}
