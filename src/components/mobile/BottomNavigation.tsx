import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Home, Grid, Menu as HiveIcon, Settings, BarChart3, ClipboardCheck } from 'lucide-react';

interface NavItem {
  name: string;
  to: string;
  icon: React.FC<{ className?: string }>;
}

const BottomNavigation: React.FC = () => {
  const location = useLocation();
  
  const navItems: NavItem[] = [
    { name: 'Home', to: '/', icon: Home },
    { name: 'Apiaries', to: '/apiaries', icon: Grid },
    { name: 'Hives', to: '/hives', icon: HiveIcon },
    { name: 'Inspections', to: '/inspections', icon: ClipboardCheck },
    { name: 'Production', to: '/production', icon: BarChart3 },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 w-screen m-0 p-0 bg-sidebar/95 backdrop-blur-sm border-t border-border z-[999] shadow-xl">
      <nav className="flex w-full m-0 p-0 justify-between items-stretch h-16">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.to ||
                         (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.name}
              to={item.to}
              className={cn(
                "flex flex-1 flex-col items-center justify-center h-full py-2 relative transition-colors",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
              style={{ width: `${100 / navItems.length}%` }}
            >
              <item.icon className={cn("h-5 w-5 mb-1")} />
              <span className="text-xs font-medium">{item.name}</span>
              {isActive && (
                <span className="absolute top-0 left-0 right-0 mx-auto h-1 w-6 bg-primary rounded-b-md" />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default BottomNavigation; 