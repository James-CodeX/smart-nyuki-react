import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Home, Grid, Menu as HiveIcon, Settings, BarChart3 } from 'lucide-react';

export const MobileNavigation = () => {
  const location = useLocation();
  
  // Only include the most important navigation items for mobile
  const bottomNavItems = [
    { name: 'Home', to: '/', icon: Home },
    { name: 'Apiaries', to: '/apiaries', icon: Grid },
    { name: 'Hives', to: '/hives', icon: HiveIcon },
    { name: 'Production', to: '/production', icon: BarChart3 },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];
  
  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 bg-sidebar backdrop-blur-md border-t border-border z-40 shadow-md">
      <nav className="flex justify-around items-center h-16">
        {bottomNavItems.map((item) => {
          const isActive = location.pathname === item.to || 
                          (item.to !== '/' && location.pathname.startsWith(item.to));
          return (
            <Link
              key={item.name}
              to={item.to}
              className={cn(
                "flex flex-col items-center justify-center py-2 px-3 relative w-full h-full",
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              )}
              aria-label={item.name}
            >
              <item.icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{item.name}</span>
              {isActive && (
                <motion.div
                  layoutId="mobileActiveIndicator"
                  className="absolute bottom-0 left-1/4 right-1/4 h-0.5 bg-primary"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default MobileNavigation; 