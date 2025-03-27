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
 * Get all active alerts for the authenticated user
 */
export const getAllAlerts = async (): Promise<Alert[]> => {
  try {
    // Use a direct query instead of relying on nested relations
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const { data: alerts, error } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userData.user.id)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    if (!alerts?.length) {
      return [];
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

    return transformedAlerts;
  } catch (error) {
    console.error('Error fetching alerts:', error);
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
    console.error('Error fetching hive alerts:', error);
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
    console.error('Error fetching apiary alerts:', error);
    throw error;
  }
};

/**
 * Mark an alert as resolved
 */
export const resolveAlert = async (alertId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('alerts')
      .update({ 
        resolved_at: new Date().toISOString(),
        is_read: true
      })
      .eq('id', alertId);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error resolving alert:', error);
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
    console.error('Error marking alert as read:', error);
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
    console.error('Error creating alert:', error);
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
    console.error('Error getting alert count:', error);
    return 0;
  }
};

/**
 * Check all hives' latest metrics against threshold values and create alerts when exceeded
 * This function should be called periodically to update alerts
 */
export const checkMetricsAndCreateAlerts = async (): Promise<number> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    // Get the user's alert thresholds
    const { data: thresholds, error: thresholdsError } = await supabase
      .from('alert_thresholds')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (thresholdsError) {
      if (thresholdsError.code === 'PGRST116') { // No rows returned
        console.log('No alert thresholds found, using defaults');
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
        return checkWithThresholds(userData.user.id, defaultThresholds);
      }
      throw thresholdsError;
    }

    return checkWithThresholds(userData.user.id, thresholds);
  } catch (error) {
    console.error('Error checking metrics and creating alerts:', error);
    return 0;
  }
};

/**
 * Helper function to check metrics against thresholds
 */
const checkWithThresholds = async (userId: string, thresholds: any): Promise<number> => {
  try {
    // Get all active hives for this user
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select('*')
      .eq('user_id', userId)
      .eq('alerts_enabled', true);

    if (hivesError) throw hivesError;
    if (!hives?.length) return 0;

    // Get the latest metrics for each hive
    let alertsCreated = 0;
    
    for (const hive of hives) {
      // Get the most recent metrics for this hive
      const { data: metrics, error: metricsError } = await supabase
        .from('metrics_time_series_data')
        .select('*')
        .eq('hive_id', hive.hive_id)
        .order('timestamp', { ascending: false })
        .limit(1);

      if (metricsError) {
        console.error(`Error fetching metrics for hive ${hive.hive_id}:`, metricsError);
        continue;
      }

      if (!metrics?.length) continue;
      
      const latestMetric = metrics[0];
      const now = new Date().toISOString();
      
      // Check temperature
      if (latestMetric.temp_value !== null) {
        const temp = parseFloat(latestMetric.temp_value);
        
        if (temp > thresholds.temperature_max) {
          await createAlertIfNotExists(userId, hive.hive_id, 'temperature', 
            `Temperature is too high (${temp.toFixed(1)}°C)`, 'high');
          alertsCreated++;
        } 
        else if (temp < thresholds.temperature_min) {
          await createAlertIfNotExists(userId, hive.hive_id, 'temperature', 
            `Temperature is too low (${temp.toFixed(1)}°C)`, 'medium');
          alertsCreated++;
        }
      }
      
      // Check humidity
      if (latestMetric.hum_value !== null) {
        const humidity = parseFloat(latestMetric.hum_value);
        
        if (humidity > thresholds.humidity_max) {
          await createAlertIfNotExists(userId, hive.hive_id, 'humidity', 
            `Humidity is too high (${humidity.toFixed(1)}%)`, 'medium');
          alertsCreated++;
        } 
        else if (humidity < thresholds.humidity_min) {
          await createAlertIfNotExists(userId, hive.hive_id, 'humidity', 
            `Humidity is too low (${humidity.toFixed(1)}%)`, 'medium');
          alertsCreated++;
        }
      }
      
      // Check sound
      if (latestMetric.sound_value !== null) {
        const sound = parseFloat(latestMetric.sound_value);
        
        if (sound > thresholds.sound_max) {
          await createAlertIfNotExists(userId, hive.hive_id, 'sound', 
            `Sound level is too high (${sound.toFixed(1)} dB)`, 'medium');
          alertsCreated++;
        } 
        else if (sound < thresholds.sound_min) {
          await createAlertIfNotExists(userId, hive.hive_id, 'sound', 
            `Sound level is too low (${sound.toFixed(1)} dB)`, 'low');
          alertsCreated++;
        }
      }
      
      // Check weight
      if (latestMetric.weight_value !== null) {
        const weight = parseFloat(latestMetric.weight_value);
        
        if (weight > thresholds.weight_max) {
          await createAlertIfNotExists(userId, hive.hive_id, 'weight', 
            `Weight is too high (${weight.toFixed(1)} kg)`, 'medium');
          alertsCreated++;
        } 
        else if (weight < thresholds.weight_min) {
          await createAlertIfNotExists(userId, hive.hive_id, 'weight', 
            `Weight is too low (${weight.toFixed(1)} kg)`, 'high');
          alertsCreated++;
        }
      }
    }
    
    return alertsCreated;
  } catch (error) {
    console.error('Error in checkWithThresholds:', error);
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
    // Check if a similar unresolved alert already exists
    const { data: existingAlerts, error: queryError } = await supabase
      .from('alerts')
      .select('*')
      .eq('user_id', userId)
      .eq('hive_id', hiveId)
      .eq('type', type)
      .is('resolved_at', null);
      
    if (queryError) throw queryError;
    
    // If a similar alert already exists, don't create a new one
    if (existingAlerts && existingAlerts.length > 0) {
      return;
    }
    
    // Create a new alert
    const { error } = await supabase
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
      
    if (error) throw error;
  } catch (error) {
    console.error('Error creating alert:', error);
  }
}; 