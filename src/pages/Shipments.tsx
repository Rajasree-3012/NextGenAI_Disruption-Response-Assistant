import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { Plus, Search, Pencil, Trash2, ShoppingCart, ChevronDown, ChevronUp } from "lucide-react";

const STATUSES = ["pending", "in_transit", "delayed", "delivered", "cancelled"];
const EMPTY_FORM = { reference: "", supplier_id: 0, warehouse_id: 0, status: "pending", carrier: "", tracking_number: "", expected_arrival: "", notes: "", items: [] as any[] };

function ShipmentForm({ value, onChange, suppliers, warehouses, products }: any) {
  const addItem = () => onChange("items", [...value.items, { product_id: 0, quantity: 0 }]);
  const updateItem = (i: number, k: string, v: any) => {
    const items = [...value.items];
    items[i] = { ...items[i], [k]: v };
    onChange("items", items);
  };
  const removeItem = (i: number) => onChange("items", value.items.filter((_: any, idx: number) => idx !== i));

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Reference *</label>
          <input className="form-input font-mono" value={value.reference} onChange={e => onChange("reference", e.target.value)} placeholder="SHP-2024-001" />
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-input" value={value.status} onChange={e => onChange("status", e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Supplier *</label>
          <select className="form-input" value={value.supplier_id} onChange={e => onChange("supplier_id", parseInt(e.target.value) || 0)}>
            <option value={0}>Select supplier</option>
            {suppliers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Warehouse</label>
          <select className="form-input" value={value.warehouse_id} onChange={e => onChange("warehouse_id", parseInt(e.target.value) || 0)}>
            <option value={0}>Select warehouse</option>
            {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Carrier</label>
          <input className="form-input" value={value.carrier} onChange={e => onChange("carrier", e.target.value)} />
        </div>
        <div>
          <label className="form-label">Tracking #</label>
          <input className="form-input font-mono" value={value.tracking_number} onChange={e => onChange("tracking_number", e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="form-label">Expected Arrival</label>
          <input className="form-input" type="datetime-local" value={value.expected_arrival} onChange={e => onChange("expected_arrival", e.target.value)} />
        </div>
        <div className="col-span-2">
          <label className="form-label">Notes</label>
          <textarea className="form-input resize-none" rows={2} value={value.notes} onChange={e => onChange("notes", e.target.value)} />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="form-label mb-0">Line Items</label>
          <button type="button" onClick={addItem} className="text-xs text-[#00d4c8] hover:text-[#00a89e] flex items-center gap-1 transition-colors">
            <Plus className="w-3 h-3" /> Add item
          </button>
        </div>
        {value.items.map((item: any, i: number) => (
          <div key={i} className="flex gap-2 mb-2">
            <select className="form-input flex-1" value={item.product_id} onChange={e => updateItem(i, "product_id", parseInt(e.target.value) || 0)}>
              <option value={0}>Select product</option>
              {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
            </select>
            <input className="form-input w-24 font-mono" type="number" min="0" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, "quantity", parseInt(e.target.value) || 0)} />
            <button type="button" onClick={() => removeItem(i)} className="icon-btn-red flex-shrink-0">
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Shipments() {
  const { isOperator, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => Promise.all([api.shipments(), api.suppliers(), api.warehouses(), api.products()])
    .then(([s, sup, w, p]) => { setData(s); setSuppliers(sup); setWarehouses(w); setProducts(p); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditing(null); setModal("add"); };
  const openEdit = (s: any) => {
    setForm({
      reference: s.reference, supplier_id: s.supplier_id, warehouse_id: s.warehouse_id || 0,
      status: s.status, carrier: s.carrier || "", tracking_number: s.tracking_number || "",
      expected_arrival: s.expected_arrival ? s.expected_arrival.slice(0, 16) : "", notes: s.notes || "",
      items: (s.items || []).map((i: any) => ({ product_id: i.product_id, quantity: i.quantity })),
    });
    setEditing(s); setModal("edit");
  };
  const close = () => setModal(null);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, expected_arrival: form.expected_arrival || null, warehouse_id: form.warehouse_id || null };
      if (modal === "edit" && editing) await api.updateShipment(editing.id, payload);
      else await api.createShipment(payload);
      await load(); close();
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this shipment?")) return;
    await api.deleteShipment(id);
    setData(d => d.filter(x => x.id !== id));
  };

  const filtered = data.filter(s =>
    s.reference.toLowerCase().includes(search.toLowerCase()) ||
    s.supplier?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.carrier?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>Shipments</h1>
          <p className="text-sm text-[#7a8fad] mt-0.5">
            {data.filter(s => s.status === "in_transit").length} in transit · {data.filter(s => s.status === "delayed").length} delayed
          </p>
        </div>
        {user && (
          <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> New Shipment</button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5e7a]" />
        <input className="form-input pl-9 w-full sm:w-72" placeholder="Search shipments..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-[#0d1220] border border-[#1f2d44] rounded-xl overflow-hidden">
        {loading ? <div className="py-12 text-center text-sm text-[#4a5e7a]">Loading...</div> :
         filtered.length === 0 ? (
          <div className="py-12 text-center">
            <ShoppingCart className="w-8 h-8 text-[#1f2d44] mx-auto mb-3" />
            <p className="text-sm text-[#4a5e7a]">No shipments found</p>
          </div>
        ) : (
          <div className="divide-y divide-[#111827]">
            {filtered.map(s => (
              <div key={s.id}>
                <button
                  className="w-full flex items-center gap-4 px-4 py-3.5 hover:bg-[#131929] transition-colors text-left"
                  onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                >
                  <div className="w-8 h-8 rounded-lg bg-[#131929] border border-[#1f2d44] flex items-center justify-center flex-shrink-0">
                    <ShoppingCart className="w-3.5 h-3.5 text-[#a855f7]" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-semibold font-mono text-[#e8eef8]">{s.reference}</span>
                      <Badge value={s.status} />
                    </div>
                    <p className="text-xs text-[#7a8fad] mt-0.5">{s.supplier?.name} · {s.carrier || "No carrier"}</p>
                  </div>
                  <div className="text-right hidden sm:block">
                    <p className="text-xs font-mono text-[#4a5e7a]">Expected</p>
                    <p className="text-xs text-[#7a8fad]">
                      {s.expected_arrival ? new Date(s.expected_arrival).toLocaleDateString() : "—"}
                    </p>
                  </div>
                  {isOperator && (
                    <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                      <button onClick={() => openEdit(s)} className="icon-btn"><Pencil className="w-3.5 h-3.5" /></button>
                      <button onClick={() => del(s.id)} className="icon-btn-red"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  )}
                  {expanded === s.id ? <ChevronUp className="w-4 h-4 text-[#4a5e7a] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#4a5e7a] flex-shrink-0" />}
                </button>
                {expanded === s.id && (
                  <div className="px-4 pb-4 bg-[#080c14] border-t border-[#111827]">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
                      <div><p className="text-[#4a5e7a] font-mono mb-0.5">TRACKING</p><p className="font-mono text-[#e8eef8]">{s.tracking_number || "—"}</p></div>
                      <div><p className="text-[#4a5e7a] font-mono mb-0.5">ARRIVED</p><p className="text-[#7a8fad]">{s.actual_arrival ? new Date(s.actual_arrival).toLocaleDateString() : "—"}</p></div>
                      <div><p className="text-[#4a5e7a] font-mono mb-0.5">ITEMS</p><p className="text-[#e8eef8]">{s.items?.length || 0}</p></div>
                      <div><p className="text-[#4a5e7a] font-mono mb-0.5">NOTES</p><p className="text-[#7a8fad]">{s.notes || "—"}</p></div>
                    </div>
                    {s.items?.length > 0 && (
                      <table className="w-full data-table mt-2 rounded-xl overflow-hidden">
                        <thead><tr><th className="text-left">Product</th><th className="text-right">Qty</th></tr></thead>
                        <tbody>
                          {s.items.map((item: any) => (
                            <tr key={item.id}>
                              <td>{item.product?.name || `#${item.product_id}`}<span className="text-[10px] text-[#4a5e7a] ml-2 font-mono">{item.product?.sku}</span></td>
                              <td className="text-right font-mono">{item.quantity}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal open={!!modal} onClose={close} title={modal === "edit" ? "Edit Shipment" : "New Shipment"} size="lg">
        <ShipmentForm value={form} onChange={(k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))} suppliers={suppliers} warehouses={warehouses} products={products} />
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={close} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving || !form.reference || !form.supplier_id} className="btn-primary">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
