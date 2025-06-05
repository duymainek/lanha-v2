import React, { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { NAVIGATION_ITEMS, MOCK_NOTIFICATIONS } from '../data/appData';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { BellIcon, SearchIcon, CalendarIcon, EllipsisVerticalIcon } from '../components/icons';
// Download icon can be a PlusIcon or a specific download icon if available
import { PlusIcon as DownloadIcon } from '../components/icons';

interface HeaderProps {
  onOpenSidebarDrawer?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebarDrawer }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const currentPageName = useMemo(() => 
    NAVIGATION_ITEMS.find(item => 
      location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))
    )?.name || 'Dashboard',
  [location.pathname]);
  
  const notificationCount = MOCK_NOTIFICATIONS.filter(n => n.status === 'Pending').length;

  return (
    <header className="h-20 bg-card-bg border-b border-border-color flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center">
        {/* Hamburger menu for mobile */}
        <button
          className="mr-4 text-text-muted focus:outline-none block md:hidden"
          onClick={onOpenSidebarDrawer}
          aria-label="Open sidebar menu"
        >
          <EllipsisVerticalIcon className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-semibold text-text-main">{currentPageName}</h1>
      </div>
    </header>
  );
};