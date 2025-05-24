import { supabase } from '@/lib/supabase';
import logger from '@/utils/logger';


export interface Hive {
  name: string;
  hive_id: string;
  apiary_id: string;
  type: string;
  status: string;
  installation_date?: string;
  queen_introduced_date?: string;
  queen_type?: string;
  queen_marked?: boolean;
  queen_marking_color?: string;
  notes?: string;
  image_url?: string;
  alerts_enabled?: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface HiveWithDetails extends Hive {
  apiaryName: string;
  metrics: {
    temperature: Array<{ time: string; value: number }>;
    humidity: Array<{ time: string; value: number }>;
    sound: Array<{ time: string; value: number }>;
    weight: Array<{ time: string; value: number }>;
  };
  alerts: Array<{ id: string; type: string; message: string; severity: string; created_at: string }>;
}

export interface HiveDetails {
  metrics: {
    temperature: { timestamp: string; value: number }[];
    humidity: { timestamp: string; value: number }[];
    weight: { timestamp: string; value: number }[];
    sound: { timestamp: string; value: number }[];
  };
  alerts: {
    id: string;
    type: string;
    message: string;
    timestamp: string;
    severity: string;
  }[];
}

export interface HiveCreateInput {
  name: string;
  apiary_id: string;
  hive_id: string;
  type: string;
  status: string;
  installation_date?: string;
  queen_type?: string;
  queen_introduced_date?: string;
  queen_marked?: boolean;
  queen_marking_color?: string;
  notes?: string;
  alerts_enabled?: boolean;
}

export interface HiveWithFullDetails extends Omit<HiveCreateInput, 'apiary_id'> {
  apiary_id: string;
  apiaryName: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  is_registered: boolean;
  alerts_enabled?: boolean;
  metrics: {
    temperature: { time: string; value: number }[];
    humidity: { time: string; value: number }[];
    weight: { time: string; value: number }[];
    sound: { time: string; value: number }[];
  };
  alerts: {
    id: string;
    type: string;
    message: string;
    severity: string;
    created_at: string;
  }[];
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
 * Fetch all hives for the authenticated user with optimized batch querying and pagination
 * @param page Page number (1-based)
 * @param pageSize Number of items per page
 * @returns Paginated response with hives
 */
export const getAllHives = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<HiveWithFullDetails>> => {
  try {
    // Ensure valid pagination parameters
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(50, Math.max(1, pageSize)); // Limit page size between 1 and 50
    
    // Calculate offset
    const offset = (validPage - 1) * validPageSize;
    
    // Get total count first
    const { count, error: countError } = await supabase
      .from('hives')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      throw countError;
    }

    // Get all hives with apiary name in a single joined query with pagination
    const { data: hives, error } = await supabase
      .from('hives')
      .select(`
        *,
        apiaries (
          name
        )
      `)
      .order('name', { ascending: true })
      .range(offset, offset + validPageSize - 1);

    if (error) {
      throw error;
    }

    if (!hives?.length) {
      return {
        data: [],
        count: count || 0,
        page: validPage,
        pageSize: validPageSize,
        totalPages: Math.ceil((count || 0) / validPageSize)
      };
    }

    // Extract all hive_ids for batch queries - they're now the primary keys
    const hiveIds = hives.map(hive => hive.hive_id);

    // Batch query for time series data - get all metrics in a single query
    const { data: timeSeriesData, error: metricsError } = await supabase
      .from('metrics_time_series_data')
      .select('*')
      .in('hive_id', hiveIds)
      .order('timestamp', { ascending: false });

    if (metricsError) {
      logger.error('Error fetching metrics data:', metricsError);
    }

    // Group metrics by hive_id for faster access
    const metricsByHiveId = timeSeriesData?.reduce((acc, metric) => {
      if (!acc[metric.hive_id]) {
        acc[metric.hive_id] = [];
      }
      acc[metric.hive_id].push(metric);
      return acc;
    }, {} as Record<string, any[]>) || {};

    // Batch query for alerts - get all alerts in a single query
    const { data: allAlerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .in('hive_id', hiveIds)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    if (alertsError) {
      logger.error('Error fetching alerts:', alertsError);
    }

    // Group alerts by hive ID for faster access
    const alertsByHiveId = allAlerts?.reduce((acc, alert) => {
      if (!acc[alert.hive_id]) {
        acc[alert.hive_id] = [];
      }
      acc[alert.hive_id].push(alert);
      return acc;
    }, {} as Record<string, any[]>) || {};

    // Process all hives with their associated metrics and alerts
    const enrichedHives = hives.map((hive) => {
      // Get this hive's metrics and limit to most recent 24
      const hiveMetrics = metricsByHiveId[hive.hive_id] || [];
      const limitedMetrics = hiveMetrics.slice(0, 24);

      // Transform time series data to the format expected by components
      const formattedMetrics = {
        temperature: [],
        humidity: [],
        sound: [],
        weight: []
      };

      if (limitedMetrics.length > 0) {
        // Ensure metrics are in chronological order
        limitedMetrics.reverse().forEach(metric => {
          if (metric.temp_value !== null) {
            formattedMetrics.temperature.push({
              time: metric.time,
              value: metric.temp_value
            });
          }
          if (metric.hum_value !== null) {
            formattedMetrics.humidity.push({
              time: metric.time,
              value: metric.hum_value
            });
          }
          if (metric.sound_value !== null) {
            formattedMetrics.sound.push({
              time: metric.time,
              value: metric.sound_value
            });
          }
          if (metric.weight_value !== null) {
            formattedMetrics.weight.push({
              time: metric.time,
              value: metric.weight_value
            });
          }
        });
      }

      return {
        ...hive,
        apiaryName: hive.apiaries?.name || 'Unknown Apiary',
        metrics: formattedMetrics,
        alerts: alertsByHiveId[hive.hive_id] || []
      };
    });

    return {
      data: enrichedHives,
      count: count || 0,
      page: validPage,
      pageSize: validPageSize,
      totalPages: Math.ceil((count || 0) / validPageSize)
    };
  } catch (error) {
    logger.error('Error in getAllHives:', error);
    throw error;
  }
};

/**
 * Get hives for a specific apiary with optimized batch querying
 */
export const getHivesByApiary = async (apiaryId: string): Promise<HiveWithFullDetails[]> => {
  try {
    // Get hives for this apiary
    const { data: hives, error } = await supabase
      .from('hives')
      .select(`
        *,
        apiaries (
          name
        )
      `)
      .eq('apiary_id', apiaryId)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    if (!hives?.length) {
      return [];
    }

    // Extract all hive_ids for batch queries - they're now the primary keys
    const hiveIds = hives.map(hive => hive.hive_id);

    // Batch query for time series data - get all metrics in a single query
    const { data: timeSeriesData, error: metricsError } = await supabase
      .from('metrics_time_series_data')
      .select('*')
      .in('hive_id', hiveIds)
      .order('timestamp', { ascending: false });

    if (metricsError) {
      logger.error('Error fetching metrics data:', metricsError);
    }

    // Group metrics by hive_id for faster access
    const metricsByHiveId = timeSeriesData?.reduce((acc, metric) => {
      if (!acc[metric.hive_id]) {
        acc[metric.hive_id] = [];
      }
      acc[metric.hive_id].push(metric);
      return acc;
    }, {} as Record<string, any[]>) || {};

    // Batch query for alerts - get all alerts in a single query
    const { data: allAlerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .in('hive_id', hiveIds)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    if (alertsError) {
      logger.error('Error fetching alerts:', alertsError);
    }

    // Group alerts by hive ID for faster access
    const alertsByHiveId = allAlerts?.reduce((acc, alert) => {
      if (!acc[alert.hive_id]) {
        acc[alert.hive_id] = [];
      }
      acc[alert.hive_id].push(alert);
      return acc;
    }, {} as Record<string, any[]>) || {};

    // Process all hives with their associated metrics and alerts
    const enrichedHives = hives.map((hive) => {
      // Get this hive's metrics and limit to most recent 24
      const hiveMetrics = metricsByHiveId[hive.hive_id] || [];
      const limitedMetrics = hiveMetrics.slice(0, 24);

      // Format metrics
      const formattedMetrics = {
        temperature: [],
        humidity: [],
        sound: [],
        weight: []
      };

      if (limitedMetrics.length > 0) {
        limitedMetrics.reverse().forEach(metric => {
          if (metric.temp_value !== null) {
            formattedMetrics.temperature.push({
              time: metric.time,
              value: metric.temp_value
            });
          }
          if (metric.hum_value !== null) {
            formattedMetrics.humidity.push({
              time: metric.time,
              value: metric.hum_value
            });
          }
          if (metric.sound_value !== null) {
            formattedMetrics.sound.push({
              time: metric.time,
              value: metric.sound_value
            });
          }
          if (metric.weight_value !== null) {
            formattedMetrics.weight.push({
              time: metric.time,
              value: metric.weight_value
            });
          }
        });
      }

      return {
        ...hive,
        apiaryName: hive.apiaries?.name || 'Unknown Apiary',
        metrics: formattedMetrics,
        alerts: alertsByHiveId[hive.hive_id] || []
      };
    });

    return enrichedHives;
  } catch (error) {
    logger.error('Error in getHivesByApiary:', error);
    throw error;
  }
};

/**
 * Get a single hive by ID
 */
export const getHiveById = async (hiveId: string): Promise<HiveWithFullDetails | null> => {
  try {
    // Query by 'hive_id' (the device ID)
    const hiveQuery = await supabase
      .from('hives')
      .select(`
        *,
        apiaries (
          name
        )
      `)
      .eq('hive_id', hiveId)
      .maybeSingle();

    if (hiveQuery.error) {
      logger.error('Error fetching hive:', hiveQuery.error);
      throw hiveQuery.error;
    }

    if (!hiveQuery.data) {
      logger.log(`No hive found with hive_id=${hiveId}`);
      return null;
    }

    const hive = hiveQuery.data;

    // Get latest metrics - use the hive_id string directly
    const { data: timeSeriesData, error: metricsError } = await supabase
      .from('metrics_time_series_data')
      .select('*')
      .eq('hive_id', hive.hive_id)
      .order('timestamp', { ascending: false })
      .limit(24);

    if (metricsError) {
      logger.error('Error fetching metrics for hive:', hiveId, metricsError);
    }

    // Get active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .eq('hive_id', hive.hive_id) // Use hive_id for consistency
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    if (alertsError) {
      logger.error('Error fetching alerts for hive:', hiveId, alertsError);
    }

    // Format metrics
    const formattedMetrics = {
      temperature: [],
      humidity: [],
      sound: [],
      weight: []
    };

    if (timeSeriesData && timeSeriesData.length > 0) {
      timeSeriesData.reverse().forEach(metric => {
        if (metric.temp_value !== null) {
          formattedMetrics.temperature.push({
            time: metric.time,
            value: metric.temp_value
          });
        }
        if (metric.hum_value !== null) {
          formattedMetrics.humidity.push({
            time: metric.time,
            value: metric.hum_value
          });
        }
        if (metric.sound_value !== null) {
          formattedMetrics.sound.push({
            time: metric.time,
            value: metric.sound_value
          });
        }
        if (metric.weight_value !== null) {
          formattedMetrics.weight.push({
            time: metric.time,
            value: metric.weight_value
          });
        }
      });
    }

    return {
      ...hive,
      apiaryName: hive.apiaries?.name || 'Unknown Apiary',
      metrics: formattedMetrics,
      alerts: alerts || []
    };
  } catch (error) {
    logger.error('Error in getHiveById:', error);
    throw error;
  }
};

/**
 * Add a new hive
 */
export const addHive = async (hiveData: {
  name: string;
  hive_id: string;
  apiaryId: string;
  type: string;
  status: string;
  installation_date?: string;
  queen_type?: string;
  queen_introduced_date?: string;
  queen_marked?: boolean;
  queen_marking_color?: string;
  notes?: string;
}): Promise<any> => {
  try {
    logger.log('Adding hive with ID:', hiveData.hive_id);
    
    // Clean the hive ID
    const cleanHiveId = hiveData.hive_id.trim();
    
    // Check if hive ID is already registered to another user
    const { data: existingHive, error: existingHiveError } = await supabase
      .from('hives')
      .select('hive_id')
      .eq('hive_id', cleanHiveId)
      .limit(1);
    
    logger.log('Existing hive query result:', existingHive, 'Error:', existingHiveError);
    
    if (existingHiveError) throw existingHiveError;
    
    if (existingHive && existingHive.length > 0) {
      throw new Error('This hive ID is already registered');
    }
    
    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) throw new Error('User not authenticated');

    // Process date fields to handle empty strings
    const installation_date = hiveData.installation_date?.trim() || null;
    const queen_introduced_date = hiveData.queen_introduced_date?.trim() || null;
    
    const { data, error } = await supabase
      .from('hives')
      .insert([
        {
          name: hiveData.name,
          hive_id: cleanHiveId, // Use the cleaned hive ID
          apiary_id: hiveData.apiaryId,
          type: hiveData.type,
          status: hiveData.status,
          installation_date: installation_date,
          queen_type: hiveData.queen_type || null,
          queen_introduced_date: queen_introduced_date,
          queen_marked: hiveData.queen_marked || false,
          queen_marking_color: hiveData.queen_marking_color || null,
          notes: hiveData.notes || null,
          user_id: user.id,
        },
      ])
      .select();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error adding hive:', error);
    throw error;
  }
};

/**
 * Update an existing hive
 */
export const updateHive = async (
  hiveId: string, 
  updates: Partial<HiveCreateInput>
): Promise<HiveWithFullDetails> => {
  try {
    // Process date fields to handle empty strings
    if (updates.installation_date !== undefined) {
      updates.installation_date = updates.installation_date?.trim() || null;
    }
    if (updates.queen_introduced_date !== undefined) {
      updates.queen_introduced_date = updates.queen_introduced_date?.trim() || null;
    }
    
    const { data, error } = await supabase
      .from('hives')
      .update(updates)
      .eq('hive_id', hiveId)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    // Get the apiary name for the updated hive
    const { data: apiary, error: apiaryError } = await supabase
      .from('apiaries')
      .select('name')
      .eq('id', data.apiary_id)
      .single();
    
    if (apiaryError) {
      logger.error('Error fetching apiary name:', apiaryError);
    }
    
    // Get latest metrics
    const { data: metricsData, error: metricsError } = await supabase
      .from('metrics_time_series_data')
      .select('*')
      .eq('hive_id', hiveId)
      .order('timestamp', { ascending: false })
      .limit(24);
    
    if (metricsError) {
      logger.error('Error fetching metrics:', metricsError);
    }
    
    // Get active alerts
    const { data: alertsData, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .eq('hive_id', hiveId)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });
    
    if (alertsError) {
      logger.error('Error fetching alerts:', alertsError);
    }
    
    // Format metrics
    const formattedMetrics = {
      temperature: [],
      humidity: [],
      sound: [],
      weight: []
    };
    
    if (metricsData && metricsData.length > 0) {
      metricsData.reverse().forEach(metric => {
        if (metric.temp_value !== null) {
          formattedMetrics.temperature.push({
            time: metric.time,
            value: metric.temp_value
          });
        }
        if (metric.hum_value !== null) {
          formattedMetrics.humidity.push({
            time: metric.time,
            value: metric.hum_value
          });
        }
        if (metric.sound_value !== null) {
          formattedMetrics.sound.push({
            time: metric.time,
            value: metric.sound_value
          });
        }
        if (metric.weight_value !== null) {
          formattedMetrics.weight.push({
            time: metric.time,
            value: metric.weight_value
          });
        }
      });
    }
    
    return {
      ...data,
      apiaryName: apiary?.name || 'Unknown Apiary',
      metrics: formattedMetrics,
      alerts: alertsData || []
    };
  } catch (error) {
    logger.error('Error updating hive:', error);
    throw error;
  }
};

/**
 * Delete a hive
 */
export const deleteHive = async (hiveId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('hives')
      .delete()
      .eq('hive_id', hiveId);

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.error('Error deleting hive:', error);
    throw error;
  }
};

/**
 * Checks if a hive ID exists in the metrics_time_series_data table and is not already registered to a user
 */
export const checkHiveAvailability = async (hiveId: string): Promise<{ exists: boolean; available: boolean; error?: string }> => {
  try {
    logger.log('Checking availability for hive ID:', hiveId);
    
    // Now we just check if the hive is already registered in the hives table
    const { data: existingHive, error: hiveError } = await supabase
      .from('hives')
      .select('hive_id, is_registered, user_id')
      .eq('hive_id', hiveId.trim())
      .maybeSingle();
    
    logger.log('Existing hive query result:', existingHive, 'Error:', hiveError);
    
    if (hiveError) throw hiveError;
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      return { exists: false, available: false, error: 'You must be logged in to register a hive' };
    }
    
    // If hive already exists in the hives table
    if (existingHive) {
      // Check if the hive is already registered
      if (existingHive.is_registered && existingHive.user_id && existingHive.user_id !== user.id) {
        return { exists: false, available: false, error: 'This hive is already registered to another user' };
      }
      
      // Check if the hive belongs to the current user
      if (existingHive.user_id === user.id) {
        return { exists: false, available: false, error: 'You have already registered this hive' };
      }
    }
    
    // The hive is available to register (either doesn't exist or isn't registered)
    logger.log('Hive is available for registration');
    return { exists: true, available: true };
  } catch (error) {
    logger.error('Error checking hive availability:', error);
    return { exists: false, available: false, error: 'Error checking hive ID' };
  }
};

/**
 * Fetches detailed metrics and alerts for a specific hive
 * @param hiveId The hive_id primary key of the hive
 */
export const fetchHiveDetails = async (hiveId: string): Promise<HiveDetails> => {
  try {
    // Use the hive_id directly for querying
    const hiveIdToUse = hiveId;
    
    // Fetch metrics from the metrics_time_series_data table using hive_id directly
    const { data: metricsData, error: metricsError } = await supabase
      .from('metrics_time_series_data')
      .select('*')
      .eq('hive_id', hiveIdToUse)
      .order('timestamp', { ascending: false })
      .limit(200);

    if (metricsError) throw metricsError;

    // Organize metrics by type
    const metrics = {
      temperature: [],
      humidity: [],
      weight: [],
      sound: []
    };

    if (metricsData && metricsData.length > 0) {
      metricsData.forEach(record => {
        // Extract temperature data
        if (record.temp_value !== null) {
          metrics.temperature.push({
            timestamp: record.timestamp,
            value: parseFloat(record.temp_value)
          });
        }
        
        // Extract humidity data
        if (record.hum_value !== null) {
          metrics.humidity.push({
            timestamp: record.timestamp,
            value: parseFloat(record.hum_value)
          });
        }
        
        // Extract weight data
        if (record.weight_value !== null) {
          metrics.weight.push({
            timestamp: record.timestamp,
            value: parseFloat(record.weight_value)
          });
        }
        
        // Extract sound data
        if (record.sound_value !== null) {
          metrics.sound.push({
            timestamp: record.timestamp,
            value: parseFloat(record.sound_value)
          });
        }
      });

      // Sort metrics by timestamp (newest first)
      metrics.temperature.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      metrics.humidity.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      metrics.weight.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      metrics.sound.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }

    // Fetch alerts for the hive
    const { data: alertsData, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .eq('hive_id', hiveIdToUse)
      .order('created_at', { ascending: false })
      .limit(10);

    if (alertsError) throw alertsError;

    const alerts = alertsData?.map(alert => ({
      id: alert.id,
      type: alert.type,
      message: alert.message,
      timestamp: alert.created_at,
      severity: alert.severity
    })) || [];

    return { metrics, alerts };
  } catch (error) {
    logger.error(`Error fetching hive details for hive ${hiveId}:`, error);
    // Return empty data structure in case of error
    return {
      metrics: {
        temperature: [],
        humidity: [],
        weight: [],
        sound: []
      },
      alerts: []
    };
  }
};

/**
 * Toggle alerts enabled/disabled for a hive
 */
export const toggleHiveAlerts = async (hiveId: string, enabled: boolean): Promise<void> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('User not authenticated');
    }

    const { error } = await supabase
      .from('hives')
      .update({ alerts_enabled: enabled })
      .eq('hive_id', hiveId)
      .eq('user_id', userData.user.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    logger.error('Error toggling hive alerts:', error);
    throw error;
  }
};

/**
 * Optimized function to fetch hives with basic metrics for dashboard
 * This function reduces database calls by using efficient queries and limiting data
 */
export const getDashboardHives = async (): Promise<HiveWithFullDetails[]> => {
  try {
    // Get all hives with apiary names in a single query
    const { data: hives, error } = await supabase
      .from('hives')
      .select(`
        *,
        apiaries (
          name
        )
      `)
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    if (!hives?.length) {
      return [];
    }

    // Extract all hive_ids for batch queries
    const hiveIds = hives.map(hive => hive.hive_id);

    // Get the latest metrics for all hives in a single query
    // Using a SQL function that returns only the latest metrics per hive
    const { data: latestMetrics, error: metricsError } = await supabase
      .rpc('get_latest_metrics_for_dashboard');

    // Group metrics by hive_id
    const metricsByHiveId = latestMetrics?.reduce((acc, metric) => {
      if (!acc[metric.hive_id]) {
        acc[metric.hive_id] = metric;
      }
      return acc;
    }, {} as Record<string, any>) || {};

    // Get active alerts for all hives in a single query
    const { data: activeAlerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .in('hive_id', hiveIds)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    if (alertsError) {
      logger.error('Error fetching alerts:', alertsError);
    }

    // Group alerts by hive ID
    const alertsByHiveId = activeAlerts?.reduce((acc, alert) => {
      if (!acc[alert.hive_id]) {
        acc[alert.hive_id] = [];
      }
      acc[alert.hive_id].push(alert);
      return acc;
    }, {} as Record<string, any[]>) || {};

    // Process all hives with their associated metrics and alerts
    const enrichedHives = hives.map((hive) => {
      const apiaryName = hive.apiaries?.name || 'Unknown Apiary';
      const latestMetric = metricsByHiveId[hive.hive_id] || {};
      const hiveAlerts = alertsByHiveId[hive.hive_id] || [];
      
      // Create metrics structure with just the latest value
      const metrics = {
        temperature: latestMetric.temp_value !== undefined ? [{ 
          time: latestMetric.timestamp, 
          value: latestMetric.temp_value 
        }] : [],
        humidity: latestMetric.hum_value !== undefined ? [{ 
          time: latestMetric.timestamp, 
          value: latestMetric.hum_value 
        }] : [],
        sound: latestMetric.sound_value !== undefined ? [{ 
          time: latestMetric.timestamp, 
          value: latestMetric.sound_value 
        }] : [],
        weight: latestMetric.weight_value !== undefined ? [{ 
          time: latestMetric.timestamp, 
          value: latestMetric.weight_value 
        }] : []
      };

      // Format alerts
      const formattedAlerts = hiveAlerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        created_at: alert.created_at
      }));

      return {
        ...hive,
        apiaryName,
        metrics,
        alerts: formattedAlerts
      };
    });

    return enrichedHives;
  } catch (error) {
    logger.error('Error in getDashboardHives:', error);
    throw error;
  }
};