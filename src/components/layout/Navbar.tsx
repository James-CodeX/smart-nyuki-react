import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Menu, X, Home, Grid, Menu as HiveIcon, Map, Settings, ChevronLeft, ChevronRight } from 'lucide-react';

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapsedChange }) => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  
  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);
  
  // Notify parent component when sidebar state changes
  useEffect(() => {
    if (onCollapsedChange) {
      onCollapsedChange(isCollapsed);
    }
  }, [isCollapsed, onCollapsedChange]);
  
  const navigation = [
    { name: 'Dashboard', to: '/', icon: Home },
    { name: 'Apiaries', to: '/apiaries', icon: Grid },
    { name: 'Hives', to: '/hives', icon: HiveIcon },
    { name: 'Map View', to: '/map', icon: Map },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];
  
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile menu trigger */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-white/80 backdrop-blur-md shadow-sm"
        onClick={toggleMobileMenu}
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>
      
      {/* Desktop sidebar */}
      <motion.aside 
        className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 bg-sidebar backdrop-blur-md border-r border-border shadow-sm transition-all duration-300"
        animate={{ width: isCollapsed ? '80px' : '250px' }}
        initial={{ width: '80px' }}
      >
        <div className="flex items-center p-4 border-b border-border h-16">
          {!isCollapsed && (
            <Link to="/" className="flex items-center">
              <span className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <motion.div whileHover={{ rotate: 10 }} className="text-primary font-bold text-xl">
                  🐝
                </motion.div>
              </span>
              <span className="ml-3 text-xl font-medium text-foreground">Smart-Nyuki</span>
            </Link>
          )}
          {isCollapsed && (
            <Link to="/" className="flex items-center justify-center w-full">
              <span className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <motion.div whileHover={{ rotate: 10 }} className="text-primary font-bold text-xl">
                  🐝
                </motion.div>
              </span>
            </Link>
          )}
        </div>
        
        <nav className="flex-1 py-6 px-3 space-y-2 overflow-y-auto">
          {navigation.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.name}
                to={item.to}
                className={cn(
                  "flex items-center px-3 py-3 rounded-lg transition-colors relative",
                  isCollapsed ? "justify-center" : "justify-start",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <item.icon className={cn("h-5 w-5", isCollapsed ? "" : "mr-3")} />
                {!isCollapsed && <span>{item.name}</span>}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute ${isCollapsed ? 'left-0 top-0 bottom-0 w-1' : 'bottom-0 left-0 right-0 h-0.5'} bg-primary`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        
        <button 
          onClick={toggleSidebar}
          className="p-3 border-t border-border flex items-center justify-center hover:bg-accent/50 transition-colors"
        >
          {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          {!isCollapsed && <span className="ml-2">Collapse</span>}
        </button>
      </motion.aside>
      
      {/* Mobile sidebar */}
      <motion.div
        className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        animate={{ opacity: isMobileOpen ? 1 : 0 }}
        initial={{ opacity: 0 }}
        style={{ pointerEvents: isMobileOpen ? 'auto' : 'none' }}
      >
        <motion.div
          className="fixed inset-y-0 left-0 z-50 w-64 bg-sidebar shadow-lg overflow-y-auto"
          animate={{ x: isMobileOpen ? 0 : -320 }}
          transition={{ ease: "easeOut", duration: 0.3 }}
        >
          <div className="flex items-center p-4 border-b border-border h-16">
            <Link to="/" className="flex items-center" onClick={() => setIsMobileOpen(false)}>
              <span className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <motion.div whileHover={{ rotate: 10 }} className="text-primary font-bold text-xl">
                  🐝
                </motion.div>
              </span>
              <span className="ml-3 text-xl font-medium text-foreground">Smart-Nyuki</span>
            </Link>
          </div>
          
          <nav className="flex flex-col py-6 px-3 space-y-2">
            {navigation.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.name}
                  to={item.to}
                  className={cn(
                    "flex items-center px-3 py-3 rounded-lg transition-colors",
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <item.icon className="h-5 w-5 mr-3" />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </motion.div>
      </motion.div>
    </>
  );
};

export default Sidebar;
