import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Eye, EyeOff, AlertCircle, CheckCircle } from "lucide-react";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ username: "", email: "", full_name: "", password: "", confirm: "" });
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const rules = [
    { ok: form.password.length >= 8, label: "At least 8 characters" },
    { ok: /[A-Z]/.test(form.password), label: "One uppercase letter" },
    { ok: /\d/.test(form.password), label: "One number" },
    { ok: form.password === form.confirm && form.confirm.length > 0, label: "Passwords match" },
  ];

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirm) { setError("Passwords do not match"); return; }
    if (form.password.length < 8) { setError("Password must be at least 8 characters"); return; }
    setError("");
    setLoading(true);
    try {
      await register({ username: form.username, email: form.email, full_name: form.full_name || undefined, password: form.password });
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080c14] p-6 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-[#00d4c8]/3 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-[#a855f7]/3 rounded-full blur-3xl" />

      <div className="w-full max-w-md relative animate-fade-in">
        <div className="flex items-center gap-2.5 mb-8">
          <div className="w-9 h-9 rounded-xl bg-[#00d4c8]/10 border border-[#00d4c8]/30 flex items-center justify-center">
            <Zap className="w-4.5 h-4.5 text-[#00d4c8]" />
          </div>
          <span className="text-base font-bold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>ChainGuard</span>
        </div>

        <div className="bg-[#0d1220] border border-[#1f2d44] rounded-2xl p-8">
          <h2 className="text-2xl font-bold text-[#e8eef8] mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>Create account</h2>
          <p className="text-sm text-[#7a8fad] mb-6">Join your team on ChainGuard</p>

          <form onSubmit={submit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-mono font-medium text-[#7a8fad] mb-1.5 uppercase tracking-wider">Username *</label>
                <input
                  type="text"
                  value={form.username}
                  onChange={set("username")}
                  required
                  placeholder="johndoe"
                  className="w-full bg-[#131929] border border-[#1f2d44] rounded-lg px-3 py-2 text-sm text-[#e8eef8] placeholder-[#3a4e6a] transition-all"
                />
              </div>
              <div>
                <label className="block text-[10px] font-mono font-medium text-[#7a8fad] mb-1.5 uppercase tracking-wider">Full Name</label>
                <input
                  type="text"
                  value={form.full_name}
                  onChange={set("full_name")}
                  placeholder="John Doe"
                  className="w-full bg-[#131929] border border-[#1f2d44] rounded-lg px-3 py-2 text-sm text-[#e8eef8] placeholder-[#3a4e6a] transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-medium text-[#7a8fad] mb-1.5 uppercase tracking-wider">Email *</label>
              <input
                type="email"
                value={form.email}
                onChange={set("email")}
                required
                placeholder="john@company.com"
                className="w-full bg-[#131929] border border-[#1f2d44] rounded-lg px-3 py-2 text-sm text-[#e8eef8] placeholder-[#3a4e6a] transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-medium text-[#7a8fad] mb-1.5 uppercase tracking-wider">Password *</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={form.password}
                  onChange={set("password")}
                  required
                  placeholder="Min. 8 characters"
                  className="w-full bg-[#131929] border border-[#1f2d44] rounded-lg px-3 py-2 text-sm text-[#e8eef8] placeholder-[#3a4e6a] pr-10 transition-all"
                />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5e7a]">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-mono font-medium text-[#7a8fad] mb-1.5 uppercase tracking-wider">Confirm Password *</label>
              <input
                type="password"
                value={form.confirm}
                onChange={set("confirm")}
                required
                placeholder="Repeat password"
                className="w-full bg-[#131929] border border-[#1f2d44] rounded-lg px-3 py-2 text-sm text-[#e8eef8] placeholder-[#3a4e6a] transition-all"
              />
            </div>

            {form.password && (
              <div className="grid grid-cols-2 gap-1.5">
                {rules.map((r) => (
                  <div key={r.label} className={`flex items-center gap-1.5 text-[10px] ${r.ok ? "text-[#22c55e]" : "text-[#4a5e7a]"}`}>
                    <CheckCircle className={`w-3 h-3 flex-shrink-0 ${r.ok ? "text-[#22c55e]" : "text-[#4a5e7a]"}`} />
                    {r.label}
                  </div>
                ))}
              </div>
            )}

            {error && (
              <div className="flex items-center gap-2 bg-[#ef4444]/10 border border-[#ef4444]/25 rounded-lg px-3 py-2.5 text-sm text-[#ef4444]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00d4c8] hover:bg-[#00a89e] disabled:opacity-50 disabled:cursor-not-allowed text-[#080c14] font-semibold py-2.5 rounded-lg text-sm transition-all mt-1"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {loading ? "Creating account..." : "Create account"}
            </button>
          </form>

          <p className="text-center text-sm text-[#4a5e7a] mt-5">
            Already have an account?{" "}
            <Link to="/login" className="text-[#00d4c8] hover:text-[#00a89e] transition-colors">Sign in</Link>
          </p>
        </div>
        <p className="text-center text-[10px] text-[#3a4e6a] mt-4">
          The first registered user automatically becomes Admin.
        </p>
      </div>
    </div>
  );
}
