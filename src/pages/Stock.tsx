import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Modal from "@/components/Modal";
import { Plus, Search, Pencil, Trash2, BarChart3, AlertTriangle } from "lucide-react";

const EMPTY = { warehouse_id: 0, product_id: 0, quantity: 0, reserved_quantity: 0, reorder_level: 0, reorder_quantity: 0 };

function StockBar({ qty, reserved, reorder }: { qty: number; reserved: number; reorder: number }) {
  if (qty === 0 && reorder === 0) return <div className="text-[10px] text-[#4a5e7a] font-mono">—</div>;
  const pct = reorder > 0 ? Math.min(100, (qty / Math.max(reorder * 2, 1)) * 100) : 50;
  const color = qty <= 0 ? "bg-[#ef4444]" : qty <= reorder ? "bg-[#f59e0b]" : "bg-[#22c55e]";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-[#131929] rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color} transition-all`} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-[10px] font-mono text-[#7a8fad] w-10 text-right">{qty}</span>
    </div>
  );
}

export default function Stock() {
  const { isOperator, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => Promise.all([api.stock(), api.products(), api.warehouses()])
    .then(([s, p, w]) => { setData(s); setProducts(p); setWarehouses(w); })
    .finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal("add"); };
  const openEdit = (s: any) => { setForm({ warehouse_id: s.warehouse_id, product_id: s.product_id, quantity: s.quantity, reserved_quantity: s.reserved_quantity, reorder_level: s.reorder_level, reorder_quantity: s.reorder_quantity }); setEditing(s); setModal("edit"); };
  const close = () => setModal(null);
  const num = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setForm((f: any) => ({ ...f, [k]: parseInt(e.target.value) || 0 }));

  const save = async () => {
    setSaving(true);
    try {
      if (modal === "edit" && editing) await api.updateStock(editing.id, form);
      else await api.createStock(form);
      await load(); close();
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this stock entry?")) return;
    await api.deleteStock(id);
    setData(d => d.filter(x => x.id !== id));
  };

  const filtered = data.filter(s =>
    s.product?.name?.toLowerCase().includes(search.toLowerCase()) ||
    s.product?.sku?.toLowerCase().includes(search.toLowerCase()) ||
    s.warehouse?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const lowStock = data.filter(s => s.reorder_level > 0 && s.quantity <= s.reorder_level);

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>Stock Levels</h1>
          <p className="text-sm text-[#7a8fad] mt-0.5">{data.length} stock entries · {lowStock.length} low/critical</p>
        </div>
        {user && (
          <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Stock</button>
        )}
      </div>

      {lowStock.length > 0 && (
        <div className="flex items-center gap-3 bg-[#f59e0b]/8 border border-[#f59e0b]/25 rounded-xl px-4 py-3">
          <AlertTriangle className="w-4.5 h-4.5 text-[#f59e0b] flex-shrink-0" />
          <span className="text-sm text-[#f59e0b]">{lowStock.length} item{lowStock.length !== 1 ? "s are" : " is"} at or below reorder level</span>
        </div>
      )}

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5e7a]" />
        <input className="form-input pl-9 w-full sm:w-72" placeholder="Search by product or warehouse..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-[#0d1220] border border-[#1f2d44] rounded-xl overflow-hidden">
        {loading ? <div className="py-12 text-center text-sm text-[#4a5e7a]">Loading...</div> :
         filtered.length === 0 ? (
          <div className="py-12 text-center">
            <BarChart3 className="w-8 h-8 text-[#1f2d44] mx-auto mb-3" />
            <p className="text-sm text-[#4a5e7a]">No stock entries found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead><tr>
                <th className="text-left">Product</th>
                <th className="text-left">Warehouse</th>
                <th className="text-right">Qty</th>
                <th className="text-right">Reserved</th>
                <th className="text-right">Available</th>
                <th className="text-right">Reorder At</th>
                <th className="w-32">Level</th>
                {isOperator && <th />}
              </tr></thead>
              <tbody>
                {filtered.map(s => {
                  const available = s.quantity - s.reserved_quantity;
                  const isCrit = s.reorder_level > 0 && s.quantity <= 0;
                  const isLow = s.reorder_level > 0 && s.quantity <= s.reorder_level;
                  return (
                    <tr key={s.id} className={isCrit ? "bg-[#ef4444]/5" : isLow ? "bg-[#f59e0b]/5" : ""}>
                      <td>
                        <p className="text-sm font-medium text-[#e8eef8]">{s.product?.name || `#${s.product_id}`}</p>
                        <p className="text-[10px] font-mono text-[#4a5e7a]">{s.product?.sku}</p>
                      </td>
                      <td className="text-xs text-[#7a8fad]">{s.warehouse?.name || `#${s.warehouse_id}`}</td>
                      <td className="text-right font-mono text-xs">{s.quantity}</td>
                      <td className="text-right font-mono text-xs text-[#f59e0b]">{s.reserved_quantity}</td>
                      <td className={`text-right font-mono text-xs font-medium ${available <= 0 ? "text-[#ef4444]" : available <= s.reorder_level ? "text-[#f59e0b]" : "text-[#22c55e]"}`}>
                        {available}
                      </td>
                      <td className="text-right font-mono text-xs">{s.reorder_level}</td>
                      <td><StockBar qty={s.quantity} reserved={s.reserved_quantity} reorder={s.reorder_level} /></td>
                      {isOperator && (
                        <td>
                          <div className="flex items-center justify-end gap-1">
                            <button onClick={() => openEdit(s)} className="icon-btn"><Pencil className="w-3.5 h-3.5" /></button>
                            <button onClick={() => del(s.id)} className="icon-btn-red"><Trash2 className="w-3.5 h-3.5" /></button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!modal} onClose={close} title={modal === "edit" ? "Edit Stock" : "Add Stock Entry"}>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="form-label">Product *</label>
              <select className="form-input" value={form.product_id} onChange={e => setForm((f: any) => ({ ...f, product_id: parseInt(e.target.value) || 0 }))} disabled={modal === "edit"}>
                <option value={0}>Select product</option>
                {products.map((p: any) => <option key={p.id} value={p.id}>{p.name} ({p.sku})</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Warehouse *</label>
              <select className="form-input" value={form.warehouse_id} onChange={e => setForm((f: any) => ({ ...f, warehouse_id: parseInt(e.target.value) || 0 }))} disabled={modal === "edit"}>
                <option value={0}>Select warehouse</option>
                {warehouses.map((w: any) => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="form-label">Quantity</label>
              <input className="form-input" type="number" min="0" value={form.quantity} onChange={num("quantity")} />
            </div>
            <div>
              <label className="form-label">Reserved</label>
              <input className="form-input" type="number" min="0" value={form.reserved_quantity} onChange={num("reserved_quantity")} />
            </div>
            <div>
              <label className="form-label">Reorder Level</label>
              <input className="form-input" type="number" min="0" value={form.reorder_level} onChange={num("reorder_level")} />
            </div>
            <div>
              <label className="form-label">Reorder Qty</label>
              <input className="form-input" type="number" min="0" value={form.reorder_quantity} onChange={num("reorder_quantity")} />
            </div>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={close} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving || !form.product_id || !form.warehouse_id} className="btn-primary">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
