"""
Disruption Analyzer: parses unstructured notice text, maps to DB entities,
traces supply chain impact, and produces a ranked action plan.
"""
import re
import json
from datetime import datetime, timedelta, timezone
from difflib import SequenceMatcher
from typing import Optional
from sqlalchemy.orm import Session
from backend.models import (
    Supplier, Product, Shipment, Order, OrderItem, ShipmentItem,
    StockItem, ShipmentStatus, OrderStatus, DisruptionSeverity,
)


# ── Text utilities ────────────────────────────────────────────────────────────

def _similarity(a: str, b: str) -> float:
    return SequenceMatcher(None, a.lower(), b.lower()).ratio()


def _best_match(needle: str, candidates: list[tuple], threshold: float = 0.55):
    """Return (obj, score) for the best fuzzy match or None."""
    best, best_score = None, 0.0
    for obj, name in candidates:
        s = _similarity(needle, name)
        if s > best_score:
            best, best_score = obj, s
    return (best, best_score) if best_score >= threshold else (None, 0.0)


def _extract_dates(text: str) -> list[datetime]:
    patterns = [
        r"\b(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\b",
        r"\b(\d{4})[\/\-](\d{1,2})[\/\-](\d{1,2})\b",
    ]
    dates = []
    for p in patterns:
        for m in re.finditer(p, text):
            try:
                g = m.groups()
                if len(g[0]) == 4:
                    d = datetime(int(g[0]), int(g[1]), int(g[2]))
                else:
                    y = int(g[2])
                    if y < 100:
                        y += 2000
                    d = datetime(y, int(g[0]), int(g[1]))
                dates.append(d)
            except ValueError:
                pass
    return dates


def _extract_duration_days(text: str) -> Optional[int]:
    t = text.lower()
    patterns = [
        (r"(\d+)\s*(?:to\s*\d+\s*)?(?:business\s*)?days?", 1),
        (r"(\d+)\s*weeks?", 7),
        (r"(\d+)\s*months?", 30),
    ]
    for pat, mult in patterns:
        m = re.search(pat, t)
        if m:
            return int(m.group(1)) * mult
    return None


DISRUPTION_KEYWORDS = {
    "production_halt": [
        "production halt", "production stopped", "factory shutdown", "plant shutdown",
        "manufacturing stopped", "line down", "halt production", "ceased production",
        "production pause", "work stoppage",
    ],
    "delivery_delay": [
        "delivery delay", "delayed", "shipment delayed", "behind schedule", "late delivery",
        "transit delay", "logistics delay", "carrier delay", "port congestion",
        "customs hold", "customs delay", "vessel delay",
    ],
    "warehouse_incident": [
        "warehouse fire", "warehouse flood", "warehouse damage", "stock damaged",
        "inventory loss", "warehouse incident", "facility damage", "storage damage",
    ],
    "supplier_failure": [
        "supplier bankrupt", "supplier insolvency", "ceased operations", "business closure",
        "supplier failure", "supplier shutdown", "supplier ceased",
    ],
    "quality_issue": [
        "quality hold", "recall", "quality issue", "defective", "batch recall",
        "contamination", "out of spec", "non-conformance",
    ],
    "force_majeure": [
        "force majeure", "natural disaster", "flood", "earthquake", "hurricane",
        "storm damage", "fire", "power outage", "strike", "labor dispute",
    ],
}

SEVERITY_WEIGHTS = {
    "production_halt": 90,
    "supplier_failure": 85,
    "warehouse_incident": 75,
    "quality_issue": 65,
    "force_majeure": 70,
    "delivery_delay": 40,
}


def _classify_disruption(text: str) -> dict:
    t = text.lower()
    found_types = []
    for dtype, keywords in DISRUPTION_KEYWORDS.items():
        for kw in keywords:
            if kw in t:
                found_types.append(dtype)
                break

    if not found_types:
        found_types = ["unknown"]

    primary = max(found_types, key=lambda x: SEVERITY_WEIGHTS.get(x, 0))
    base_weight = SEVERITY_WEIGHTS.get(primary, 20)

    # Urgency modifiers
    urgent_words = ["immediately", "urgent", "critical", "emergency", "asap", "halt", "complete"]
    urgent_count = sum(1 for w in urgent_words if w in t)
    score = min(100, base_weight + urgent_count * 5)

    if score >= 80:
        severity = DisruptionSeverity.critical
    elif score >= 60:
        severity = DisruptionSeverity.high
    elif score >= 35:
        severity = DisruptionSeverity.medium
    else:
        severity = DisruptionSeverity.low

    return {
        "types": found_types,
        "primary_type": primary,
        "severity": severity.value,
        "urgency_score": score,
    }


def _source_type(text: str) -> str:
    t = text.lower()
    if any(w in t for w in ["dear", "sincerely", "regards", "subject:", "from:", "to:"]):
        return "supplier_email"
    if any(w in t for w in ["tracking", "carrier", "waybill", "consignment", "airway"]):
        return "carrier_notification"
    if any(w in t for w in ["incident report", "warehouse", "facility", "storage"]):
        return "warehouse_incident_report"
    return "unstructured_notice"


# ── Entity extraction ─────────────────────────────────────────────────────────

def _extract_entity_candidates(text: str) -> list[str]:
    """Extract candidate entity names: quoted strings, title-case runs, ref patterns."""
    candidates = []
    # Quoted strings
    candidates += re.findall(r'"([^"]+)"', text)
    candidates += re.findall(r"'([^']+)'", text)
    # Ref/ID patterns
    candidates += re.findall(r"\b(SHP-\w+|ORD-\w+|PO-\w+|INV-\w+|SHM\w+|ORD\w+)\b", text, re.I)
    # Title-case word groups (potential names)
    candidates += re.findall(r"\b([A-Z][a-z]+(?: [A-Z][a-z]+){1,4})\b", text)
    # ALL-CAPS abbreviations that look like company names
    candidates += re.findall(r"\b([A-Z]{2,8})\b", text)
    return list(set(candidates))


def _match_suppliers(candidates: list[str], db: Session) -> list[dict]:
    suppliers = db.query(Supplier).all()
    supplier_lookup = [(s, s.name) for s in suppliers]
    matched = []
    seen_ids = set()
    for cand in candidates:
        obj, score = _best_match(cand, supplier_lookup)
        if obj and obj.id not in seen_ids:
            seen_ids.add(obj.id)
            matched.append({"id": obj.id, "name": obj.name, "score": round(score, 2), "status": obj.status.value})
    return matched


def _match_shipments(candidates: list[str], text: str, db: Session) -> list[dict]:
    shipments = db.query(Shipment).all()
    # Direct reference match first
    matched = []
    seen_ids = set()
    for s in shipments:
        if s.reference.lower() in text.lower():
            seen_ids.add(s.id)
            matched.append({
                "id": s.id, "reference": s.reference,
                "status": s.status.value, "score": 1.0,
                "supplier_id": s.supplier_id,
            })
    # Fuzzy on reference
    ship_lookup = [(s, s.reference) for s in shipments if s.id not in seen_ids]
    for cand in candidates:
        obj, score = _best_match(cand, ship_lookup, threshold=0.75)
        if obj and obj.id not in seen_ids:
            seen_ids.add(obj.id)
            matched.append({
                "id": obj.id, "reference": obj.reference,
                "status": obj.status.value, "score": round(score, 2),
                "supplier_id": obj.supplier_id,
            })
    return matched


def _match_products(candidates: list[str], text: str, db: Session) -> list[dict]:
    products = db.query(Product).all()
    matched = []
    seen_ids = set()
    for p in products:
        if p.sku.lower() in text.lower() or p.name.lower() in text.lower():
            seen_ids.add(p.id)
            matched.append({"id": p.id, "name": p.name, "sku": p.sku, "score": 1.0})
    prod_lookup = [(p, p.name) for p in products if p.id not in seen_ids]
    for cand in candidates:
        obj, score = _best_match(cand, prod_lookup)
        if obj and obj.id not in seen_ids:
            seen_ids.add(obj.id)
            matched.append({"id": obj.id, "name": obj.name, "sku": obj.sku, "score": round(score, 2)})
    return matched


# ── Impact tracing ────────────────────────────────────────────────────────────

def _trace_impact(
    matched_suppliers: list[dict],
    matched_shipments: list[dict],
    matched_products: list[dict],
    disruption_info: dict,
    delay_days: Optional[int],
    db: Session,
) -> dict:
    affected_shipment_ids = {s["id"] for s in matched_shipments}
    affected_supplier_ids = {s["id"] for s in matched_suppliers}
    affected_product_ids = {p["id"] for p in matched_products}

    # Expand: shipments from affected suppliers that are in-transit or pending
    if affected_supplier_ids:
        supplier_shipments = db.query(Shipment).filter(
            Shipment.supplier_id.in_(affected_supplier_ids),
            Shipment.status.in_([ShipmentStatus.pending, ShipmentStatus.in_transit]),
        ).all()
        for s in supplier_shipments:
            if s.id not in affected_shipment_ids:
                affected_shipment_ids.add(s.id)
                matched_shipments.append({
                    "id": s.id, "reference": s.reference,
                    "status": s.status.value, "score": 0.9,
                    "supplier_id": s.supplier_id, "inferred": True,
                })

    # Products from affected shipments
    if affected_shipment_ids:
        ship_items = db.query(ShipmentItem).filter(
            ShipmentItem.shipment_id.in_(affected_shipment_ids)
        ).all()
        for si in ship_items:
            if si.product_id not in affected_product_ids:
                affected_product_ids.add(si.product_id)
                p = si.product
                if p:
                    matched_products.append({"id": p.id, "name": p.name, "sku": p.sku, "score": 0.85, "inferred": True})

    # Stock shortfalls for affected products
    stock_shortfalls = []
    if affected_product_ids:
        stock_items = db.query(StockItem).filter(
            StockItem.product_id.in_(affected_product_ids)
        ).all()
        for si in stock_items:
            available = si.quantity - si.reserved_quantity
            shortfall = max(0, si.reorder_level - available)
            stock_shortfalls.append({
                "product_id": si.product_id,
                "warehouse_id": si.warehouse_id,
                "quantity_available": available,
                "reorder_level": si.reorder_level,
                "shortfall": shortfall,
                "is_critical": available <= 0,
            })

    # Orders at risk: orders containing affected products that are not yet delivered
    at_risk_orders = []
    if affected_product_ids:
        order_items = db.query(OrderItem).filter(
            OrderItem.product_id.in_(affected_product_ids)
        ).all()
        seen_order_ids = set()
        for oi in order_items:
            if oi.order_id in seen_order_ids:
                continue
            seen_order_ids.add(oi.order_id)
            order = oi.order
            if not order:
                continue
            if order.status in (OrderStatus.delivered, OrderStatus.cancelled):
                continue
            # Calculate urgency
            days_until_delivery = None
            if order.expected_delivery:
                delta = order.expected_delivery.replace(tzinfo=None) - datetime.now()
                days_until_delivery = delta.days
            urgency_score = _order_urgency_score(order, days_until_delivery)
            at_risk_orders.append({
                "order_id": order.id,
                "reference": order.reference,
                "customer_name": order.customer_name,
                "customer_email": order.customer_email,
                "status": order.status.value,
                "priority": order.priority.value,
                "expected_delivery": order.expected_delivery.isoformat() if order.expected_delivery else None,
                "days_until_delivery": days_until_delivery,
                "total_value": order.total_value,
                "urgency_score": urgency_score,
                "affected_products": [
                    {"product_id": oi2.product_id, "quantity": oi2.quantity}
                    for oi2 in order.items
                    if oi2.product_id in affected_product_ids
                ],
                "options": _generate_options(order, days_until_delivery, delay_days, stock_shortfalls, affected_product_ids),
            })

    at_risk_orders.sort(key=lambda x: x["urgency_score"], reverse=True)
    return {
        "affected_shipments": matched_shipments,
        "affected_products": matched_products,
        "stock_shortfalls": stock_shortfalls,
        "at_risk_orders": at_risk_orders,
    }


def _order_urgency_score(order, days_until_delivery: Optional[int]) -> int:
    score = 0
    if order.priority.value == "critical":
        score += 50
    elif order.priority.value == "high":
        score += 35
    elif order.priority.value == "medium":
        score += 20
    else:
        score += 5
    if days_until_delivery is not None:
        if days_until_delivery <= 0:
            score += 50
        elif days_until_delivery <= 3:
            score += 40
        elif days_until_delivery <= 7:
            score += 25
        elif days_until_delivery <= 14:
            score += 10
    score += min(20, int(order.total_value / 5000))
    return score


def _generate_options(order, days_until_delivery, delay_days, stock_shortfalls, affected_product_ids) -> list[dict]:
    options = []
    delay = delay_days or 14

    # Option 1: Expedite
    expedite_cost_est = order.total_value * 0.15 if order.total_value else 0
    options.append({
        "action": "expedite",
        "label": "Expedite via air freight",
        "description": f"Source products from an alternative supplier or expedite shipping. Estimated additional cost: ${expedite_cost_est:,.0f} (≈15% surcharge). Timeline: 3–5 days faster than standard.",
        "pros": ["Fulfils order on time", "Maintains customer relationship"],
        "cons": ["Higher cost", "Requires alternative supplier availability"],
        "recommended_if": "Order value justifies premium and alternative source exists",
    })

    # Option 2: Part-ship
    options.append({
        "action": "part_ship",
        "label": "Part-ship available stock",
        "description": "Immediately ship items currently in stock. Backorder affected products and ship when supply resumes.",
        "pros": ["Customer receives partial order promptly", "No cancellation"],
        "cons": ["Customer receives split shipment", "Additional handling and shipping cost"],
        "recommended_if": "Partial stock is available and customer has flexibility",
    })

    # Option 3: Reallocate
    options.append({
        "action": "reallocate",
        "label": "Reallocate stock from lower-priority orders",
        "description": "Divert stock reserved for lower-priority orders to fulfil this order. Other orders will be delayed.",
        "pros": ["Uses existing inventory", "No additional cost"],
        "cons": ["Downstream impact on other orders", "Requires operator judgement on priority"],
        "recommended_if": "This order outranks others holding the same product",
    })

    # Option 4: Inform customer
    new_date = None
    if order.expected_delivery:
        new_date = (order.expected_delivery + timedelta(days=delay)).strftime("%d %b %Y")
    options.append({
        "action": "inform_customer",
        "label": "Communicate delay to customer",
        "description": f"Notify customer of disruption and provide revised delivery date{f' ({new_date})' if new_date else ''}. Offer discount or credit as goodwill.",
        "pros": ["Transparent", "Sets accurate expectation", "Low immediate cost"],
        "cons": ["Customer dissatisfaction", "Potential cancellation"],
        "recommended_if": "No expedite option available or order value is low",
    })

    return options


def _recommend_action(order_entry: dict, disruption_info: dict) -> str:
    priority = order_entry.get("priority", "medium")
    days = order_entry.get("days_until_delivery")
    value = order_entry.get("total_value", 0)

    if priority == "critical" or (days is not None and days <= 2):
        return "expedite"
    if priority == "high" and value > 10000:
        return "expedite"
    if days is not None and days <= 7:
        return "part_ship"
    if days is not None and days > 14:
        return "inform_customer"
    return "part_ship"


# ── Main entry point ──────────────────────────────────────────────────────────

def analyze(raw_text: str, db: Session) -> dict:
    # Extract
    candidates = _extract_entity_candidates(raw_text)
    disruption_info = _classify_disruption(raw_text)
    source_type = _source_type(raw_text)
    delay_days = _extract_duration_days(raw_text)
    dates = [d.isoformat() for d in _extract_dates(raw_text)]

    # Match
    matched_suppliers = _match_suppliers(candidates, db)
    matched_shipments = _match_shipments(candidates, raw_text, db)
    matched_products = _match_products(candidates, raw_text, db)

    has_matches = bool(matched_suppliers or matched_shipments or matched_products)

    if not has_matches:
        return {
            "disruption_info": disruption_info,
            "source_type": source_type,
            "extracted_dates": dates,
            "delay_days": delay_days,
            "matched_entities": {"suppliers": [], "shipments": [], "products": []},
            "impact": {"affected_shipments": [], "affected_products": [], "stock_shortfalls": [], "at_risk_orders": []},
            "summary": "This notice could not be mapped to any known suppliers, shipments, or products in the system. No impact detected.",
            "no_impact": True,
            "action_plan": [],
        }

    impact = _trace_impact(matched_suppliers, matched_shipments, matched_products, disruption_info, delay_days, db)

    # Annotate recommendations
    for order in impact["at_risk_orders"]:
        order["recommended_action"] = _recommend_action(order, disruption_info)

    action_plan = []
    for i, order in enumerate(impact["at_risk_orders"][:10], 1):
        rec = order["recommended_action"]
        chosen_option = next((o for o in order["options"] if o["action"] == rec), order["options"][0])
        action_plan.append({
            "rank": i,
            "order_id": order["order_id"],
            "reference": order["reference"],
            "customer_name": order["customer_name"],
            "priority": order["priority"],
            "days_until_delivery": order["days_until_delivery"],
            "recommended_action": rec,
            "action_label": chosen_option["label"],
            "action_description": chosen_option["description"],
            "urgency_score": order["urgency_score"],
        })

    n_orders = len(impact["at_risk_orders"])
    n_ships = len(impact["affected_shipments"])
    n_sup = len(matched_suppliers)
    severity = disruption_info["severity"]

    summary_parts = [
        f"Disruption classified as **{disruption_info['primary_type'].replace('_', ' ').title()}** (severity: {severity}).",
    ]
    if n_sup:
        summary_parts.append(f"{n_sup} supplier(s) matched.")
    if n_ships:
        summary_parts.append(f"{n_ships} shipment(s) at risk.")
    if n_orders:
        summary_parts.append(f"{n_orders} customer order(s) affected — ranked by urgency.")
    else:
        summary_parts.append("No open orders are affected by this disruption.")

    return {
        "disruption_info": disruption_info,
        "source_type": source_type,
        "extracted_dates": dates,
        "delay_days": delay_days,
        "matched_entities": {
            "suppliers": matched_suppliers,
            "shipments": [s for s in matched_shipments],
            "products": matched_products,
        },
        "impact": impact,
        "summary": " ".join(summary_parts),
        "no_impact": n_orders == 0 and n_ships == 0,
        "action_plan": action_plan,
    }
