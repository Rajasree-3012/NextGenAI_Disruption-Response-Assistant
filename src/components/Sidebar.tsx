import { NavLink } from "react-router-dom";
import {
  LayoutDashboard, AlertTriangle, Truck, Package, Warehouse,
  ShoppingCart, BarChart3, Users, LogOut, ChevronRight, Zap,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/disruptions", label: "Disruption Analyzer", icon: AlertTriangle, highlight: true },
  { to: "/suppliers", label: "Suppliers", icon: Truck },
  { to: "/products", label: "Products", icon: Package },
  { to: "/warehouses", label: "Warehouses", icon: Warehouse },
  { to: "/stock", label: "Stock", icon: BarChart3 },
  { to: "/shipments", label: "Shipments", icon: ShoppingCart },
  { to: "/orders", label: "Orders", icon: ShoppingCart },
];

export default function Sidebar({ open, onClose }: { open: boolean; onClose?: () => void }) {
  const { user, logout, isAdmin } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`fixed top-0 left-0 z-30 h-full w-60 flex flex-col
          bg-[#080c14] border-r border-[#1f2d44]
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0`}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 px-5 py-5 border-b border-[#1f2d44]">
          <div className="w-8 h-8 rounded-lg bg-[#00d4c8]/10 border border-[#00d4c8]/30 flex items-center justify-center">
            <Zap className="w-4 h-4 text-[#00d4c8]" />
          </div>
          <div>
            <p className="text-xs font-semibold text-[#e8eef8] leading-none" style={{ fontFamily: "Outfit, sans-serif" }}>
              ChainGuard
            </p>
            <p className="text-[10px] text-[#4a5e7a] mt-0.5 leading-none">Supply Chain Ops</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2">
          <p className="px-3 mb-2 text-[10px] font-mono uppercase tracking-widest text-[#4a5e7a]">Navigation</p>
          {navItems.map(({ to, label, icon: Icon, highlight }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              onClick={onClose}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-all duration-150 group
                ${isActive
                  ? "bg-[#00d4c8]/10 text-[#00d4c8] border border-[#00d4c8]/20"
                  : highlight
                    ? "text-[#f59e0b] hover:bg-[#f59e0b]/10"
                    : "text-[#7a8fad] hover:bg-[#1a2235] hover:text-[#e8eef8]"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1 text-[13px]" style={{ fontFamily: "Inter, sans-serif" }}>{label}</span>
                  {isActive && <ChevronRight className="w-3 h-3 opacity-60" />}
                </>
              )}
            </NavLink>
          ))}

          {isAdmin && (
            <>
              <p className="px-3 mt-4 mb-2 text-[10px] font-mono uppercase tracking-widest text-[#4a5e7a]">Admin</p>
              <NavLink
                to="/users"
                onClick={onClose}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2 rounded-lg mb-0.5 text-sm transition-all duration-150
                  ${isActive ? "bg-[#a855f7]/10 text-[#a855f7] border border-[#a855f7]/20" : "text-[#7a8fad] hover:bg-[#1a2235] hover:text-[#e8eef8]"}`
                }
              >
                <Users className="w-4 h-4" />
                <span className="text-[13px]">User Management</span>
              </NavLink>
            </>
          )}
        </nav>

        {/* User */}
        <div className="border-t border-[#1f2d44] p-3">
          <div className="flex items-center gap-2.5 px-2 py-2">
            <div className="w-8 h-8 rounded-full bg-[#00d4c8]/15 border border-[#00d4c8]/25 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-semibold text-[#00d4c8]">
                {user?.username?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-[#e8eef8] truncate">{user?.full_name || user?.username}</p>
              <p className="text-[10px] text-[#4a5e7a] capitalize">{user?.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-[#4a5e7a] hover:text-[#ef4444] hover:bg-[#ef4444]/10 transition-all"
              title="Sign out"
            >
              <LogOut className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
