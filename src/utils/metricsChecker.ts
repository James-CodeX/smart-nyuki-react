import { checkMetricsAndCreateAlerts } from '@/services/alertService';

let checkInterval: NodeJS.Timeout | null = null;
const DEFAULT_CHECK_INTERVAL = 30 * 60 * 1000; // 30 minutes in milliseconds

// Track the last time metrics were checked to prevent excess checks
let lastCheckTime: Date | null = null;
const MIN_CHECK_INTERVAL = 10 * 60 * 1000; // Minimum 10 minutes between checks

/**
 * Start the periodic metrics checking service
 * @param interval Time in milliseconds between checks (default: 30 minutes)
 * @returns A cleanup function to stop the checks
 */
export const startMetricsChecker = (interval = DEFAULT_CHECK_INTERVAL): () => void => {
  // Clear any existing intervals
  if (checkInterval) {
    console.log('[DEBUG] Clearing existing metrics check interval');
    clearInterval(checkInterval);
  }
  
  // Only run initial check if it hasn't been run recently
  const now = new Date();
  const shouldRunInitialCheck = !lastCheckTime || 
    (now.getTime() - lastCheckTime.getTime() > MIN_CHECK_INTERVAL);
  
  console.log(`[DEBUG] Last metrics check time: ${lastCheckTime?.toISOString() || 'never'}`);
  console.log(`[DEBUG] Should run initial check: ${shouldRunInitialCheck}`);
  
  if (shouldRunInitialCheck) {
    // Run an initial check immediately
    console.log('[DEBUG] Running initial metrics check...');
    lastCheckTime = now;
    
    checkMetricsAndCreateAlerts()
      .then((alertsCreated) => {
        console.log(`[DEBUG] Initial metrics check complete at ${now.toISOString()}: ${alertsCreated} alerts created`);
        if (alertsCreated > 0) {
          // Remove toast notification, just log to console
          console.log(`[DEBUG] ${alertsCreated} new alert(s) created based on sensor readings`);
        } else {
          console.log('[DEBUG] No alerts created during initial check');
        }
      })
      .catch((error) => {
        console.error('[DEBUG] Error during initial metrics check:', error);
      });
  } else {
    console.log(`[DEBUG] Skipping initial metrics check - last check was ${Math.round((now.getTime() - lastCheckTime!.getTime()) / 1000 / 60)} minutes ago`);
  }
  
  // Set up periodic checking
  checkInterval = setInterval(() => {
    const checkTime = new Date();
    console.log(`[DEBUG] Running periodic metrics check at ${checkTime.toISOString()}...`);
    lastCheckTime = checkTime;
    
    checkMetricsAndCreateAlerts()
      .then((alertsCreated) => {
        console.log(`[DEBUG] Periodic metrics check complete: ${alertsCreated} alerts created`);
        if (alertsCreated > 0) {
          // Remove toast notification, just log to console
          console.log(`[DEBUG] ${alertsCreated} new alert(s) created based on sensor readings`);
        } else {
          console.log('[DEBUG] No alerts created during periodic check');
        }
      })
      .catch((error) => {
        console.error('[DEBUG] Error during periodic metrics check:', error);
      });
  }, interval);
  
  // Return a cleanup function
  return () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
      console.log('[DEBUG] Metrics checker interval cleared');
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
    console.log('[DEBUG] Metrics checker stopped');
  }
};

/**
 * Force a metrics check (for testing only)
 */
export const forceMetricsCheck = async (): Promise<number> => {
  const now = new Date();
  console.log(`[DEBUG] Force metrics check called at ${now.toISOString()}`);
  lastCheckTime = now;
  
  try {
    return await checkMetricsAndCreateAlerts();
  } catch (error) {
    console.error('[DEBUG] Error during forced metrics check:', error);
    return 0;
  }
}; 