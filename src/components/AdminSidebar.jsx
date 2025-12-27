import { Link, useLocation } from "react-router-dom";
import { useUIStore } from "../store/uiStore";
import {
  Home,
  Users,
  Package,
  Truck,
  FileText,
  Trash2,
  Landmark,
  ChevronRight,
} from "lucide-react";

export default function Sidebar() {
  const { sidebarCollapsed, toggleSidebar } = useUIStore();
  const location = useLocation();

  const menus = [
    { label: "الرئيسية", icon: <Home />, to: "/dashboard/admin" },
    { label: "إدارة المستخدمين", icon: <Users />, to: "/dashboard/admin/users" },
    { label: "المديريات", icon: <Landmark />, to: "/dashboard/admin/municipalities" },
    { label: "مكبات القمامة", icon: <Package />, to: "/dashboard/admin/landfills" },
    { label: "الحاويات", icon: <Trash2 />, to: "/dashboard/admin/bins" },
    { label: "الشاحنات", icon: <Truck />, to: "/dashboard/admin/vehicles" },
    { label: "سجل النشاطات", icon: <FileText />, to: "/dashboard/admin/activity-log" },
  ];

  return (
    <div
      className={`bg-[#0c1327] text-white h-screen fixed top-0 right-0 transition-all duration-300
      ${sidebarCollapsed ? "w-20" : "w-64"}`}
    >
      {/* Logo & Collapse button */}
      <div className="flex items-center justify-between px-4 py-5">
        
        {/* Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => {
            if (sidebarCollapsed) toggleSidebar();
          }}
        >
          <img
            src="/vite.svg"
            alt="logo"
            className="w-8 h-8"
          />
          {!sidebarCollapsed && (
            <span className="text-nowrap font-bold text-lg">منصة اماطة</span>
          )}
        </div>

        {/* Collapse button */}
        {!sidebarCollapsed && (
          <button
            onClick={toggleSidebar}
            className="text-white p-1 rounded hover:bg-[#141b33]"
          >
            <ChevronRight />
          </button>
        )}
      </div>

      {/* Menu items */}
      <nav className="text-nowrap mt-4">
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
