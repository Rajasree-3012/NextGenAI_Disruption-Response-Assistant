import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import { Menu, Bell } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-full bg-[#080c14]">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-h-0 lg:ml-60">
        {/* Top bar */}
        <header className="flex items-center gap-3 px-4 lg:px-6 py-3 border-b border-[#1f2d44] bg-[#080c14]/80 backdrop-blur-sm sticky top-0 z-10">
          <button
            className="lg:hidden p-2 rounded-lg text-[#7a8fad] hover:bg-[#1a2235] hover:text-[#e8eef8] transition-all"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
            <span className="text-[11px] text-[#4a5e7a] hidden sm:block">System operational</span>
          </div>
          <button className="relative p-2 rounded-lg text-[#7a8fad] hover:bg-[#1a2235] transition-all">
            <Bell className="w-4 h-4" />
          </button>
          <div className="w-px h-5 bg-[#1f2d44]" />
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[#00d4c8]/15 border border-[#00d4c8]/25 flex items-center justify-center">
              <span className="text-xs font-semibold text-[#00d4c8]">
                {user?.username?.[0]?.toUpperCase() ?? "?"}
              </span>
            </div>
            <span className="text-xs text-[#7a8fad] hidden sm:block">{user?.username}</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
