import React from 'react';
import { Link } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { Bell, Menu, Search, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import AlertIndicator from '@/components/common/AlertIndicator';
import Logo from '@/components/ui/Logo';

interface NavbarProps {
  className?: string;
}

const Navbar: React.FC<NavbarProps> = ({ className }) => {
  const { theme } = useTheme();
  const { user, signOut } = useAuth();

  return (
    <header className={cn(
      "w-full h-16 border-b flex items-center justify-between px-4",
      theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-background border-border',
      className
    )}>
      <div className="flex items-center">
        <Logo className="h-8 w-auto mr-4" />
      </div>
      
      <div className="flex items-center space-x-2">
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          <AlertIndicator className="top-0 right-0" />
        </Button>
        <Button variant="ghost" size="icon">
          <User className="h-5 w-5" />
        </Button>
      </div>
    </header>
  );
};

export default Navbar;
