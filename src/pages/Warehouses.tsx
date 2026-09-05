import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Modal from "@/components/Modal";
import { Plus, Search, Pencil, Trash2, Warehouse as WHIcon } from "lucide-react";

const EMPTY = { name: "", location: "", capacity: 0 };

export default function Warehouses() {
  const { isOperator, user } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => api.warehouses().then(setData).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal("add"); };
  const openEdit = (w: any) => { setForm({ ...w }); setEditing(w); setModal("edit"); };
  const close = () => setModal(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f: any) => ({ ...f, [k]: k === "capacity" ? parseInt(e.target.value) || 0 : e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      if (modal === "edit" && editing) await api.updateWarehouse(editing.id, form);
      else await api.createWarehouse(form);
      await load(); close();
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this warehouse?")) return;
    await api.deleteWarehouse(id);
    setData(d => d.filter(x => x.id !== id));
  };

  const filtered = data.filter(w =>
    w.name.toLowerCase().includes(search.toLowerCase()) ||
    w.location?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>Warehouses</h1>
          <p className="text-sm text-[#7a8fad] mt-0.5">{data.length} warehouse locations</p>
        </div>
        {user && (
          <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Warehouse</button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#4a5e7a]" />
        <input className="form-input pl-9 w-full sm:w-72" placeholder="Search warehouses..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-[#0d1220] border border-[#1f2d44] rounded-xl p-5 h-32 animate-pulse" />
        )) : filtered.length === 0 ? (
          <div className="col-span-full py-12 text-center">
            <WHIcon className="w-8 h-8 text-[#1f2d44] mx-auto mb-3" />
            <p className="text-sm text-[#4a5e7a]">No warehouses found</p>
          </div>
        ) : filtered.map(w => (
          <div key={w.id} className="bg-[#0d1220] border border-[#1f2d44] rounded-xl p-5 hover:border-[#2a3d5a] transition-all group">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-[#3b82f6]/10 border border-[#3b82f6]/25 flex items-center justify-center">
                <WHIcon className="w-5 h-5 text-[#3b82f6]" />
              </div>
              {isOperator && (
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => openEdit(w)} className="icon-btn"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => del(w.id)} className="icon-btn-red"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
            </div>
            <h3 className="text-sm font-semibold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>{w.name}</h3>
            <p className="text-xs text-[#7a8fad] mt-0.5">{w.location || "No location set"}</p>
            <div className="mt-3 pt-3 border-t border-[#1f2d44] flex items-center gap-3">
              <div>
                <p className="text-[10px] text-[#4a5e7a] font-mono">CAPACITY</p>
                <p className="text-xs font-mono text-[#e8eef8]">{w.capacity.toLocaleString()}</p>
              </div>
              <div className="w-px h-6 bg-[#1f2d44]" />
              <div>
                <p className="text-[10px] text-[#4a5e7a] font-mono">ID</p>
                <p className="text-xs font-mono text-[#e8eef8]">{w.id}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Modal open={!!modal} onClose={close} title={modal === "edit" ? "Edit Warehouse" : "Add Warehouse"}>
        <div className="space-y-3">
          <div>
            <label className="form-label">Warehouse Name *</label>
            <input className="form-input" value={form.name} onChange={set("name")} required />
          </div>
          <div>
            <label className="form-label">Location</label>
            <input className="form-input" value={form.location} onChange={set("location")} placeholder="City, Country" />
          </div>
          <div>
            <label className="form-label">Capacity (units)</label>
            <input className="form-input" type="number" min="0" value={form.capacity} onChange={set("capacity")} />
          </div>
        </div>
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
