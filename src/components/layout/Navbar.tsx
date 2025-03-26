import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Menu, X, Home, Grid, Menu as HiveIcon, Map, Settings, ChevronLeft, ChevronRight, BarChart3, ClipboardCheck, LogOut, BellRing } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapsedChange }) => {
  // Initialize the collapsed state from localStorage or default to true (collapsed)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  
  // Close mobile sidebar when route changes
  useEffect(() => {
    setIsMobileOpen(false);
  }, [location.pathname]);
  
  // Notify parent component when sidebar state changes
  useEffect(() => {
    // Use a callback ref to ensure we're working with the latest state
    const updateSidebarState = () => {
      if (onCollapsedChange) {
        onCollapsedChange(isCollapsed);
      }
      // Use try-catch to prevent errors with localStorage
      try {
        localStorage.setItem('sidebar-collapsed', JSON.stringify(isCollapsed));
      } catch (error) {
        console.error('Failed to save sidebar state to localStorage:', error);
      }
    };
    
    // Small delay to ensure the animation has started before notifying parents
    const timerId = setTimeout(updateSidebarState, 10);
    return () => clearTimeout(timerId);
  }, [isCollapsed, onCollapsedChange]);
  
  const navigation = [
    { name: 'Dashboard', to: '/', icon: Home },
    { name: 'Apiaries', to: '/apiaries', icon: Grid },
    { name: 'Hives', to: '/hives', icon: HiveIcon },
    { name: 'Production', to: '/production', icon: BarChart3 },
    { name: 'Inspections', to: '/inspections', icon: ClipboardCheck },
    { name: 'Alerts', to: '/alerts', icon: BellRing },
    { name: 'Map View', to: '/map', icon: Map },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];
  
  const toggleSidebar = (event: React.MouseEvent) => {
    // Prevent any default browser behavior
    event.preventDefault();
    // Stop the event from bubbling up
    event.stopPropagation();
    // Toggle collapsed state
    setIsCollapsed(!isCollapsed);
  };

  const toggleMobileMenu = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  return (
    <>
      {/* Mobile menu trigger */}
      <button
        type="button"
        className="fixed top-4 left-4 z-50 md:hidden p-2 rounded-md bg-primary/10 backdrop-blur-md shadow-md border border-primary/20 transition-all hover:bg-primary/20"
        onClick={toggleMobileMenu}
        aria-label="Toggle mobile navigation"
      >
        {isMobileOpen ? 
          <X className="h-6 w-6 text-primary" /> : 
          <Menu className="h-6 w-6 text-primary" />
        }
      </button>
      
      {/* Desktop sidebar */}
      <motion.aside 
        className="hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 bg-sidebar backdrop-blur-md border-r border-border shadow-sm transition-colors duration-300 overflow-hidden"
        animate={{ 
          width: isCollapsed ? '80px' : '250px' 
        }}
        initial={{ width: '80px' }}
        transition={{ 
          type: "spring", 
          stiffness: 300, 
          damping: 30,
          restDelta: 0.001 // More precise end detection
        }}
        layout // Help maintain layout consistency
      >
        <div className="flex items-center p-4 border-b border-border h-16">
          {!isCollapsed && (
            <Link to="/" className="flex items-center min-w-0">
              <span className="h-10 w-10 flex-shrink-0 rounded-full bg-primary/20 flex items-center justify-center">
                <motion.div whileHover={{ rotate: 10 }} className="text-primary font-bold text-xl">
                  🐝
                </motion.div>
              </span>
              <span className="ml-3 text-xl font-medium text-foreground truncate">Smart-Nyuki</span>
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
        
        <nav className="flex flex-col flex-1 py-6 px-3 space-y-2">
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
        
        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className={cn(
            "flex items-center px-3 py-3 rounded-lg transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/10 mx-3 mb-3",
            isCollapsed ? "justify-center" : "justify-start"
          )}
        >
          <LogOut className={cn("h-5 w-5", isCollapsed ? "" : "mr-3")} />
          {!isCollapsed && <span>Logout</span>}
        </button>
        
        {/* Button with updated event handler */}
        <button 
          onClick={toggleSidebar}
          className="p-3 border-t border-border flex items-center justify-center hover:bg-accent/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button" // Explicitly set button type to prevent form submission behavior
        >
          {isCollapsed ? 
            <ChevronRight className="h-5 w-5 text-primary" /> : 
            <><ChevronLeft className="h-5 w-5 text-primary" /><span className="ml-2">Collapse</span></>
          }
        </button>
      </motion.aside>
      
      {/* Mobile sidebar */}
      <motion.div
        className="md:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
        animate={{ opacity: isMobileOpen ? 1 : 0 }}
        initial={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        style={{ pointerEvents: isMobileOpen ? 'auto' : 'none' }}
      >
        <motion.div
          className="fixed inset-y-0 left-0 z-50 w-[85%] max-w-[280px] bg-sidebar shadow-xl overflow-y-auto"
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
            
            {/* Mobile Logout Button */}
            <button
              onClick={handleLogout}
              className="flex items-center px-3 py-3 rounded-lg transition-colors text-muted-foreground hover:text-destructive hover:bg-destructive/10 w-full text-left"
            >
              <LogOut className="h-5 w-5 mr-3" />
              <span>Logout</span>
            </button>
          </nav>
        </motion.div>
      </motion.div>
    </>
  );
};

export default Sidebar;
