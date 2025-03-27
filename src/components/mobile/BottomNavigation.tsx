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
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar/95 backdrop-blur-sm border-t border-border z-[100] shadow-xl">
      <nav className="flex justify-between items-center h-16 px-1">
        {navItems.map((item) => {
          const isActive = location.pathname === item.to ||
                         (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.name}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-1 relative rounded-lg transition-colors",
                isActive 
                  ? "text-primary bg-primary/10" 
                  : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
              )}
            >
              <item.icon className={cn("h-5 w-5 mb-1")} />
              <span className="text-xs font-medium">{item.name}</span>
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

export default BottomNavigation; 