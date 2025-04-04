import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Grid, Menu as HiveIcon, Settings, BarChart3 } from 'lucide-react';

const MobileNavigation = () => {
  const location = useLocation();
  
  // Only include the most important navigation items for mobile
  const navItems = [
    { name: 'Home', to: '/', icon: Home },
    { name: 'Apiaries', to: '/apiaries', icon: Grid },
    { name: 'Hives', to: '/hives', icon: HiveIcon },
    { name: 'Production', to: '/production', icon: BarChart3 },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar border-t border-border z-[100] shadow-lg">
      <nav className="flex justify-between items-center h-16">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
                         (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.name}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center py-2 w-full relative",
                isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.name}</span>
              {isActive && (
                <span className="absolute top-0 left-1/2 -translate-x-1/2 h-1 w-6 bg-primary rounded-b-md" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileNavigation; 