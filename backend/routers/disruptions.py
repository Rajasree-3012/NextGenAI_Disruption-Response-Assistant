import json
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from backend.database import get_db
from backend.models import User, DisruptionNotice, DisruptionSeverity
from backend.auth import get_current_user, require_operator
from backend.schemas import DisruptionOut, DisruptionCreate
from backend.services.disruption_analyzer import analyze

router = APIRouter(prefix="/api/disruptions", tags=["disruptions"])


@router.get("/", response_model=list[DisruptionOut])
def list_disruptions(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    notices = db.query(DisruptionNotice).options(
        joinedload(DisruptionNotice.created_by_user)
    ).order_by(DisruptionNotice.created_at.desc()).all()
    result = []
    for n in notices:
        out = DisruptionOut.model_validate(n)
        if n.analysis_result:
            try:
                out.analysis_result = json.loads(n.analysis_result)
            except Exception:
                out.analysis_result = n.analysis_result
        result.append(out)
    return result


@router.post("/analyze", response_model=DisruptionOut)
def analyze_disruption(
    req: DisruptionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_operator),
):
    result = analyze(req.raw_text, db)
    severity_str = result.get("disruption_info", {}).get("severity", "none")
    try:
        severity = DisruptionSeverity(severity_str)
    except ValueError:
        severity = DisruptionSeverity.none

    title = result.get("disruption_info", {}).get("primary_type", "unknown").replace("_", " ").title()
    source_type = result.get("source_type", "unstructured_notice")
    n_orders = len(result.get("impact", {}).get("at_risk_orders", []))
    n_ships = len(result.get("impact", {}).get("affected_shipments", []))
    n_suppliers = len(result.get("matched_entities", {}).get("suppliers", []))

    notice = DisruptionNotice(
        title=title,
        raw_text=req.raw_text,
        source_type=source_type,
        severity=severity,
        analysis_result=json.dumps(result),
        affected_orders_count=n_orders,
        affected_shipments_count=n_ships,
        affected_suppliers_count=n_suppliers,
        created_by=current_user.id,
    )
    db.add(notice)
    db.commit()
    db.refresh(notice)

    out = DisruptionOut.model_validate(notice)
    out.analysis_result = result
    out.created_by_user = current_user
    return out


@router.get("/{notice_id}", response_model=DisruptionOut)
def get_disruption(notice_id: int, db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    n = db.query(DisruptionNotice).options(
        joinedload(DisruptionNotice.created_by_user)
    ).filter(DisruptionNotice.id == notice_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Disruption notice not found")
    out = DisruptionOut.model_validate(n)
    if n.analysis_result:
        try:
            out.analysis_result = json.loads(n.analysis_result)
        except Exception:
            pass
    return out


@router.delete("/{notice_id}")
def delete_disruption(notice_id: int, db: Session = Depends(get_db), _: User = Depends(require_operator)):
    n = db.query(DisruptionNotice).filter(DisruptionNotice.id == notice_id).first()
    if not n:
        raise HTTPException(status_code=404, detail="Not found")
    db.delete(n)
    db.commit()
    return {"ok": True}
