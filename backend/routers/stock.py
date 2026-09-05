from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.models import User, StockItem
from backend.auth import get_current_user, require_operator
from backend.schemas import StockItemOut, StockItemCreate

router = APIRouter(prefix="/api/stock", tags=["stock"])


@router.get("/", response_model=list[StockItemOut])
def list_stock(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(StockItem).options(
        joinedload(StockItem.product),
        joinedload(StockItem.warehouse),
    ).all()


@router.post("/", response_model=StockItemOut)
def create_stock(req: StockItemCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    existing = db.query(StockItem).filter(
        StockItem.warehouse_id == req.warehouse_id,
        StockItem.product_id == req.product_id,
    ).first()
    if existing:
        raise HTTPException(status_code=400, detail="Stock entry already exists for this product+warehouse")
    s = StockItem(**req.model_dump())
    db.add(s)
    db.commit()
    db.refresh(s)
    return db.query(StockItem).options(joinedload(StockItem.product), joinedload(StockItem.warehouse)).filter(StockItem.id == s.id).first()


@router.patch("/{stock_id}", response_model=StockItemOut)
def update_stock(stock_id: int, req: StockItemCreate, db: Session = Depends(get_db), _: User = Depends(require_operator)):
    s = db.query(StockItem).filter(StockItem.id == stock_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Stock item not found")
    for k, v in req.model_dump().items():
        setattr(s, k, v)
    db.commit()
    db.refresh(s)
    return db.query(StockItem).options(joinedload(StockItem.product), joinedload(StockItem.warehouse)).filter(StockItem.id == s.id).first()


@router.delete("/{stock_id}")
def delete_stock(stock_id: int, db: Session = Depends(get_db), _: User = Depends(require_operator)):
    s = db.query(StockItem).filter(StockItem.id == stock_id).first()
    if not s:
        raise HTTPException(status_code=404, detail="Stock item not found")
    db.delete(s)
    db.commit()
    return {"ok": True}
