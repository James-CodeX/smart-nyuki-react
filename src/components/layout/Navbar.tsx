import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Home, Grid, Menu as HiveIcon, Settings, BarChart3, ClipboardCheck, BellRing } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import AlertIndicator from '@/components/common/AlertIndicator';

// SVG Logo component - directly embedded instead of imported
const Logo = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 100" className={className} width="180">
    <circle cx="50" cy="50" r="45" fill="#FFCE21"/>
    <g transform="translate(15, 15)">
      {/* Simple bee icon */}
      <ellipse cx="35" cy="35" rx="25" ry="20" fill="#FFC700" />
      <path d="M35,15 L35,55 M25,25 L45,25 M25,45 L45,45" stroke="#000" strokeWidth="4" />
      <path d="M15,30 Q5,35 15,40 M55,30 Q65,35 55,40" stroke="#000" fill="none" strokeWidth="2" />
      <circle cx="30" cy="35" r="3" fill="#000" />
      <circle cx="40" cy="35" r="3" fill="#000" />
    </g>
    <text x="105" y="45" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="30" fill="#000">Smart</text>
    <text x="105" y="75" fontFamily="Arial, sans-serif" fontWeight="900" fontSize="30" fill="#000">Nyuki</text>
  </svg>
);

// Small Bee Icon for collapsed sidebar
const BeeIcon = ({ className = "" }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 70 70" className={className} width="40" height="40">
    <circle cx="35" cy="35" r="32" fill="#FFCE21"/>
    <g transform="translate(10, 10)">
      <ellipse cx="25" cy="25" rx="18" ry="15" fill="#FFC700" />
      <path d="M25,10 L25,40 M18,18 L32,18 M18,32 L32,32" stroke="#000" strokeWidth="3" />
      <path d="M10,22 Q5,25 10,28 M40,22 Q45,25 40,28" stroke="#000" fill="none" strokeWidth="1.5" />
      <circle cx="22" cy="25" r="2" fill="#000" />
      <circle cx="28" cy="25" r="2" fill="#000" />
    </g>
  </svg>
);

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
              <Logo />
            </Link>
          )}
          {isCollapsed && (
            <Link to="/" className="flex items-center justify-center w-full">
              <motion.div whileHover={{ rotate: 10 }} className="flex items-center justify-center">
                <BeeIcon />
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
                    ? "text-primary bg-primary/10" 
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
                    className={`absolute ${isCollapsed ? 'left-0 top-0 bottom-0 w-1' : 'bottom-0 left-0 right-0 h-0.5'} bg-primary`}
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
              </Link>
            );
          })}
        </nav>
        
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
    </>
  );
};

export default Sidebar;
