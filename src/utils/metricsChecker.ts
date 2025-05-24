import { checkMetricsAndCreateAlerts } from '@/services/alertService';
import logger from '@/utils/logger';

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
    logger.log('[DEBUG] Clearing existing metrics check interval');
    clearInterval(checkInterval);
  }
  
  // Only run initial check if it hasn't been run recently
  const now = new Date();
  const shouldRunInitialCheck = !lastCheckTime || 
    (now.getTime() - lastCheckTime.getTime() > MIN_CHECK_INTERVAL);
  
  logger.log(`[DEBUG] Last metrics check time: ${lastCheckTime?.toISOString() || 'never'}`);
  logger.log(`[DEBUG] Should run initial check: ${shouldRunInitialCheck}`);
  
  if (shouldRunInitialCheck) {
    // Run an initial check immediately
    logger.log('[DEBUG] Running initial metrics check...');
    lastCheckTime = now;
    
    checkMetricsAndCreateAlerts()
      .then((alertsCreated) => {
        logger.log(`[DEBUG] Initial metrics check complete at ${now.toISOString()}: ${alertsCreated} alerts created`);
        if (alertsCreated > 0) {
          // Remove toast notification, just log to console
          logger.log(`[DEBUG] ${alertsCreated} new alert(s) created based on sensor readings`);
        } else {
          logger.log('[DEBUG] No alerts created during initial check');
        }
      })
      .catch((error) => {
        logger.error('[DEBUG] Error during initial metrics check:', error);
      });
  } else {
    logger.log(`[DEBUG] Skipping initial metrics check - last check was ${Math.round((now.getTime() - lastCheckTime!.getTime()) / 1000 / 60)} minutes ago`);
  }
  
  // Set up periodic checking
  checkInterval = setInterval(() => {
    const checkTime = new Date();
    logger.log(`[DEBUG] Running periodic metrics check at ${checkTime.toISOString()}...`);
    lastCheckTime = checkTime;
    
    checkMetricsAndCreateAlerts()
      .then((alertsCreated) => {
        logger.log(`[DEBUG] Periodic metrics check complete: ${alertsCreated} alerts created`);
        if (alertsCreated > 0) {
          // Remove toast notification, just log to console
          logger.log(`[DEBUG] ${alertsCreated} new alert(s) created based on sensor readings`);
        } else {
          logger.log('[DEBUG] No alerts created during periodic check');
        }
      })
      .catch((error) => {
        logger.error('[DEBUG] Error during periodic metrics check:', error);
      });
  }, interval);
  
  // Return a cleanup function
  return () => {
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
      logger.log('[DEBUG] Metrics checker interval cleared');
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
    logger.log('[DEBUG] Metrics checker stopped');
  }
};

/**
 * Force a metrics check (for testing only)
 */
export const forceMetricsCheck = async (): Promise<number> => {
  const now = new Date();
  logger.log(`[DEBUG] Force metrics check called at ${now.toISOString()}`);
  lastCheckTime = now;
  
  try {
    return await checkMetricsAndCreateAlerts();
  } catch (error) {
    logger.error('[DEBUG] Error during forced metrics check:', error);
    return 0;
  }
}; 