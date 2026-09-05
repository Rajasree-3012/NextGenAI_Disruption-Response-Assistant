import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  Truck, Package, ShoppingCart, AlertTriangle, TrendingDown,
  BarChart3, Clock, Zap, ArrowRight, AlertCircle,
} from "lucide-react";

interface Stats {
  total_suppliers: number; active_suppliers: number; total_products: number;
  total_shipments: number; in_transit_shipments: number; delayed_shipments: number;
  total_orders: number; pending_orders: number; at_risk_orders: number;
  total_disruptions: number; low_stock_items: number;
}

function StatCard({ label, value, sub, icon: Icon, color, to }: {
  label: string; value: number | string; sub?: string;
  icon: React.ElementType; color: string; to?: string;
}) {
  const content = (
    <div className={`bg-[#0d1220] border border-[#1f2d44] rounded-xl p-4 hover:border-[#2a3d5a] transition-all duration-200 group ${to ? "cursor-pointer" : ""}`}>
      <div className="flex items-start justify-between mb-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-4.5 h-4.5" />
        </div>
        {to && <ArrowRight className="w-3.5 h-3.5 text-[#4a5e7a] group-hover:text-[#7a8fad] transition-colors" />}
      </div>
      <p className="text-2xl font-bold text-[#e8eef8] mb-0.5" style={{ fontFamily: "Outfit, sans-serif" }}>{value}</p>
      <p className="text-xs text-[#7a8fad]">{label}</p>
      {sub && <p className="text-[10px] text-[#4a5e7a] mt-1 font-mono">{sub}</p>}
    </div>
  );
  return to ? <Link to={to}>{content}</Link> : content;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats | null>(null);
  const [disruptions, setDisruptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadDashboard = () => {
    Promise.all([api.stats(), api.disruptions()])
      .then(([s, d]) => { setStats(s); setDisruptions(d.slice(0, 5)); })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadDashboard();
    window.addEventListener("focus", loadDashboard);
    return () => window.removeEventListener("focus", loadDashboard);
  }, []);

  const severityColor: Record<string, string> = {
    critical: "text-[#ef4444]", high: "text-[#f59e0b]",
    medium: "text-[#3b82f6]", low: "text-[#22c55e]", none: "text-[#4a5e7a]",
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>
          Welcome back, <span className="gradient-text">{user?.full_name || user?.username}</span>
        </h1>
        <p className="text-sm text-[#7a8fad] mt-1">Supply chain operations overview</p>
      </div>

      {/* Alert banner if at-risk orders */}
      {stats && stats.at_risk_orders > 0 && (
        <Link to="/orders" className="flex items-center gap-3 bg-[#ef4444]/8 border border-[#ef4444]/25 rounded-xl px-4 py-3 hover:bg-[#ef4444]/12 transition-all">
          <AlertCircle className="w-4.5 h-4.5 text-[#ef4444] flex-shrink-0" />
          <span className="text-sm text-[#ef4444] font-medium">
            {stats.at_risk_orders} order{stats.at_risk_orders !== 1 ? "s are" : " is"} currently at risk — review and take action
          </span>
          <ArrowRight className="w-4 h-4 text-[#ef4444] ml-auto" />
        </Link>
      )}

      {/* Stats grid */}
      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="bg-[#0d1220] border border-[#1f2d44] rounded-xl p-4 h-28 animate-pulse" />
          ))}
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          <StatCard label="Total Suppliers" value={stats.total_suppliers}
            sub={`${stats.active_suppliers} active`} icon={Truck}
            color="bg-[#00d4c8]/10 text-[#00d4c8]" to="/suppliers" />
          <StatCard label="Products" value={stats.total_products}
            icon={Package} color="bg-[#a855f7]/10 text-[#a855f7]" to="/products" />
          <StatCard label="Shipments" value={stats.total_shipments}
            sub={`${stats.in_transit_shipments} in transit`} icon={ShoppingCart}
            color="bg-[#3b82f6]/10 text-[#3b82f6]" to="/shipments" />
          <StatCard label="Delayed Shipments" value={stats.delayed_shipments}
            icon={Clock} color={stats.delayed_shipments > 0 ? "bg-[#ef4444]/10 text-[#ef4444]" : "bg-[#22c55e]/10 text-[#22c55e]"}
            to="/shipments" />
          <StatCard label="Total Orders" value={stats.total_orders}
            sub={`${stats.pending_orders} pending`} icon={BarChart3}
            color="bg-[#f59e0b]/10 text-[#f59e0b]" to="/orders" />
          <StatCard label="Orders At Risk" value={stats.at_risk_orders}
            icon={AlertCircle} color={stats.at_risk_orders > 0 ? "bg-[#ef4444]/10 text-[#ef4444]" : "bg-[#22c55e]/10 text-[#22c55e]"}
            to="/orders" />
          <StatCard label="Low Stock Items" value={stats.low_stock_items}
            icon={TrendingDown} color={stats.low_stock_items > 0 ? "bg-[#f59e0b]/10 text-[#f59e0b]" : "bg-[#22c55e]/10 text-[#22c55e]"}
            to="/stock" />
          <StatCard label="Disruption Notices" value={stats.total_disruptions}
            icon={AlertTriangle} color="bg-[#f59e0b]/10 text-[#f59e0b]" to="/disruptions" />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent disruptions */}
        <div className="bg-[#0d1220] border border-[#1f2d44] rounded-xl overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#1f2d44]">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#f59e0b]" />
              <span className="text-sm font-semibold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>Recent Disruption Notices</span>
            </div>
            <Link to="/disruptions" className="text-xs text-[#00d4c8] hover:text-[#00a89e] flex items-center gap-1 transition-colors">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </div>
          {disruptions.length === 0 ? (
            <div className="py-12 text-center">
              <Zap className="w-8 h-8 text-[#1f2d44] mx-auto mb-3" />
              <p className="text-sm text-[#4a5e7a]">No disruption notices yet</p>
              <Link to="/disruptions" className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#00d4c8] hover:text-[#00a89e]">
                Analyze a notice <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-[#111827]">
              {disruptions.map((d: any) => (
                <div key={d.id} className="px-5 py-3.5 hover:bg-[#131929] transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#e8eef8] truncate">{d.title || "Disruption Notice"}</p>
                      <p className="text-xs text-[#4a5e7a] mt-0.5 font-mono">
                        {d.affected_orders_count} orders · {d.affected_shipments_count} shipments ·{" "}
                        {new Date(d.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className={`text-[10px] font-mono uppercase font-medium flex-shrink-0 ${severityColor[d.severity] || "text-[#4a5e7a]"}`}>
                      {d.severity}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Quick actions */}
        <div className="bg-[#0d1220] border border-[#1f2d44] rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1f2d44]">
            <span className="text-sm font-semibold text-[#e8eef8]" style={{ fontFamily: "Outfit, sans-serif" }}>Quick Actions</span>
          </div>
          <div className="p-4 space-y-2">
            {[
              { to: "/disruptions", icon: AlertTriangle, label: "Analyze a disruption notice", color: "text-[#f59e0b]", bg: "hover:bg-[#f59e0b]/5 border-[#f59e0b]/15" },
              { to: "/shipments", icon: ShoppingCart, label: "Track shipments in transit", color: "text-[#3b82f6]", bg: "hover:bg-[#3b82f6]/5 border-[#3b82f6]/15" },
              { to: "/stock", icon: BarChart3, label: "Review stock levels", color: "text-[#a855f7]", bg: "hover:bg-[#a855f7]/5 border-[#a855f7]/15" },
              { to: "/orders", icon: Package, label: "Manage customer orders", color: "text-[#00d4c8]", bg: "hover:bg-[#00d4c8]/5 border-[#00d4c8]/15" },
              { to: "/suppliers", icon: Truck, label: "Supplier management", color: "text-[#22c55e]", bg: "hover:bg-[#22c55e]/5 border-[#22c55e]/15" },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border border-transparent ${a.bg} transition-all group`}
              >
                <a.icon className={`w-4 h-4 ${a.color} flex-shrink-0`} />
                <span className="text-sm text-[#c8d8f0] group-hover:text-[#e8eef8] transition-colors">{a.label}</span>
                <ArrowRight className="w-3.5 h-3.5 text-[#4a5e7a] group-hover:text-[#7a8fad] ml-auto transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
