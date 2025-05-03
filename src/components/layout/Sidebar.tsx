import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { 
  Home, 
  Grid, 
  Menu as HiveIcon, 
  Settings, 
  BarChart3, 
  ClipboardCheck, 
  BellRing,
  ChevronLeft,
  ChevronRight,
  Moon,
  Sun
} from 'lucide-react';
import { useTheme } from '@/context/ThemeContext';
import AlertIndicator from '@/components/common/AlertIndicator';
import Logo, { BeeIcon } from '@/components/ui/Logo';

interface SidebarProps {
  className?: string;
}

const Sidebar: React.FC<SidebarProps> = ({ className }) => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const navigationItems = [
    { name: 'Dashboard', to: '/dashboard', icon: Home },
    { name: 'Apiaries', to: '/apiaries', icon: Grid },
    { name: 'Hives', to: '/hives', icon: HiveIcon },
    { name: 'Production', to: '/production', icon: BarChart3 },
    { name: 'Inspections', to: '/inspections', icon: ClipboardCheck },
    { name: 'Alerts', to: '/alerts', icon: BellRing },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];
  
  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  return (
    <aside 
      className={cn(
        "hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 border-r shadow-sm transition-all duration-200",
        collapsed ? "w-20" : "w-64",
        theme === 'dark' 
          ? 'bg-gray-900 border-gray-700 text-gray-100' 
          : 'bg-sidebar border-border text-foreground',
        className
      )}
    >
      {/* Logo section */}
      <div className={cn(
        "flex items-center h-16 border-b px-4",
        theme === 'dark' ? 'border-gray-700' : 'border-border'
      )}>
        {!collapsed ? (
          <Link to="/" className="flex items-center">
            <Logo className={theme === 'dark' ? 'filter brightness-110' : ''} />
          </Link>
        ) : (
          <Link to="/" className="flex items-center justify-center w-full">
            <BeeIcon className={theme === 'dark' ? 'filter brightness-110' : ''} />
          </Link>
        )}
      </div>
      
      {/* Navigation links */}
      <nav className="flex-1 py-5 px-3 space-y-1 overflow-y-auto">
        {navigationItems.map((item) => {
          const isActive = location.pathname === item.to || 
                          (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
          
          return (
            <Link
              key={item.name}
              to={item.to}
              className={cn(
                "flex items-center px-3 py-2.5 rounded-lg transition-colors group relative",
                collapsed ? "justify-center" : "justify-start",
                isActive 
                  ? theme === 'dark'
                    ? "text-amber-400 bg-amber-900/20" 
                    : "text-primary bg-primary/10"
                  : theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
                {item.name === 'Alerts' && <AlertIndicator className="top-0 right-0 translate-x-1/3 -translate-y-1/3" />}
              </div>
              
              {!collapsed && <span>{item.name}</span>}
              
              {isActive && (
                <div
                  className={cn(
                    "absolute",
                    collapsed 
                      ? "left-0 top-0 bottom-0 w-1" 
                      : "left-0 right-0 bottom-0 h-0.5",
                    theme === 'dark' ? 'bg-amber-400' : 'bg-primary'
                  )}
                />
              )}
            </Link>
          );
        })}
      </nav>
      
      {/* Theme toggle */}
      <div className="p-3 border-t border-border">
        <button
          onClick={toggleTheme}
          className={cn(
            "flex items-center w-full px-3 py-2 rounded-lg transition-colors",
            collapsed ? "justify-center" : "justify-start",
            theme === 'dark'
              ? "text-gray-300 hover:text-white hover:bg-gray-800/50"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
          aria-label={theme === 'light' ? "Switch to dark mode" : "Switch to light mode"}
        >
          {theme === 'light' ? (
            <Moon className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
          ) : (
            <Sun className={cn("h-5 w-5", collapsed ? "" : "mr-3")} />
          )}
          {!collapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
        </button>
      </div>
      
      {/* Collapse/Expand button */}
      <button 
        onClick={toggleSidebar}
        className={cn(
          "p-3 flex items-center justify-center transition-colors border-t",
          theme === 'dark' 
            ? 'border-gray-700 hover:bg-gray-800/50 text-gray-300' 
            : 'border-border hover:bg-accent/50 text-muted-foreground'
        )}
        aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        {collapsed ? (
          <ChevronRight className={cn("h-5 w-5", theme === 'dark' ? 'text-amber-400' : 'text-primary')} />
        ) : (
          <div className="flex items-center">
            <ChevronLeft className={cn("h-5 w-5", theme === 'dark' ? 'text-amber-400' : 'text-primary')} />
            <span className="ml-2">Collapse</span>
          </div>
        )}
      </button>
    </aside>
  );
};

export default Sidebar;