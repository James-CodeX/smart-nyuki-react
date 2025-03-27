import { checkMetricsAndCreateAlerts } from '@/services/alertService';
import { toast } from '@/components/ui/use-toast';

let checkInterval: NodeJS.Timeout | null = null;
const DEFAULT_CHECK_INTERVAL = 3 * 60 * 1000; // 3 minutes in milliseconds

/**
 * Start the periodic metrics checking service
 * @param interval Time in milliseconds between checks (default: 5 minutes)
 * @returns A cleanup function to stop the checks
 */
export const startMetricsChecker = (interval = DEFAULT_CHECK_INTERVAL): () => void => {
  // Clear any existing intervals
  if (checkInterval) {
    clearInterval(checkInterval);
  }
  
  // Run an initial check immediately
  console.log('Running initial metrics check...');
  checkMetricsAndCreateAlerts()
    .then((alertsCreated) => {
      console.log(`Initial metrics check complete: ${alertsCreated} alerts created`);
      if (alertsCreated > 0) {
        // Show a toast notification for the initial alerts
        toast({
          title: "New Alerts Detected",
          description: `${alertsCreated} new alert${alertsCreated === 1 ? '' : 's'} created based on sensor readings.`,
          variant: "destructive",
        });
      } else {
        console.log('No alerts created during initial check');
      }
    })
    .catch((error) => {
      console.error('Error during initial metrics check:', error);
    });
  
  // Set up periodic checking
  checkInterval = setInterval(() => {
    console.log('Running periodic metrics check...');
    checkMetricsAndCreateAlerts()
      .then((alertsCreated) => {
        console.log(`Periodic metrics check complete: ${alertsCreated} alerts created`);
        if (alertsCreated > 0) {
          // Show a toast notification for new alerts
          toast({
            title: "New Alerts Detected",
            description: `${alertsCreated} new alert${alertsCreated === 1 ? '' : 's'} created based on sensor readings.`,
            variant: "destructive",
          });
        } else {
          console.log('No alerts created during periodic check');
        }
      })
      .catch((error) => {
        console.error('Error during periodic metrics check:', error);
      });
  }, interval);
  
  // Return a cleanup function
  return () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
  };
};

/**
 * Stop the periodic metrics checking service
 */
export const stopMetricsChecker = (): void => {
  if (checkInterval) {
    clearInterval(checkInterval);
    checkInterval = null;
    console.log('Metrics checker stopped');
  }
}; 