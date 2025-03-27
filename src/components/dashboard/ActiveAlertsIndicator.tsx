import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getActiveAlertCount } from '@/services/alertService';

interface ActiveAlertsIndicatorProps {
  className?: string;
}

const ActiveAlertsIndicator: React.FC<ActiveAlertsIndicatorProps> = ({ className }) => {
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
    <AnimatePresence>
      {alertCount > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={`fixed bottom-20 md:bottom-5 right-5 z-50 ${className}`}
        >
          <Link to="/alerts">
            <Button
              variant="destructive"
              className="shadow-lg flex items-center gap-2 px-4 py-2"
            >
              <AlertCircle className="h-4 w-4" />
              <span>Active Alerts</span>
              <Badge variant="outline" className="bg-white/20 text-white ml-1">
                {alertCount}
              </Badge>
            </Button>
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ActiveAlertsIndicator; 