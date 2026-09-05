import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { Plus, Search, Pencil, Trash2, Package, ChevronDown, ChevronUp, Clock } from "lucide-react";

const STATUSES = ["pending", "confirmed", "processing", "shipped", "delivered", "at_risk", "delayed", "cancelled"];
const PRIORITIES = ["critical", "high", "medium", "low"];
const EMPTY_FORM = {
  reference: "", customer_name: "", customer_email: "", customer_phone: "",
  status: "pending", priority: "medium", expected_delivery: "", notes: "", total_value: 0, items: [] as any[],
};

function OrderForm({ value, onChange, products }: any) {
  const addItem = () => onChange("items", [...value.items, { product_id: 0, quantity: 0, unit_price: 0 }]);
  const updateItem = (i: number, k: string, v: any) => {
    const items = [...value.items];
    items[i] = { ...items[i], [k]: v };
    onChange("items", items);
  };
  const removeItem = (i: number) => onChange("items", value.items.filter((_: any, idx: number) => idx !== i));
  return (
    <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-1">
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="form-label">Order Ref *</label>
          <input className="form-input font-mono" value={value.reference} onChange={e => onChange("reference", e.target.value)} placeholder="ORD-2024-001" />
        </div>
        <div>
          <label className="form-label">Priority</label>
          <select className="form-input" value={value.priority} onChange={e => onChange("priority", e.target.value)}>
            {PRIORITIES.map(p => <option key={p} value={p}>{p}</option>)}
          </select>
        </div>
        <div className="col-span-2">
          <label className="form-label">Customer Name *</label>
          <input className="form-input" value={value.customer_name} onChange={e => onChange("customer_name", e.target.value)} />
        </div>
        <div>
          <label className="form-label">Customer Email</label>
          <input className="form-input" type="email" value={value.customer_email} onChange={e => onChange("customer_email", e.target.value)} />
        </div>
        <div>
          <label className="form-label">Customer Phone</label>
          <input className="form-input" value={value.customer_phone} onChange={e => onChange("customer_phone", e.target.value)} />
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-input" value={value.status} onChange={e => onChange("status", e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Total Value ($)</label>
          <input className="form-input" type="number" min="0" step="0.01" value={value.total_value} onChange={e => onChange("total_value", parseFloat(e.target.value) || 0)} />
        </div>
        <div className="col-span-2">
          <label className="form-label">Expected Delivery</label>
          <input className="form-input" type="datetime-local" value={value.expected_delivery} onChange={e => onChange("expected_delivery", e.target.value)} />
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
            <input className="form-input w-20 font-mono" type="number" min="0" placeholder="Qty" value={item.quantity} onChange={e => updateItem(i, "quantity", parseInt(e.target.value) || 0)} />
            <input className="form-input w-24 font-mono" type="number" min="0" step="0.01" placeholder="Price" value={item.unit_price} onChange={e => updateItem(i, "unit_price", parseFloat(e.target.value) || 0)} />
            <button type="button" onClick={() => removeItem(i)} className="icon-btn-red flex-shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Orders() {
  const { isOperator, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const load = () => Promise.all([api.orders(), api.products()])
    .then(([o, p]) => { setData(o); setProducts(p); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY_FORM); setEditing(null); setModal("add"); };
  const openEdit = (o: any) => {
    setForm({
      reference: o.reference, customer_name: o.customer_name, customer_email: o.customer_email || "",
      customer_phone: o.customer_phone || "", status: o.status, priority: o.priority,
      expected_delivery: o.expected_delivery ? o.expected_delivery.slice(0, 16) : "",
      notes: o.notes || "", total_value: o.total_value,
      items: (o.items || []).map((i: any) => ({ product_id: i.product_id, quantity: i.quantity, unit_price: i.unit_price })),
    });
    setEditing(o); setModal("edit");
  };
  const close = () => setModal(null);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, expected_delivery: form.expected_delivery || null };
      if (modal === "edit" && editing) await api.updateOrder(editing.id, payload);
      else await api.createOrder(payload);
      await load(); close();
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this order?")) return;
    await api.deleteOrder(id);
    setData(d => d.filter(x => x.id !== id));
  };

  const filtered = data
    .filter(o => filterStatus === "all" || o.status === filterStatus)
    .filter(o =>
      o.reference.toLowerCase().includes(search.toLowerCase()) ||
      o.customer_name.toLowerCase().includes(search.toLowerCase())
    );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>Orders</h1>
          <p className="text-sm text-[#7a8fad] mt-0.5">
            {data.filter(o => o.status === "at_risk").length} at risk · {data.filter(o => o.status === "pending").length} pending
          </p>
        </div>
        {user && (
          <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> New Order</button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5e7a]" />
          <input className="form-input pl-9 w-full sm:w-60" placeholder="Search orders..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="form-input" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="all">All statuses</option>
          {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
        </select>
      </div>

      <div className="bg-[#0d1220] border border-[#1f2d44] rounded-xl overflow-hidden">
        {loading ? <div className="py-12 text-center text-sm text-[#4a5e7a]">Loading...</div> :
         filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-8 h-8 text-[#1f2d44] mx-auto mb-3" />
            <p className="text-sm text-[#4a5e7a]">No orders found</p>
          </div>
        ) : (
          <div className="divide-y divide-[#111827]">
            {filtered.map(o => {
              const daysLeft = o.expected_delivery
                ? Math.ceil((new Date(o.expected_delivery).getTime() - Date.now()) / 86400000) : null;
              return (
                <div key={o.id}>
                  <button
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-[#131929] transition-colors text-left"
                    onClick={() => setExpanded(expanded === o.id ? null : o.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold font-mono text-[#e8eef8]">{o.reference}</span>
                        <Badge value={o.status} />
                        <Badge value={o.priority} variant="priority" />
                      </div>
                      <p className="text-xs text-[#7a8fad] mt-0.5">{o.customer_name}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-3 text-right flex-shrink-0">
                      {daysLeft !== null && (
                        <div className="flex items-center gap-1">
                          <Clock className={`w-3 h-3 ${daysLeft <= 0 ? "text-[#ef4444]" : daysLeft <= 3 ? "text-[#f59e0b]" : "text-[#4a5e7a]"}`} />
                          <span className={`text-xs font-mono ${daysLeft <= 0 ? "text-[#ef4444]" : daysLeft <= 3 ? "text-[#f59e0b]" : "text-[#7a8fad]"}`}>
                            {daysLeft <= 0 ? "OVERDUE" : `${daysLeft}d`}
                          </span>
                        </div>
                      )}
                      <div className="text-right">
                        <p className="text-xs font-mono text-[#e8eef8]">${o.total_value.toLocaleString()}</p>
                      </div>
                    </div>
                    {isOperator && (
                      <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                        <button onClick={() => openEdit(o)} className="icon-btn"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => del(o.id)} className="icon-btn-red"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                    {expanded === o.id ? <ChevronUp className="w-4 h-4 text-[#4a5e7a] flex-shrink-0" /> : <ChevronDown className="w-4 h-4 text-[#4a5e7a] flex-shrink-0" />}
                  </button>
                  {expanded === o.id && (
                    <div className="px-4 pb-4 bg-[#080c14] border-t border-[#111827]">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-3 text-xs">
                        <div><p className="text-[#4a5e7a] font-mono mb-0.5">EMAIL</p><p className="text-[#e8eef8]">{o.customer_email || "—"}</p></div>
                        <div><p className="text-[#4a5e7a] font-mono mb-0.5">PHONE</p><p className="text-[#e8eef8]">{o.customer_phone || "—"}</p></div>
                        <div><p className="text-[#4a5e7a] font-mono mb-0.5">DELIVERY</p><p className="text-[#7a8fad]">{o.expected_delivery ? new Date(o.expected_delivery).toLocaleDateString() : "—"}</p></div>
                        <div><p className="text-[#4a5e7a] font-mono mb-0.5">NOTES</p><p className="text-[#7a8fad]">{o.notes || "—"}</p></div>
                      </div>
                      {o.items?.length > 0 && (
                        <table className="w-full data-table mt-2">
                          <thead><tr><th className="text-left">Product</th><th className="text-right">Qty</th><th className="text-right">Unit Price</th><th className="text-right">Subtotal</th></tr></thead>
                          <tbody>
                            {o.items.map((item: any) => (
                              <tr key={item.id}>
                                <td>{item.product?.name || `#${item.product_id}`}<span className="text-[10px] text-[#4a5e7a] ml-2 font-mono">{item.product?.sku}</span></td>
                                <td className="text-right font-mono">{item.quantity}</td>
                                <td className="text-right font-mono">${item.unit_price.toFixed(2)}</td>
                                <td className="text-right font-mono">${(item.quantity * item.unit_price).toFixed(2)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Modal open={!!modal} onClose={close} title={modal === "edit" ? "Edit Order" : "New Order"} size="lg">
        <OrderForm value={form} onChange={(k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }))} products={products} />
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={close} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving || !form.reference || !form.customer_name} className="btn-primary">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
