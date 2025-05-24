import logger from '@/utils/logger';

import { supabase } from '@/lib/supabase';

export interface Alert {
  id: string;
  hive_id: string;
  hive_name: string;
  apiary_id: string;
  apiary_name: string;
  type: string;
  message: string;
  severity: string;
  created_at: string;
  is_read: boolean;
  resolved_at: string | null;
}

/**
 * Pagination response interface
 */
export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/**
 * Get all active alerts for the authenticated user with pagination
 * @param page Page number (1-based)
 * @param pageSize Number of items per page
 * @returns Paginated response with alerts
 */
export const getAllAlerts = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<Alert>> => {
  try {
    // Ensure valid pagination parameters
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(50, Math.max(1, pageSize)); // Limit page size between 1 and 50
    
    // Calculate offset
    const offset = (validPage - 1) * validPageSize;
    
    // Use a direct query instead of relying on nested relations
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Get total count first
    const { count, error: countError } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)
      .is('resolved_at', null);
      
    if (countError) {
      throw countError;
    }

    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userData.user.id)
      .is('resolved_at', null)
      .order('created_at', { ascending: false })
      .range(offset, offset + validPageSize - 1);

    if (error) {
      throw error;
    }

    if (!alerts?.length) {
      return {
        data: [],
        count: count || 0,
        page: validPage,
        pageSize: validPageSize,
        totalPages: Math.ceil((count || 0) / validPageSize)
      };
    }

    // Get hives information for all alerts
    const hiveIds = [...new Set(alerts.map(alert => alert.hive_id))];
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select('hive_id, name, apiary_id')
      .in('hive_id', hiveIds);

    if (hivesError) {
      throw hivesError;
    }

    // Get apiary information for all hives
    const apiaryIds = [...new Set(hives.map(hive => hive.apiary_id))];
    const { data: apiaries, error: apiariesError } = await supabase
      .from('apiaries')
      .select('id, name')
      .in('id', apiaryIds);

    if (apiariesError) {
      throw apiariesError;
    }

    // Create maps for easy lookup
    const hiveMap = Object.fromEntries(
      hives.map(hive => [hive.hive_id, hive])
    );
    const apiaryMap = Object.fromEntries(
      apiaries.map(apiary => [apiary.id, apiary])
    );

    // Transform the data to match our interface
    const transformedAlerts = alerts.map(alert => {
      const hive = hiveMap[alert.hive_id] || { name: `Unknown Hive - ${alert.hive_id}`, apiary_id: '' };
      const apiary = apiaryMap[hive.apiary_id] || { name: 'Unknown Apiary' };
      
      return {
        ...alert,
        hive_name: hive.name,
        apiary_id: hive.apiary_id,
        apiary_name: apiary.name,
      };
    });

    return {
      data: transformedAlerts,
      count: count || 0,
      page: validPage,
      pageSize: validPageSize,
      totalPages: Math.ceil((count || 0) / validPageSize)
    };
  } catch (error) {
    logger.error('Error fetching alerts:', error);
    throw error;
  }
};

/**
 * Get alerts for a specific hive
 */
export const getAlertsByHive = async (hiveId: string): Promise<Alert[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Get the hive information first
    const { data: hive, error: hiveError } = await supabase
      .from('hives')
      .select('hive_id, name, apiary_id')
      .eq('hive_id', hiveId)
      .eq('user_id', userData.user.id)
      .single();

    if (hiveError) {
      throw hiveError;
    }

    // Get the apiary information
    const { data: apiary, error: apiaryError } = await supabase
      .from('apiaries')
      .select('id, name')
      .eq('id', hive.apiary_id)
      .single();

    if (apiaryError) {
      throw apiaryError;
    }

    // Get the alerts for this hive
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('hive_id', hiveId)
      .eq('user_id', userData.user.id)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!alerts?.length) {
      return [];
    }

    // Transform the data to match our interface
    const transformedAlerts = alerts.map(alert => ({
      ...alert,
      hive_name: hive.name,
      apiary_id: hive.apiary_id,
      apiary_name: apiary.name,
    }));

    return transformedAlerts;
  } catch (error) {
    logger.error('Error fetching hive alerts:', error);
    throw error;
  }
};

/**
 * Get alerts for a specific apiary
 */
export const getAlertsByApiary = async (apiaryId: string): Promise<Alert[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Get the apiary information
    const { data: apiary, error: apiaryError } = await supabase
      .from('apiaries')
      .select('id, name')
      .eq('id', apiaryId)
      .eq('user_id', userData.user.id)
      .single();

    if (apiaryError) {
      throw apiaryError;
    }

    // Get all hives in this apiary
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select('hive_id, name, apiary_id')
      .eq('apiary_id', apiaryId)
      .eq('user_id', userData.user.id);

    if (hivesError) {
      throw hivesError;
    }

    if (!hives?.length) {
      return [];
    }

    // Get alerts for all of these hives
    const hiveIds = hives.map(hive => hive.hive_id);
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .in('hive_id', hiveIds)
      .eq('user_id', userData.user.id)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!alerts?.length) {
      return [];
    }

    // Create a map for easy hive lookup
    const hiveMap = Object.fromEntries(
      hives.map(hive => [hive.hive_id, hive])
    );

    // Transform the data to match our interface
    const transformedAlerts = alerts.map(alert => {
      const hive = hiveMap[alert.hive_id] || { name: `Unknown Hive - ${alert.hive_id}`, apiary_id: apiaryId };
      
      return {
        ...alert,
        hive_name: hive.name,
        apiary_id: apiaryId,
        apiary_name: apiary.name,
      };
    });

    return transformedAlerts;
  } catch (error) {
    logger.error('Error fetching apiary alerts:', error);
    throw error;
  }
};

/**
 * Mark an alert as resolved
 */
export const resolveAlert = async (alertId: string): Promise<void> => {
  try {
    logger.log(`[DEBUG] Resolving alert with ID: ${alertId}`);
    
    // Get the alert to be resolved
    const { data: alert, error: getError } = await supabase
      .from('alerts')
      .select('*')
      .eq('id', alertId)
      .single();
      
    if (getError) {
      logger.error('[DEBUG] Error getting alert for resolution:', getError);
      throw getError;
    }
    
    const resolved_at = new Date().toISOString();
    logger.log(`[DEBUG] Alert being resolved:`, alert);
    logger.log(`[DEBUG] Resolution timestamp: ${resolved_at}`);
    
    const { error } = await supabase
      .from('alerts')
      .update({ 
        resolved_at: resolved_at,
        is_read: true
      })
      .eq('id', alertId);

    if (error) {
      logger.error('[DEBUG] Error resolving alert:', error);
      throw error;
    }
    
    logger.log(`[DEBUG] Alert ${alertId} successfully resolved`);
  } catch (error) {
    logger.error('Error resolving alert:', error);
    throw error;
  }
};

/**
 * Mark an alert as read
 */
export const markAlertAsRead = async (alertId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('alerts')
      .update({ is_read: true })
      .eq('id', alertId);

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.error('Error marking alert as read:', error);
    throw error;
  }
};

/**
 * Create a new alert
 */
export const createAlert = async (alertData: {
  hive_id: string;
  type: string;
  message: string;
  severity: string;
}): Promise<Alert> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('alerts')
      .insert([{
        ...alertData,
        user_id: userData.user.id,
        is_read: false,
        created_at: new Date().toISOString()
      }])
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Get the hive information
    const { data: hive, error: hiveError } = await supabase
      .from('hives')
      .select('hive_id, name, apiary_id')
      .eq('hive_id', data.hive_id)
      .single();

    if (hiveError) {
      throw hiveError;
    }

    // Get the apiary information
    const { data: apiary, error: apiaryError } = await supabase
      .from('apiaries')
      .select('id, name')
      .eq('id', hive.apiary_id)
      .single();

    if (apiaryError) {
      throw apiaryError;
    }

    return {
      ...data,
      hive_name: hive.name,
      apiary_id: hive.apiary_id,
      apiary_name: apiary.name,
    };
  } catch (error) {
    logger.error('Error creating alert:', error);
    throw error;
  }
};

/**
 * Get alert count for dashboard
 */
export const getActiveAlertCount = async (): Promise<number> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return 0;
    }

    const { count, error } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id)
      .is('resolved_at', null);

    if (error) {
      throw error;
    }

    return count || 0;
  } catch (error) {
    logger.error('Error getting alert count:', error);
    return 0;
  }
};

/**
 * Check all hives' latest metrics against threshold values and create alerts when exceeded
 * This function should be called periodically to update alerts
 */
export const checkMetricsAndCreateAlerts = async (): Promise<number> => {
  try {
    logger.log('Starting alert check process...');
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      logger.error('No authenticated user found');
      throw new Error('User not authenticated');
    }
    logger.log(`Checking metrics for user: ${userData.user.id}`);

    // Get the user's alert thresholds
    const { data: thresholds, error: thresholdsError } = await supabase
      .from('alert_thresholds')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (thresholdsError) {
      if (thresholdsError.code === 'PGRST116') { // No rows returned
        logger.log('No alert thresholds found, using defaults');
        // Use default values if no thresholds are set
        const defaultThresholds = {
          temperature_min: 32,
          temperature_max: 36,
          humidity_min: 40,
          humidity_max: 65,
          sound_min: 30,
          sound_max: 60,
          weight_min: 10,
          weight_max: 25,
        };
        logger.log('Using default thresholds:', defaultThresholds);
        return checkWithThresholds(userData.user.id, defaultThresholds);
      }
      logger.error('Error fetching thresholds:', thresholdsError);
      throw thresholdsError;
    }

    logger.log('Found user thresholds:', thresholds);
    return checkWithThresholds(userData.user.id, thresholds);
  } catch (error) {
    logger.error('Error checking metrics and creating alerts:', error);
    return 0;
  }
};

/**
 * Helper function to check metrics against thresholds
 */
const checkWithThresholds = async (userId: string, thresholds: any): Promise<number> => {
  try {
    // Get all active hives for this user
    logger.log(`Fetching hives with alerts enabled for user ${userId}`);
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select('*')
      .eq('user_id', userId)
      .eq('alerts_enabled', true);

    if (hivesError) {
      logger.error('Error fetching hives:', hivesError);
      throw hivesError;
    }
    
    if (!hives?.length) {
      logger.log('No hives found with alerts enabled');
      return 0;
    }
    
    logger.log(`Found ${hives.length} hives with alerts enabled`);

    // Get the latest metrics for each hive
    let alertsCreated = 0;
    
    for (const hive of hives) {
      logger.log(`Checking metrics for hive: ${hive.hive_id} (${hive.name})`);
      // Get ONLY the most recent metrics data point for this hive
      // This is important: we only check the very latest reading, not all data from the last interval
      const { data: metrics, error: metricsError } = await supabase
        .from('metrics_time_series_data')
        .select('*')
        .eq('hive_id', hive.hive_id)
        .order('timestamp', { ascending: false })
        .limit(1); // Ensures we only get the single most recent data point

      if (metricsError) {
        logger.error(`Error fetching metrics for hive ${hive.hive_id}:`, metricsError);
        continue;
      }

      if (!metrics?.length) {
        logger.log(`No metrics found for hive ${hive.hive_id}`);
        continue;
      }
      
      const latestMetric = metrics[0];
      logger.log(`Latest metric for hive ${hive.hive_id}:`, {
        temp: latestMetric.temp_value,
        humidity: latestMetric.hum_value, 
        sound: latestMetric.sound_value,
        weight: latestMetric.weight_value
      });
      
      // Check temperature
      if (latestMetric.temp_value !== null) {
        const temp = parseFloat(latestMetric.temp_value);
        logger.log(`Temperature value: ${temp}, thresholds: min=${thresholds.temperature_min}, max=${thresholds.temperature_max}`);
        
        if (temp > thresholds.temperature_max) {
          logger.log(`Temperature above max threshold: ${temp} > ${thresholds.temperature_max}`);
          await createAlertIfNotExists(userId, hive.hive_id, 'temperature', 
            `Temperature is too high (${temp.toFixed(1)}°C)`, 'high');
          alertsCreated++;
        } 
        else if (temp < thresholds.temperature_min) {
          logger.log(`Temperature below min threshold: ${temp} < ${thresholds.temperature_min}`);
          await createAlertIfNotExists(userId, hive.hive_id, 'temperature', 
            `Temperature is too low (${temp.toFixed(1)}°C)`, 'medium');
          alertsCreated++;
        }
        else {
          logger.log(`Temperature within normal range: ${thresholds.temperature_min} <= ${temp} <= ${thresholds.temperature_max}`);
        }
      }
      
      // Check humidity
      if (latestMetric.hum_value !== null) {
        const humidity = parseFloat(latestMetric.hum_value);
        logger.log(`Humidity value: ${humidity}, thresholds: min=${thresholds.humidity_min}, max=${thresholds.humidity_max}`);
        
        if (humidity > thresholds.humidity_max) {
          logger.log(`Humidity above max threshold: ${humidity} > ${thresholds.humidity_max}`);
          await createAlertIfNotExists(userId, hive.hive_id, 'humidity', 
            `Humidity is too high (${humidity.toFixed(1)}%)`, 'medium');
          alertsCreated++;
        } 
        else if (humidity < thresholds.humidity_min) {
          logger.log(`Humidity below min threshold: ${humidity} < ${thresholds.humidity_min}`);
          await createAlertIfNotExists(userId, hive.hive_id, 'humidity', 
            `Humidity is too low (${humidity.toFixed(1)}%)`, 'medium');
          alertsCreated++;
        }
        else {
          logger.log(`Humidity within normal range: ${thresholds.humidity_min} <= ${humidity} <= ${thresholds.humidity_max}`);
        }
      }
      
      // Check sound
      if (latestMetric.sound_value !== null) {
        const sound = parseFloat(latestMetric.sound_value);
        logger.log(`Sound value: ${sound}, thresholds: min=${thresholds.sound_min}, max=${thresholds.sound_max}`);
        
        if (sound > thresholds.sound_max) {
          logger.log(`Sound above max threshold: ${sound} > ${thresholds.sound_max}`);
          await createAlertIfNotExists(userId, hive.hive_id, 'sound', 
            `Sound level is too high (${sound.toFixed(1)} dB)`, 'medium');
          alertsCreated++;
        } 
        else if (sound < thresholds.sound_min) {
          logger.log(`Sound below min threshold: ${sound} < ${thresholds.sound_min}`);
          await createAlertIfNotExists(userId, hive.hive_id, 'sound', 
            `Sound level is too low (${sound.toFixed(1)} dB)`, 'low');
          alertsCreated++;
        }
        else {
          logger.log(`Sound within normal range: ${thresholds.sound_min} <= ${sound} <= ${thresholds.sound_max}`);
        }
      }
      
      // Check weight
      if (latestMetric.weight_value !== null) {
        const weight = parseFloat(latestMetric.weight_value);
        logger.log(`Weight value: ${weight}, thresholds: min=${thresholds.weight_min}, max=${thresholds.weight_max}`);
        
        if (weight > thresholds.weight_max) {
          logger.log(`Weight above max threshold: ${weight} > ${thresholds.weight_max}`);
          await createAlertIfNotExists(userId, hive.hive_id, 'weight', 
            `Weight is too high (${weight.toFixed(1)} kg)`, 'medium');
          alertsCreated++;
        } 
        else if (weight < thresholds.weight_min) {
          logger.log(`Weight below min threshold: ${weight} < ${thresholds.weight_min}`);
          await createAlertIfNotExists(userId, hive.hive_id, 'weight', 
            `Weight is too low (${weight.toFixed(1)} kg)`, 'high');
          alertsCreated++;
        }
        else {
          logger.log(`Weight within normal range: ${thresholds.weight_min} <= ${weight} <= ${thresholds.weight_max}`);
        }
      }
    }
    
    logger.log(`Alert check complete, ${alertsCreated} alerts created`);
    return alertsCreated;
  } catch (error) {
    logger.error('Error in checkWithThresholds:', error);
    return 0;
  }
};

/**
 * Helper function to create an alert if one doesn't already exist for this condition
 */
const createAlertIfNotExists = async (
  userId: string, 
  hiveId: string, 
  type: string, 
  message: string, 
  severity: string
): Promise<void> => {
  try {
    logger.log(`[DEBUG] Checking for existing/recent ${type} alerts for hive ${hiveId}`);
    
    // Check if a similar unresolved alert already exists
    const { data: activeAlerts, error: activeError } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('hive_id', hiveId)
      .eq('type', type)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });
      
    if (activeError) {
      logger.error('[DEBUG] Error checking for existing alerts:', activeError);
      throw activeError;
    }
    
    // Also check for recently resolved alerts of the same type (within last hour)
    // This prevents alerts from reappearing immediately after resolution
    const oneHourAgo = new Date();
    oneHourAgo.setHours(oneHourAgo.getHours() - 1);
    const oneHourAgoStr = oneHourAgo.toISOString();
    
    logger.log(`[DEBUG] Checking for alerts resolved after: ${oneHourAgoStr}`);
    
    const { data: recentlyResolvedAlerts, error: resolvedError } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('hive_id', hiveId)
      .eq('type', type)
      .not('resolved_at', 'is', null)
      .gt('resolved_at', oneHourAgoStr)
      .order('resolved_at', { ascending: false });
    
    if (resolvedError) {
      logger.error('[DEBUG] Error checking for recently resolved alerts:', resolvedError);
      throw resolvedError;
    }
    
    // Log results of both queries
    logger.log(`[DEBUG] Found ${activeAlerts?.length || 0} active alerts and ${recentlyResolvedAlerts?.length || 0} recently resolved alerts`);
    
    // Function to check message similarity
    const isMessageSimilar = (existingMessage: string) => {
      const messageWords = message.toLowerCase().split(' ');
      const existingMessageWords = existingMessage.toLowerCase().split(' ');
      // Check if at least 70% of words are the same (simple similarity check)
      const commonWords = messageWords.filter(word => existingMessageWords.includes(word));
      const similarity = commonWords.length / Math.min(messageWords.length, existingMessageWords.length);
      logger.log(`[DEBUG] Message similarity: ${similarity.toFixed(2)} comparing "${message}" with "${existingMessage}"`);
      return similarity >= 0.7;
    };
    
    // Check active alerts
    if (activeAlerts && activeAlerts.length > 0) {
      const similarAlertExists = activeAlerts.some(alert => isMessageSimilar(alert.message));
      
      if (similarAlertExists) {
        logger.log(`[DEBUG] Similar ACTIVE alert already exists for ${type} on hive ${hiveId}, skipping creation`);
        return;
      }
    }
    
    // Check recently resolved alerts
    if (recentlyResolvedAlerts && recentlyResolvedAlerts.length > 0) {
      const similarResolvedAlert = recentlyResolvedAlerts.some(alert => isMessageSimilar(alert.message));
      
      if (similarResolvedAlert) {
        logger.log(`[DEBUG] Similar alert was RECENTLY RESOLVED for ${type} on hive ${hiveId}, skipping creation`);
        return;
      }
    }
    
    // Create a new alert
    logger.log(`[DEBUG] Creating new alert: ${type} (${severity}) - ${message}`);
    const { data, error } = await supabase
      .from('alerts')
      .insert({
        user_id: userId,
        hive_id: hiveId,
        type,
        message,
        severity,
        created_at: new Date().toISOString(),
        is_read: false
      });
      
    if (error) {
      logger.error('[DEBUG] Error creating alert:', error);
      throw error;
    }
    
    logger.log(`[DEBUG] Alert created successfully for hive ${hiveId}: ${type} - ${message}`);
  } catch (error) {
    logger.error('[DEBUG] Error in createAlertIfNotExists:', error);
  }
}; 