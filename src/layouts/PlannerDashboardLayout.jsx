import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import PlannerSidebar from '../components/PlannerSidebar';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Drawer from '../components/Drawer';
import { useUIStore } from '../store/uiStore';

const PlannerDashboardLayout = () => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="flex">
      {/* Sidebar خاص بالمخطط */}
      <PlannerSidebar />

      <div
        className={`transition-all duration-300 flex-1 flex flex-col min-h-screen
        ${sidebarCollapsed ? "mr-20" : "mr-64"}`}
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

export default PlannerDashboardLayout;
