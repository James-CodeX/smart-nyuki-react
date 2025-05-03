import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Grid, Menu as HiveIcon, Settings, BarChart3, ClipboardCheck, BellRing, Moon, Sun } from 'lucide-react';
import AlertIndicator from '@/components/common/AlertIndicator';
import { useTheme } from '@/context/ThemeContext';

interface NavItem {
  name: string;
  to: string;
  icon: React.FC<{ className?: string }>;
}

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();
  
  const navItems: NavItem[] = [
    { name: 'Home', to: '/dashboard', icon: Home },
    { name: 'Apiaries', to: '/apiaries', icon: Grid },
    { name: 'Hives', to: '/hives', icon: HiveIcon },
    { name: 'Alerts', to: '/alerts', icon: BellRing },
    { name: 'Production', to: '/production', icon: BarChart3 },
  ];
  
  return (
    <div className={`md:hidden fixed bottom-0 left-0 right-0 w-screen m-0 p-0 backdrop-blur-sm border-t z-[999] shadow-xl ${
      theme === 'dark' 
        ? 'bg-gray-900/95 border-gray-700' 
        : 'bg-sidebar/95 border-border'
    }`}>
      <nav className="flex w-full m-0 p-0 justify-between items-stretch h-16">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.to ||
                         (item.to !== '/dashboard' && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.name}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center justify-center h-full py-2 relative transition-colors",
                isActive 
                  ? theme === 'dark'
                    ? "text-amber-400 bg-amber-900/20" 
                    : "text-primary bg-primary/10"
                  : theme === 'dark'
                    ? "text-gray-300 hover:text-white hover:bg-gray-800/50"
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
              style={{ width: `${100 / (navItems.length + 1)}%` }}
            >
              <div className="relative">
                <item.icon className={cn("h-5 w-5 mb-1")} />
                {item.name === 'Alerts' && <AlertIndicator className="top-0 right-0 translate-x-1/3 -translate-y-1/3" />}
              </div>
              <span className="text-xs font-medium">{item.name}</span>
              {isActive && (
                <span className={`absolute top-0 left-0 right-0 mx-auto h-1 w-6 rounded-b-md ${
                  theme === 'dark' ? 'bg-amber-400' : 'bg-primary'
                }`} />
              )}
            </Link>
          );
        })}
        
        {/* Theme Toggle Button */}
        <button
          onClick={toggleTheme}
          className={cn(
            "flex flex-1 flex-col items-center justify-center h-full py-2 relative transition-colors",
            theme === 'dark'
              ? "text-gray-300 hover:text-white hover:bg-gray-800/50"
              : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
          )}
          style={{ width: `${100 / (navItems.length + 1)}%` }}
          aria-label={theme === 'light' ? "Switch to dark mode" : "Switch to light mode"}
        >
          <div className="relative">
            {theme === 'light' ? (
              <Moon className="h-5 w-5 mb-1" />
            ) : (
              <Sun className="h-5 w-5 mb-1" />
            )}
          </div>
          <span className="text-xs font-medium">
            {theme === 'light' ? 'Dark' : 'Light'}
          </span>
        </button>
      </nav>
    </div>
  );
};

export default BottomNavigation;