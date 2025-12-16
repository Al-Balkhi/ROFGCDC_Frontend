import { Link, useLocation } from "react-router-dom";
import { useUIStore } from "../store/uiStore";
import {
  Home,
  Map,
  Route,
  ChevronRight
} from "lucide-react";

export default function PlannerSidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const location = useLocation();

  const menus = [
    { label: "الرئيسية", icon: <Home />, to: "/dashboard/planner" },
    { label: "خطط الجمع", icon: <Map />, to: "/dashboard/planner/scenarios" },
    { label: "الحلول المثلى", icon: <Route />, to: "/dashboard/planner/solutions" },
  ];

  return (
    <div
      className={`bg-[#0c1327] text-white h-screen fixed top-0 right-0 transition-all duration-300
      ${sidebarCollapsed ? "w-20" : "w-64"}`}
    >
      {/* Logo & Collapse */}
      <div className="flex items-center justify-between px-4 py-5">
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => {
            if (sidebarCollapsed) toggleSidebar();
          }}
        >
          <img src="/vite.svg" alt="logo" className="w-8 h-8" />
          {!sidebarCollapsed && (
            <span className="text-nowrap font-bold text-lg">نظام إدارة النفايات</span>
          )}
        </div>

        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="text-white p-1 rounded hover:bg-[#141b33]"
          >
            <ChevronRight />
          </button>
        )}
      </div>

      {/* Menu */}
      <nav className="mt-4">
        {menus.map((item) => (
          <Link
            key={item.to}
            to={item.to}
            className={`flex items-center gap-4 px-4 py-3 text-sm hover:bg-[#141b33]
              ${location.pathname === item.to ? "bg-[#1e2747]" : ""}
              ${sidebarCollapsed ? "justify-center" : ""}`}
          >
            {item.icon}
            {!sidebarCollapsed && <span>{item.label}</span>}
          </Link>
        ))}
      </nav>
    </div>
  );
}
