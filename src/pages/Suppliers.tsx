import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { Plus, Search, Pencil, Trash2, Truck, Star } from "lucide-react";

const EMPTY = { name: "", contact_name: "", contact_email: "", contact_phone: "", country: "", status: "active", lead_time_days: 0, reliability_score: 0 };
const STATUSES = ["active", "suspended", "under_review"];

function Form({ value, onChange }: { value: any; onChange: (k: string, v: any) => void }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2">
          <label className="form-label">Supplier Name *</label>
          <input className="form-input" value={value.name} onChange={e => onChange("name", e.target.value)} required />
        </div>
        <div>
          <label className="form-label">Contact Name</label>
          <input className="form-input" value={value.contact_name} onChange={e => onChange("contact_name", e.target.value)} />
        </div>
        <div>
          <label className="form-label">Contact Email</label>
          <input className="form-input" type="email" value={value.contact_email} onChange={e => onChange("contact_email", e.target.value)} />
        </div>
        <div>
          <label className="form-label">Phone</label>
          <input className="form-input" value={value.contact_phone} onChange={e => onChange("contact_phone", e.target.value)} />
        </div>
        <div>
          <label className="form-label">Country</label>
          <input className="form-input" value={value.country} onChange={e => onChange("country", e.target.value)} />
        </div>
        <div>
          <label className="form-label">Status</label>
          <select className="form-input" value={value.status} onChange={e => onChange("status", e.target.value)}>
            {STATUSES.map(s => <option key={s} value={s}>{s.replace("_", " ")}</option>)}
          </select>
        </div>
        <div>
          <label className="form-label">Lead Time (days)</label>
          <input className="form-input" type="number" min="0" value={value.lead_time_days} onChange={e => onChange("lead_time_days", parseInt(e.target.value) || 0)} />
        </div>
        <div>
          <label className="form-label">Reliability Score (0–100)</label>
          <input className="form-input" type="number" min="0" max="100" step="0.1" value={value.reliability_score} onChange={e => onChange("reliability_score", parseFloat(e.target.value) || 0)} />
        </div>
      </div>
    </div>
  );
}

export default function Suppliers() {
  const { isOperator, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => api.suppliers().then(setData).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal("add"); };
  const openEdit = (s: any) => { setForm({ ...s }); setEditing(s); setModal("edit"); };
  const close = () => { setModal(null); setEditing(null); };

  const save = async () => {
    setSaving(true);
    try {
      if (modal === "edit" && editing) await api.updateSupplier(editing.id, form);
      else await api.createSupplier(form);
      await load();
      close();
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this supplier?")) return;
    await api.deleteSupplier(id);
    setData(d => d.filter(x => x.id !== id));
  };

  const filtered = data.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.country?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>Suppliers</h1>
          <p className="text-sm text-[#7a8fad] mt-0.5">{data.length} total · {data.filter(s => s.status === "active").length} active</p>
        </div>
        {user && (
          <button onClick={openAdd} className="btn-primary">
            <Plus className="w-4 h-4" /> Add Supplier
          </button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5e7a]" />
        <input className="form-input pl-9 w-full sm:w-72" placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="bg-[#0d1220] border border-[#1f2d44] rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-sm text-[#4a5e7a]">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center">
            <Truck className="w-8 h-8 text-[#1f2d44] mx-auto mb-3" />
            <p className="text-sm text-[#4a5e7a]">No suppliers found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead><tr>
                <th className="text-left">Supplier</th>
                <th className="text-left">Country</th>
                <th className="text-left">Contact</th>
                <th className="text-right">Lead Time</th>
                <th className="text-right">Reliability</th>
                <th>Status</th>
                {isOperator && <th />}
              </tr></thead>
              <tbody>
                {filtered.map(s => (
                  <tr key={s.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-lg bg-[#131929] border border-[#1f2d44] flex items-center justify-center flex-shrink-0">
                          <Truck className="w-3.5 h-3.5 text-[#00d4c8]" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#e8eef8]">{s.name}</p>
                          <p className="text-[10px] text-[#4a5e7a] font-mono">ID {s.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="text-[#7a8fad]">{s.country || "—"}</td>
                    <td>
                      <p className="text-xs text-[#e8eef8]">{s.contact_name || "—"}</p>
                      <p className="text-[10px] text-[#4a5e7a]">{s.contact_email || ""}</p>
                    </td>
                    <td className="text-right font-mono text-xs">{s.lead_time_days}d</td>
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Star className="w-3 h-3 text-[#f59e0b]" />
                        <span className="font-mono text-xs text-[#e8eef8]">{s.reliability_score}</span>
                      </div>
                    </td>
                    <td className="text-center"><Badge value={s.status} /></td>
                    {isOperator && (
                      <td>
                        <div className="flex items-center justify-end gap-1">
                          <button onClick={() => openEdit(s)} className="icon-btn"><Pencil className="w-3.5 h-3.5" /></button>
                          <button onClick={() => del(s.id)} className="icon-btn-red"><Trash2 className="w-3.5 h-3.5" /></button>
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

      <Modal open={!!modal} onClose={close} title={modal === "edit" ? "Edit Supplier" : "Add Supplier"}>
        <Form value={form} onChange={(k, v) => setForm((f: any) => ({ ...f, [k]: v }))} />
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={close} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving || !form.name} className="btn-primary">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
