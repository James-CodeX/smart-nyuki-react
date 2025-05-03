import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home, Grid, Menu as HiveIcon, Settings, BarChart3, ClipboardCheck, BellRing, Moon, Sun } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import AlertIndicator from '@/components/common/AlertIndicator';
import Logo, { BeeIcon } from '@/components/ui/Logo';

interface SidebarProps {
  onCollapsedChange?: (collapsed: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onCollapsedChange }) => {
  // Initialize the collapsed state from localStorage or default to true (collapsed)
  const [isCollapsed, setIsCollapsed] = useState(() => {
    const savedState = localStorage.getItem('sidebar-collapsed');
    return savedState !== null ? JSON.parse(savedState) : true;
  });
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
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
    { name: 'Dashboard', to: '/dashboard', icon: Home },
    { name: 'Apiaries', to: '/apiaries', icon: Grid },
    { name: 'Hives', to: '/hives', icon: HiveIcon },
    { name: 'Production', to: '/production', icon: BarChart3 },
    { name: 'Inspections', to: '/inspections', icon: ClipboardCheck },
    { name: 'Alerts', to: '/alerts', icon: BellRing },
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

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside 
        className={`hidden md:flex flex-col h-screen fixed left-0 top-0 z-40 border-r shadow-sm transition-colors duration-300 overflow-hidden ${
          theme === 'dark' 
            ? 'bg-gray-900 border-gray-700 text-gray-100' 
            : 'bg-sidebar backdrop-blur-md border-border'
        }`}
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
        <div className={`flex items-center p-4 h-16 border-b ${theme === 'dark' ? 'border-gray-700' : 'border-border'}`}>
          {!isCollapsed && (
            <Link to="/" className="flex items-center min-w-0">
              <Logo className={theme === 'dark' ? 'filter brightness-110' : ''} />
            </Link>
          )}
          {isCollapsed && (
            <Link to="/" className="flex items-center justify-center w-full">
              <motion.div whileHover={{ rotate: 10 }} className="flex items-center justify-center">
                <BeeIcon className={theme === 'dark' ? 'filter brightness-110' : ''} />
              </motion.div>
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
                    ? theme === 'dark'
                      ? "text-amber-400 bg-amber-900/20" 
                      : "text-primary bg-primary/10"
                    : theme === 'dark'
                      ? "text-gray-300 hover:text-white hover:bg-gray-800/50"
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
              >
                <div className="relative">
                  <item.icon className={cn("h-5 w-5", isCollapsed ? "" : "mr-3")} />
                  {item.name === 'Alerts' && <AlertIndicator className="top-0 right-0 translate-x-1/3 -translate-y-1/3" />}
                </div>
                {!isCollapsed && <span>{item.name}</span>}
                {isActive && (
                  <motion.div
                    layoutId="activeIndicator"
                    className={`absolute ${isCollapsed ? 'left-0 top-0 bottom-0 w-1' : 'bottom-0 left-0 right-0 h-0.5'} ${
                      theme === 'dark' ? 'bg-amber-400' : 'bg-primary'
                    }`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
          
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={cn(
              "flex items-center px-3 py-3 rounded-lg transition-colors",
              isCollapsed ? "justify-center" : "justify-start",
              theme === 'dark'
                ? "text-gray-300 hover:text-white hover:bg-gray-800/50"
                : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
            )}
            aria-label={theme === 'light' ? "Switch to dark mode" : "Switch to light mode"}
          >
            <div className="relative">
              {theme === 'light' ? (
                <Moon className={cn("h-5 w-5", isCollapsed ? "" : "mr-3")} />
              ) : (
                <Sun className={cn("h-5 w-5", isCollapsed ? "" : "mr-3")} />
              )}
            </div>
            {!isCollapsed && <span>{theme === 'light' ? 'Dark Mode' : 'Light Mode'}</span>}
          </button>
        </nav>
        
        {/* Button with updated event handler */}
        <button 
          onClick={toggleSidebar}
          className={`p-3 flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-primary/40 border-t ${
            theme === 'dark' 
              ? 'border-gray-700 hover:bg-gray-800/50 text-gray-300' 
              : 'border-border hover:bg-accent/50'
          }`}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          type="button" // Explicitly set button type to prevent form submission behavior
        >
          {isCollapsed ? 
            <ChevronRight className={`h-5 w-5 ${theme === 'dark' ? 'text-amber-400' : 'text-primary'}`} /> : 
            <><ChevronLeft className={`h-5 w-5 ${theme === 'dark' ? 'text-amber-400' : 'text-primary'}`} /><span className="ml-2">Collapse</span></>
          }
        </button>
      </motion.aside>
    </>
  );
};

export default Sidebar;
