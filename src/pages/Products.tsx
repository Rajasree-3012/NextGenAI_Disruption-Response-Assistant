import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Modal from "@/components/Modal";
import { Plus, Search, Pencil, Trash2, Package } from "lucide-react";

const EMPTY = { name: "", sku: "", category: "", unit: "units", unit_cost: 0 };

function Form({ value, onChange }: { value: any; onChange: (k: string, v: any) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="form-label">Product Name *</label>
          <input className="form-input" value={value.name} onChange={e => onChange("name", e.target.value)} required />
        </div>
        <div>
          <label className="form-label">SKU *</label>
          <input className="form-input font-mono" value={value.sku} onChange={e => onChange("sku", e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Category</label>
          <input className="form-input" value={value.category} onChange={e => onChange("category", e.target.value)} />
        </div>
        <div>
          <label className="form-label">Unit</label>
          <input className="form-input" value={value.unit} onChange={e => onChange("unit", e.target.value)} placeholder="units, kg, pcs..." />
        </div>
        <div>
          <label className="form-label">Unit Cost ($)</label>
          <input className="form-input" type="number" min="0" step="0.01" value={value.unit_cost} onChange={e => onChange("unit_cost", parseFloat(e.target.value) || 0)} />
        </div>
      </div>
    </div>
  );
}

export default function Products() {
  const { isOperator, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => api.products().then(setData).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal("add"); };
  const openEdit = (p: any) => { setForm({ ...p }); setEditing(p); setModal("edit"); };
  const close = () => setModal(null);

  const save = async () => {
    setSaving(true);
    try {
      if (modal === "edit" && editing) await api.updateProduct(editing.id, form);
      else await api.createProduct(form);
      await load(); close();
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this product?")) return;
    await api.deleteProduct(id);
    setData(d => d.filter(x => x.id !== id));
  };

  const filtered = data.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase()) ||
    p.category?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>Products</h1>
          <p className="text-sm text-[#7a8fad] mt-0.5">{data.length} products in catalog</p>
        </div>
        {user && (
          <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Product</button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5e7a]" />
        <input className="form-input pl-9 w-full sm:w-72" placeholder="Search by name or SKU..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-[#0d1220] border border-[#1f2d44] rounded-xl overflow-hidden">
        {loading ? <div className="py-12 text-center text-sm text-[#4a5e7a]">Loading...</div> :
         filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Package className="w-8 h-8 text-[#1f2d44] mx-auto mb-3" />
            <p className="text-sm text-[#4a5e7a]">No products found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead><tr>
                <th className="text-left">Product</th>
                <th className="text-left">SKU</th>
                <th className="text-left">Category</th>
                <th className="text-left">Unit</th>
                <th className="text-right">Unit Cost</th>
                {isOperator && <th />}
              </tr></thead>
              <tbody>
                {filtered.map(p => (
                  <tr key={p.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#131929] border border-[#1f2d44] flex items-center justify-center flex-shrink-0">
                          <Package className="w-3.5 h-3.5 text-[#a855f7]" />
                        </div>
                        <span className="text-sm font-medium text-[#e8eef8]">{p.name}</span>
                      </div>
                    </td>
                    <td><span className="font-mono text-xs text-[#00d4c8]">{p.sku}</span></td>
                    <td className="text-[#7a8fad] text-xs">{p.category || "—"}</td>
                    <td className="text-xs text-[#7a8fad]">{p.unit}</td>
                    <td className="text-right font-mono text-xs text-[#e8eef8]">${p.unit_cost.toFixed(2)}</td>
                    {isOperator && (
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(p)} className="icon-btn"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => del(p.id)} className="icon-btn-red"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!modal} onClose={close} title={modal === "edit" ? "Edit Product" : "Add Product"}>
        <Form value={form} onChange={(k, v) => setForm((f: any) => ({ ...f, [k]: v }))} />
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={close} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving || !form.name || !form.sku} className="btn-primary">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
