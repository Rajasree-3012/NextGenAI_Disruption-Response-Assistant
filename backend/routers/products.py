from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from backend.database import get_db
from backend.models import User, Product
from backend.auth import get_current_user, require_operator
from backend.schemas import ProductOut, ProductCreate

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("/", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return db.query(Product).order_by(Product.name).all()


@router.post("/", response_model=ProductOut)
def create_product(req: ProductCreate, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    if db.query(Product).filter(Product.sku == req.sku).first():
        raise HTTPException(status_code=400, detail="SKU already exists")
    p = Product(**req.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.patch("/{product_id}", response_model=ProductOut)
def update_product(product_id: int, req: ProductCreate, db: Session = Depends(get_db), _: User = Depends(require_operator)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    for k, v in req.model_dump().items():
        setattr(p, k, v)
    db.commit()
    db.refresh(p)
    return p


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db), _: User = Depends(require_operator)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(status_code=404, detail="Product not found")
    db.delete(p)
    db.commit()
    return {"ok": True}
