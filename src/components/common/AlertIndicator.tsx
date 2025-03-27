import React, { useState, useEffect } from 'react';
import { getActiveAlertCount } from '@/services/alertService';

interface AlertIndicatorProps {
  className?: string;
}

const AlertIndicator: React.FC<AlertIndicatorProps> = ({ className }) => {
  const [alertCount, setAlertCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Load the active alert count on mount
    fetchAlertCount();

    // Set up polling to refresh the alert count every 30 seconds
    const interval = setInterval(fetchAlertCount, 30 * 1000);

    // Clean up the interval when the component unmounts
    return () => clearInterval(interval);
  }, []);

  const fetchAlertCount = async () => {
    try {
      setLoading(true);
      const count = await getActiveAlertCount();
      setAlertCount(count);
    } catch (error) {
      console.error('Error fetching alert count:', error);
    } finally {
      setLoading(false);
    }
  };

  // If no alerts or loading, don't render anything
  if ((alertCount === 0 && !loading) || loading) {
    return null;
  }

  return (
    <span 
      className={`absolute h-2.5 w-2.5 rounded-full bg-destructive animate-pulse ${className}`}
      aria-label={`${alertCount} active alerts`}
    />
  );
};

export default AlertIndicator; 