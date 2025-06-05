import React, { createContext, useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar, SidebarDrawer } from './Sidebar';
import { Header } from './Header';

// Context để chia sẻ trạng thái collapse của Sidebar
const SidebarCollapseContext = createContext<{ collapsed: boolean; setCollapsed: (v: boolean) => void }>({ collapsed: false, setCollapsed: () => {} });
export const useSidebarCollapse = () => useContext(SidebarCollapseContext);

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [showSidebarDrawer, setShowSidebarDrawer] = useState(false);
  return (
    <SidebarCollapseContext.Provider value={{ collapsed, setCollapsed }}>
      <div className="flex h-screen bg-light-bg">
        {/* Sidebar desktop */}
        <div className="hidden md:flex">
          <Sidebar collapsed={collapsed} setCollapsed={setCollapsed} />
        </div>
        {/* Sidebar Drawer mobile */}
        <SidebarDrawer open={showSidebarDrawer} onClose={() => setShowSidebarDrawer(false)} />
        <div className={`flex-1 flex flex-col transition-all duration-200 ${collapsed ? 'md:ml-20' : 'md:ml-64'} ml-0`}> {/* Dynamic margin responsive */}
          <Header onOpenSidebarDrawer={() => setShowSidebarDrawer(true)} />
          <main className="flex-1 overflow-y-auto">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarCollapseContext.Provider>
  );
};