from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Supplier
from backend.auth import get_current_user, require_operator
from backend.schemas import SupplierOut, SupplierCreate

router = APIRouter(prefix="/api/suppliers", tags=["suppliers"])


@router.get("/", response_model=list[SupplierOut])
def list_suppliers(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Supplier).order_by(Supplier.name).all()


@router.post("/", response_model=SupplierOut)
def create_supplier(req: SupplierCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    s = Supplier(**req.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return s


@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(supplier_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return s


@router.patch("/{supplier_id}", response_model=SupplierOut)
def update_supplier(supplier_id: int, req: SupplierCreate, db: Session = Depends(get_db), _: User = Depends(require_operator)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    for k, v in req.model_dump().items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return s


@router.delete("/{supplier_id}")
def delete_supplier(supplier_id: int, db: Session = Depends(get_db), _: User = Depends(require_operator)):
    s = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Supplier not found")
    db.delete(s)
    db.commit()
    return {"ok": True}
