import { useState, useEffect } from 'react';

interface UseMobileNavigationProps {
  hideOnScroll?: boolean;
}

export function useMobileNavigation({ hideOnScroll = false }: UseMobileNavigationProps = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    if (!hideOnScroll) return;
    
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Show navigation when scrolling up or at the top
      if (currentScrollY <= 0 || currentScrollY < lastScrollY) {
        setIsVisible(true);
      } 
      // Hide navigation when scrolling down (beyond a threshold)
      else if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      }
      
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [hideOnScroll, lastScrollY]);

  return {
    isVisible,
    // Force showing the navigation
    show: () => setIsVisible(true),
    // Force hiding the navigation
    hide: () => setIsVisible(false),
  };
}

export default useMobileNavigation; 