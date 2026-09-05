import { useState, FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Zap, Eye, EyeOff, AlertCircle } from "lucide-react";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(username, password);
      navigate("/");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex bg-[#080c14]">
      {/* Left panel - decorative */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 bg-[#0d1220] border-r border-[#1f2d44] p-12 relative overflow-hidden">
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-96 h-96 bg-[#00d4c8]/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#a855f7]/5 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
          {/* Grid pattern */}
          <div className="absolute inset-0" style={{
            backgroundImage: `linear-gradient(rgba(31,45,68,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(31,45,68,0.4) 1px, transparent 1px)`,
            backgroundSize: "40px 40px",
          }} />
        </div>
        <div className="relative">
          <div className="flex items-center gap-3 mb-16">
            <div className="w-10 h-10 rounded-xl bg-[#00d4c8]/10 border border-[#00d4c8]/30 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#00d4c8]" />
            </div>
            <span className="text-lg font-bold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>ChainGuard</span>
          </div>
          <h1 className="text-4xl font-bold text-[#e8eef8] leading-tight mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
            Supply Chain<br />
            <span className="gradient-text">Disruption Response</span>
          </h1>
          <p className="text-[#7a8fad] text-base leading-relaxed max-w-xs">
            Analyze disruption notices, trace impacts across your supply chain, and get ranked action plans — instantly.
          </p>
        </div>
        {/* Stats */}
        <div className="relative grid grid-cols-3 gap-4">
          {[
            { label: "Trace Speed", value: "<2s", sub: "per analysis" },
            { label: "Impact Depth", value: "Full", sub: "chain coverage" },
            { label: "Action Plans", value: "Auto", sub: "ranked & cited" },
          ].map((s) => (
            <div key={s.label} className="bg-[#131929] border border-[#1f2d44] rounded-xl p-3">
              <p className="text-lg font-bold text-[#00d4c8]" style={{ fontFamily: "Outfit, sans-serif" }}>{s.value}</p>
              <p className="text-xs text-[#e8eef8] font-medium">{s.label}</p>
              <p className="text-[10px] text-[#4a5e7a]">{s.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-9 h-9 rounded-xl bg-[#00d4c8]/10 border border-[#00d4c8]/30 flex items-center justify-center">
              <Zap className="w-4.5 h-4.5 text-[#00d4c8]" />
            </div>
            <span className="text-base font-bold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>ChainGuard</span>
          </div>

          <h2 className="text-2xl font-bold text-[#e8eef8] mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>Sign in</h2>
          <p className="text-sm text-[#7a8fad] mb-8">Access your supply chain dashboard</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-[#7a8fad] mb-1.5 font-mono">USERNAME OR EMAIL</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                autoComplete="username"
                placeholder="Enter your username or email"
                className="w-full bg-[#0d1220] border border-[#1f2d44] rounded-lg px-3.5 py-2.5 text-sm text-[#e8eef8] placeholder-[#3a4e6a] transition-all"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#7a8fad] mb-1.5 font-mono">PASSWORD</label>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  className="w-full bg-[#0d1220] border border-[#1f2d44] rounded-lg px-3.5 py-2.5 text-sm text-[#e8eef8] placeholder-[#3a4e6a] pr-10 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5e7a] hover:text-[#7a8fad]"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 bg-[#ef4444]/10 border border-[#ef4444]/25 rounded-lg px-3 py-2.5 text-sm text-[#ef4444]">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00d4c8] hover:bg-[#00a89e] disabled:opacity-50 disabled:cursor-not-allowed text-[#080c14] font-semibold py-2.5 rounded-lg text-sm transition-all duration-150 mt-2"
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          <p className="text-center text-sm text-[#4a5e7a] mt-6">
            No account?{" "}
            <Link to="/register" className="text-[#00d4c8] hover:text-[#00a89e] transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
