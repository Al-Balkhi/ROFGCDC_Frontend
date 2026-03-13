import { useState } from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/Header";
import Footer from "../components/Footer";
import Drawer from "../components/Drawer";
import AdminSidebar from "../components/AdminSidebar";
import PlannerSidebar from "../components/PlannerSidebar";
import { useUIStore } from "../store/uiStore";
import useAuthStore from "../store/authStore";
import { ROLES } from "../constants/roles";

/**
 * SharedDashboardLayout — a role-aware layout shell for pages that are
 * accessible by both Admins and Planners (e.g. /notifications, /profile).
 *
 * Picks the correct sidebar based on the authenticated user's role.
 * Eliminates the need for route components to manually assemble Header /
 * Footer / Drawer / Sidebar themselves (CS-12 fix).
 */
const SharedDashboardLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { sidebarCollapsed } = useUIStore();
  const user = useAuthStore((state) => state.user);

  const Sidebar = user?.role === ROLES.PLANNER ? PlannerSidebar : AdminSidebar;

  return (
    <div className="flex">
      <Sidebar />

      <div
        className={`transition-all duration-300 flex-1 flex flex-col min-h-screen ${
          sidebarCollapsed ? "mr-20" : "mr-64"
        }`}
      >
        <Header onMenuClick={() => setDrawerOpen(!drawerOpen)} />
        <Drawer isOpen={drawerOpen} onClose={() => setDrawerOpen(false)} />

        <main className="flex-1 p-6 bg-gray-50">
          <Outlet />
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default SharedDashboardLayout;
