
import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Menu, X, Home, Grid, Map, Settings } from 'lucide-react';

const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', to: '/', icon: Home },
    { name: 'Apiaries', to: '/apiaries', icon: Grid },
    { name: 'Map View', to: '/map', icon: Map },
    { name: 'Settings', to: '/settings', icon: Settings },
  ];
  
  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <header className="fixed top-0 w-full z-50 bg-white/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
          <div className="flex justify-start lg:w-0 lg:flex-1">
            <Link to="/" className="flex items-center">
              <span className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center">
                <motion.div
                  whileHover={{ rotate: 10 }}
                  className="text-primary font-bold text-2xl"
                >
                  🐝
                </motion.div>
              </span>
              <span className="ml-3 text-xl font-medium text-foreground">Smart-Nyuki</span>
            </Link>
          </div>
          
          <div className="-mr-2 -my-2 md:hidden">
            <button
              type="button"
              className="rounded-md p-2 inline-flex items-center justify-center text-gray-700 hover:text-gray-900 hover:bg-secondary focus:outline-none"
              onClick={toggleMenu}
            >
              <span className="sr-only">Open menu</span>
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
          
          <nav className="hidden md:flex space-x-10 items-center">
            {navigation.map((item) => {
              const isActive = location.pathname === item.to;
              return (
                <Link
                  key={item.name}
                  to={item.to}
                  className={cn(
                    "inline-flex items-center text-sm font-medium transition-colors px-3 py-2 rounded-lg",
                    isActive 
                      ? "text-primary bg-primary/10" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <item.icon className="h-4 w-4 mr-2" />
                  {item.name}
                  {isActive && (
                    <motion.div
                      layoutId="activeIndicator"
                      className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                      transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
      
      {/* Mobile menu */}
      <motion.div
        initial={{ opacity: 0, height: 0 }}
        animate={{
          opacity: isOpen ? 1 : 0,
          height: isOpen ? 'auto' : 0,
        }}
        transition={{ duration: 0.3 }}
        className="md:hidden overflow-hidden"
      >
        <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
          {navigation.map((item) => {
            const isActive = location.pathname === item.to;
            return (
              <Link
                key={item.name}
                to={item.to}
                className={cn(
                  "block px-3 py-2 rounded-md text-base font-medium flex items-center",
                  isActive 
                    ? "text-primary bg-primary/10" 
                    : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                )}
                onClick={() => setIsOpen(false)}
              >
                <item.icon className="h-5 w-5 mr-3" />
                {item.name}
              </Link>
            );
          })}
        </div>
      </motion.div>
    </header>
  );
};

export default Navbar;
