import { supabase } from '@/lib/supabase';

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
 * Fetch all hives for the authenticated user with optimized batch querying
 */
export const getAllHives = async (): Promise<HiveWithFullDetails[]> => {
  try {
    // Get all hives with apiary name in a single joined query
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

    // Extract all hive_ids for batch queries - they're now the primary keys
    const hiveIds = hives.map(hive => hive.hive_id);

    // Batch query for time series data - get all metrics in a single query
    const { data: timeSeriesData, error: metricsError } = await supabase
      .from('metrics_time_series_data')
      .select('*')
      .in('hive_id', hiveIds)
      .order('timestamp', { ascending: false });

    if (metricsError) {
      console.error('Error fetching metrics data:', metricsError);
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
      console.error('Error fetching alerts:', alertsError);
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

    return enrichedHives;
  } catch (error) {
    console.error('Error in getAllHives:', error);
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
      console.error('Error fetching metrics data:', metricsError);
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
      console.error('Error fetching alerts:', alertsError);
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
    console.error('Error in getHivesByApiary:', error);
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
      console.error('Error fetching hive:', hiveQuery.error);
      throw hiveQuery.error;
    }

    if (!hiveQuery.data) {
      console.log(`No hive found with hive_id=${hiveId}`);
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
      console.error('Error fetching metrics for hive:', hiveId, metricsError);
    }

    // Get active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .eq('hive_id', hive.hive_id) // Use hive_id for consistency
      .is('resolved_at', null)
      .order('created_at', { ascending: false });

    if (alertsError) {
      console.error('Error fetching alerts for hive:', hiveId, alertsError);
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
    console.error('Error in getHiveById:', error);
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
    console.log('Adding hive with ID:', hiveData.hive_id);
    
    // Clean the hive ID
    const cleanHiveId = hiveData.hive_id.trim();

    // Use the RPC function to check if hive exists
    const { data: metricsData, error: metricsError } = await supabase
      .rpc('check_hive_exists', { hive_id_param: cleanHiveId });
    
    if (metricsError) {
      console.log('RPC error, falling back to direct query:', metricsError);
      
      // Fall back to direct query
      const { data: directData, error: directError } = await supabase
        .from('metrics_time_series_data')
        .select('hive_id')
        .eq('hive_id', cleanHiveId)
        .limit(1);
      
      console.log('Direct query result:', directData, 'Error:', directError);
      
      if (directError) throw directError;
      
      if (!directData || directData.length === 0) {
        console.log('No metrics data found for hive ID:', cleanHiveId);
        throw new Error('This hive ID does not exist in our system');
      }
    } else {
      console.log('RPC result:', metricsData);
      
      if (!metricsData || !metricsData.exists) {
        console.log('RPC reports no metrics data found for hive ID:', cleanHiveId);
        throw new Error('This hive ID does not exist in our system');
      }
    }
    
    // Check if hive ID is already registered to another user
    const { data: existingHive, error: existingHiveError } = await supabase
      .from('hives')
      .select('hive_id')
      .eq('hive_id', cleanHiveId)
      .limit(1);
    
    console.log('Existing hive query result:', existingHive, 'Error:', existingHiveError);
    
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
    console.error('Error adding hive:', error);
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
      console.error('Error fetching apiary name:', apiaryError);
    }
    
    // Get latest metrics
    const { data: metricsData, error: metricsError } = await supabase
      .from('metrics_time_series_data')
      .select('*')
      .eq('hive_id', hiveId)
      .order('timestamp', { ascending: false })
      .limit(24);
    
    if (metricsError) {
      console.error('Error fetching metrics:', metricsError);
    }
    
    // Get active alerts
    const { data: alertsData, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .eq('hive_id', hiveId)
      .is('resolved_at', null)
      .order('created_at', { ascending: false });
    
    if (alertsError) {
      console.error('Error fetching alerts:', alertsError);
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
    console.error('Error updating hive:', error);
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
    console.error('Error deleting hive:', error);
    throw error;
  }
};

/**
 * Checks if a hive ID exists in the metrics_time_series_data table and is not already registered to a user
 */
export const checkHiveAvailability = async (hiveId: string): Promise<{ exists: boolean; available: boolean; error?: string }> => {
  try {
    console.log('Checking availability for hive ID:', hiveId);
    
    // Use a raw SQL query to directly check if the hive ID exists
    const { data: metricsData, error: metricsError } = await supabase
      .rpc('check_hive_exists', { hive_id_param: hiveId.trim() });
    
    if (metricsError) {
      console.log('RPC error, falling back to direct query:', metricsError);
      
      // Fall back to a direct query using eq instead of ilike
      const { data: metrics, error: directError } = await supabase
        .from('metrics_time_series_data')
        .select('hive_id')
        .eq('hive_id', hiveId.trim())
        .limit(1);
      
      console.log('Direct query result (eq):', metrics, 'Error:', directError);
      
      if (directError) throw directError;
      
      // If the hive doesn't exist in the metrics table, return false
      if (!metrics || metrics.length === 0) {
        console.log('No metrics data found for hive ID:', hiveId);
        return { exists: false, available: false, error: 'This hive ID does not exist in our system' };
      }
    } else {
      console.log('RPC result:', metricsData);
      
      if (!metricsData || !metricsData.exists) {
        console.log('RPC reports no metrics data found for hive ID:', hiveId);
        return { exists: false, available: false, error: 'This hive ID does not exist in our system' };
      }
    }
    
    // If we get here, the hive exists in metrics_time_series_data
    console.log('Hive ID found in metrics_time_series_data');
    
    // Then check if the hive is already registered in the hives table
    const { data: existingHive, error: hiveError } = await supabase
      .from('hives')
      .select('hive_id, is_registered, user_id')
      .eq('hive_id', hiveId.trim())
      .maybeSingle();
    
    console.log('Existing hive query result:', existingHive, 'Error:', hiveError);
    
    if (hiveError) throw hiveError;
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw authError;
    if (!user) {
      return { exists: true, available: false, error: 'You must be logged in to register a hive' };
    }
    
    // If hive already exists in the hives table
    if (existingHive) {
      // Check if the hive is already registered
      if (existingHive.is_registered && existingHive.user_id && existingHive.user_id !== user.id) {
        return { exists: true, available: false, error: 'This hive is already registered to another user' };
      }
      
      // Check if the hive belongs to the current user
      if (existingHive.user_id === user.id) {
        return { exists: true, available: false, error: 'You have already registered this hive' };
      }
    }
    
    // The hive exists in metrics_time_series_data and is available to register
    console.log('Hive is available for registration');
    return { exists: true, available: true };
  } catch (error) {
    console.error('Error checking hive availability:', error);
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
    console.error(`Error fetching hive details for hive ${hiveId}:`, error);
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