import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { NAVIGATION_ITEMS } from '../data/appData';
import { NavItem as NavItemType } from '../data/types'; // Renamed to avoid conflict
import { useAuth } from '../contexts/AuthContext';
import { Avatar } from '../components/Avatar';
import { OfficeBuildingIcon, ChevronDownIcon, CogIcon, LogoutIcon, ChevronDoubleRightIcon, ChevronDoubleLeftIcon } from '../components/icons';

const NavLink: React.FC<{ item: NavItemType; isActive: boolean; collapsed: boolean }> = ({ item, isActive, collapsed }) => (
  <Link
    to={item.path}
    className={`flex items-center px-3 py-2.5 rounded-md transition-colors duration-150 ease-in-out group
      ${isActive
        ? 'bg-primary-light text-primary font-semibold border-l-2 border-primary' // Active: light gray bg, black text, black left border
        : 'text-text-muted hover:bg-slate-100 hover:text-text-main font-medium'
      }`}
    title={collapsed ? item.name : undefined}
  >
    <item.icon className={`h-5 w-5 mr-0 ${isActive ? 'text-primary' : 'text-text-muted group-hover:text-text-main'} ${collapsed ? '' : 'mr-3'}`} />
    {!collapsed && <span className="text-sm">{item.name}</span>}
  </Link>
);

const NavSectionHeader: React.FC<{ title: string; collapsed: boolean }> = ({ title, collapsed }) => (
  collapsed ? null : (
    <h3 className="px-3 pt-5 pb-1 text-xs font-semibold text-text-muted uppercase tracking-wider">
      {title}
    </h3>
  )
);

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ collapsed, setCollapsed }) => {
  const location = useLocation();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [userDropdownOpen, setUserDropdownOpen] = React.useState(false);

  const handleLogout = () => {
    logout();
    setUserDropdownOpen(false);
    navigate('/login');
  };

  const generalNavItems = NAVIGATION_ITEMS.filter(item => ['Dashboard'].includes(item.name));
  const pagesNavItems = NAVIGATION_ITEMS.filter(item => [ 'Buildings', 'Rooms', 'Tenants','Invoices', 'Notifications', 'Expenses'].includes(item.name));
  const otherNavItems = NAVIGATION_ITEMS.filter(item => ['Settings'].includes(item.name));

  return (
    <div className={`bg-card-bg text-text-main flex flex-col fixed h-full border-r border-border-color z-20 transition-all duration-200 ${collapsed ? 'w-20' : 'w-64'}`}>
      <div className="h-20 flex items-center px-4 border-b border-border-color justify-between">
        <div className="flex items-center">
          <OfficeBuildingIcon className="h-8 w-8 text-primary mr-2" />
          {!collapsed && (
            <div>
              <Link to="/" className="text-lg font-bold text-primary">Là Nhà</Link>
              <div className="text-xs text-text-muted">Admin Kit</div>
            </div>
          )}
        </div>
        <button
          className="ml-2 p-2 rounded hover:bg-slate-100 focus:outline-none"
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronDoubleRightIcon className="h-5 w-5" /> : <ChevronDoubleLeftIcon className="h-5 w-5" />}
        </button>
      </div>
      <nav className="flex-grow p-3 space-y-0.5 overflow-y-auto">
        {generalNavItems.length > 0 && <NavSectionHeader title="General" collapsed={collapsed} />}
        {generalNavItems.map((item: NavItemType) => (
          <NavLink 
            key={item.name} 
            item={item} 
            isActive={location.pathname === item.path || (item.path !== '/' && location.pathname.startsWith(item.path))}
            collapsed={collapsed}
          />
        ))}

        {pagesNavItems.length > 0 && <NavSectionHeader title="Management" collapsed={collapsed} />}
        {pagesNavItems.map((item: NavItemType) => (
          <NavLink 
            key={item.name} 
            item={item} 
            isActive={location.pathname.startsWith(item.path)}
            collapsed={collapsed}
          />
        ))}
        
        {otherNavItems.length > 0 && <NavSectionHeader title="Other" collapsed={collapsed} />}
        {otherNavItems.map((item: NavItemType) => (
          <NavLink 
            key={item.name} 
            item={item} 
            isActive={location.pathname.startsWith(item.path)}
            collapsed={collapsed}
          />
        ))}
      </nav>
      <div className="p-3 border-t border-border-color">
         <div className="relative">
          <button 
            onClick={() => setUserDropdownOpen(!userDropdownOpen)} 
            className={`w-full flex items-center space-x-3 p-2 rounded-md hover:bg-slate-100 focus:outline-none ${collapsed ? 'justify-center' : ''}`}
            aria-expanded={userDropdownOpen}
            aria-haspopup="true"
          >
            <Avatar name={user?.name} size="md" src={`https://picsum.photos/seed/${user?.id || 'default-admin'}/100/100`} />
            {!collapsed && (
              <div className="flex-1 text-left">
                <span className="text-sm font-semibold text-text-main block truncate">{user?.name || 'Admin User'}</span>
                <span className="text-xs text-text-muted block truncate">{user?.email || 'admin@example.com'}</span>
              </div>
            )}
            {!collapsed && <ChevronDownIcon className={`h-4 w-4 text-text-muted transition-transform duration-200 ${userDropdownOpen ? 'rotate-180' : ''}`} />}
          </button>
          {userDropdownOpen && !collapsed && (
            <div 
                className="absolute bottom-full left-0 mb-2 w-full bg-card-bg rounded-md py-1 z-50 ring-1 ring-black ring-opacity-5 focus:outline-none border border-border-color"
                role="menu" aria-orientation="vertical"
            >
              <Link 
                to="/settings" 
                onClick={()=>setUserDropdownOpen(false)} 
                className="w-full text-left flex items-center px-4 py-2 text-sm text-text-main hover:bg-slate-100"
                role="menuitem" tabIndex={-1}
              >
                <CogIcon className="inline h-4 w-4 mr-2" />Profile Settings
              </Link>
              <button 
                onClick={handleLogout} 
                className="w-full text-left flex items-center px-4 py-2 text-sm text-text-main hover:bg-slate-100"
                role="menuitem" tabIndex={-1}
              >
                <LogoutIcon className="inline h-4 w-4 mr-2" />Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Sidebar Drawer cho mobile
export const SidebarDrawer: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-40" onClick={onClose}></div>
      {/* Sidebar content */}
      <div className="relative w-64 bg-card-bg h-full shadow-xl flex flex-col border-r border-border-color animate-slideInLeft">
        <div className="h-20 flex items-center px-4 border-b border-border-color justify-between">
          <div className="flex items-center">
            <OfficeBuildingIcon className="h-8 w-8 text-primary mr-2" />
            <div>
              <Link to="/" className="text-lg font-bold text-primary">Là Nhà</Link>
              <div className="text-xs text-text-muted">Admin Kit</div>
            </div>
          </div>
          <button
            className="ml-2 p-2 rounded hover:bg-slate-100 focus:outline-none"
            onClick={onClose}
            aria-label="Close sidebar"
          >
            <ChevronDoubleLeftIcon className="h-5 w-5" />
          </button>
        </div>
        {/* Copy nav content từ Sidebar, collapsed=false */}
        <nav className="flex-grow p-3 space-y-0.5 overflow-y-auto">
          {NAVIGATION_ITEMS.filter(item => ['Dashboard'].includes(item.name)).length > 0 && <NavSectionHeader title="General" collapsed={false} />}
          {NAVIGATION_ITEMS.filter(item => ['Dashboard'].includes(item.name)).map((item: NavItemType) => (
            <NavLink key={item.name} item={item} isActive={window.location.pathname === item.path || (item.path !== '/' && window.location.pathname.startsWith(item.path))} collapsed={false} />
          ))}
          {NAVIGATION_ITEMS.filter(item => [ 'Buildings', 'Rooms', 'Tenants','Invoices', 'Notifications', 'Expenses'].includes(item.name)).length > 0 && <NavSectionHeader title="Management" collapsed={false} />}
          {NAVIGATION_ITEMS.filter(item => [ 'Buildings', 'Rooms', 'Tenants','Invoices', 'Notifications', 'Expenses'].includes(item.name)).map((item: NavItemType) => (
            <NavLink key={item.name} item={item} isActive={window.location.pathname.startsWith(item.path)} collapsed={false} />
          ))}
          {NAVIGATION_ITEMS.filter(item => ['Settings'].includes(item.name)).length > 0 && <NavSectionHeader title="Other" collapsed={false} />}
          {NAVIGATION_ITEMS.filter(item => ['Settings'].includes(item.name)).map((item: NavItemType) => (
            <NavLink key={item.name} item={item} isActive={window.location.pathname.startsWith(item.path)} collapsed={false} />
          ))}
        </nav>
      </div>
    </div>
  );
};