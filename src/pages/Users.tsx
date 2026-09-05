import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import Badge from "@/components/Badge";
import Modal from "@/components/Modal";
import { Plus, Pencil, Trash2, Users as UsersIcon, Shield } from "lucide-react";

const ROLES = ["admin", "operator", "viewer"];
const EMPTY = { username: "", email: "", full_name: "", password: "", role: "viewer" };

export default function Users() {
  const { user: me } = useAuth();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [saving, setSaving] = useState(false);

  const load = () => api.users().then(setData).finally(() => setLoading(false));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setForm(EMPTY); setEditing(null); setModal("add"); };
  const openEdit = (u: any) => { setForm({ username: u.username, email: u.email, full_name: u.full_name || "", password: "", role: u.role, is_active: u.is_active }); setEditing(u); setModal("edit"); };
  const close = () => setModal(null);
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm((f: any) => ({ ...f, [k]: e.target.value }));

  const save = async () => {
    setSaving(true);
    try {
      if (modal === "edit" && editing) {
        await api.updateUser(editing.id, { full_name: form.full_name, role: form.role, is_active: form.is_active !== undefined ? form.is_active : 1 });
      } else {
        await api.createUser(form);
      }
      await load(); close();
    } finally { setSaving(false); }
  };

  const del = async (id: number) => {
    if (!confirm("Delete this user?")) return;
    await api.deleteUser(id);
    setData(d => d.filter(x => x.id !== id));
  };

  const toggle = async (u: any) => {
    await api.updateUser(u.id, { is_active: u.is_active ? 0 : 1 });
    setData(d => d.map(x => x.id === u.id ? { ...x, is_active: x.is_active ? 0 : 1 } : x));
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>User Management</h1>
          <p className="text-sm text-[#7a8fad] mt-0.5">{data.length} users · role-based access control</p>
        </div>
        <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add User</button>
      </div>

      {/* Role legend */}
      <div className="flex flex-wrap gap-3">
        {[
          { role: "admin", desc: "Full access — manage users, all data" },
          { role: "operator", desc: "Analyze disruptions, edit data" },
          { role: "viewer", desc: "Read-only access" },
        ].map(r => (
          <div key={r.role} className="flex items-center gap-2 text-xs text-[#7a8fad]">
            <Badge value={r.role} variant="role" />
            <span>{r.desc}</span>
          </div>
        ))}
      </div>

      <div className="bg-[#0d1220] border border-[#1f2d44] rounded-xl overflow-hidden">
        {loading ? <div className="py-12 text-center text-sm text-[#4a5e7a]">Loading...</div> :
         data.length === 0 ? (
          <div className="py-12 text-center">
            <UsersIcon className="w-8 h-8 text-[#1f2d44] mx-auto mb-3" />
            <p className="text-sm text-[#4a5e7a]">No users yet</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full data-table">
              <thead><tr>
                <th className="text-left">User</th>
                <th className="text-left">Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
                <th />
              </tr></thead>
              <tbody>
                {data.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center flex-shrink-0 ${
                          u.role === "admin" ? "bg-[#a855f7]/15 border-[#a855f7]/25" :
                          u.role === "operator" ? "bg-[#00d4c8]/15 border-[#00d4c8]/25" :
                          "bg-[#7a8fad]/15 border-[#7a8fad]/25"
                        }`}>
                          {u.role === "admin"
                            ? <Shield className="w-3.5 h-3.5 text-[#a855f7]" />
                            : <span className="text-xs font-semibold text-[#7a8fad]">{u.username?.[0]?.toUpperCase()}</span>
                          }
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#e8eef8]">{u.full_name || u.username}</p>
                          <p className="text-[10px] text-[#4a5e7a] font-mono">@{u.username}</p>
                        </div>
                        {u.id === me?.id && <span className="text-[9px] font-mono text-[#00d4c8] border border-[#00d4c8]/30 rounded px-1">YOU</span>}
                      </div>
                    </td>
                    <td className="text-xs text-[#7a8fad]">{u.email}</td>
                    <td className="text-center"><Badge value={u.role} variant="role" /></td>
                    <td className="text-center">
                      <button
                        onClick={() => u.id !== me?.id && toggle(u)}
                        disabled={u.id === me?.id}
                        className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-all ${
                          u.is_active
                            ? "bg-[#22c55e]/10 text-[#22c55e] border-[#22c55e]/25 hover:bg-[#22c55e]/20"
                            : "bg-[#ef4444]/10 text-[#ef4444] border-[#ef4444]/25 hover:bg-[#ef4444]/20"
                        } disabled:cursor-not-allowed disabled:opacity-50`}
                      >
                        {u.is_active ? "ACTIVE" : "DISABLED"}
                      </button>
                    </td>
                    <td className="text-xs font-mono text-[#4a5e7a]">{new Date(u.created_at).toLocaleDateString()}</td>
                    <td>
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(u)} className="icon-btn"><Pencil className="w-3.5 h-3.5" /></button>
                        {u.id !== me?.id && (
                          <button onClick={() => del(u.id)} className="icon-btn-red"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Modal open={!!modal} onClose={close} title={modal === "edit" ? "Edit User" : "Add User"}>
        <div className="space-y-3">
          {modal === "add" && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="form-label">Username *</label>
                  <input className="form-input" value={form.username} onChange={set("username")} />
                </div>
                <div>
                  <label className="form-label">Full Name</label>
                  <input className="form-input" value={form.full_name} onChange={set("full_name")} />
                </div>
              </div>
              <div>
                <label className="form-label">Email *</label>
                <input className="form-input" type="email" value={form.email} onChange={set("email")} />
              </div>
              <div>
                <label className="form-label">Password *</label>
                <input className="form-input" type="password" value={form.password} onChange={set("password")} />
              </div>
            </>
          )}
          {modal === "edit" && (
            <div>
              <label className="form-label">Full Name</label>
              <input className="form-input" value={form.full_name} onChange={set("full_name")} />
            </div>
          )}
          <div>
            <label className="form-label">Role</label>
            <select className="form-input" value={form.role} onChange={set("role")}>
              {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button onClick={close} className="btn-ghost">Cancel</button>
          <button onClick={save} disabled={saving} className="btn-primary">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </Modal>
    </div>
  );
}
