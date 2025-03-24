import { supabase } from '@/lib/supabase';

export interface Hive {
  id: string;
  name: string;
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
  alerts?: Array<{ id: string; type: string; message: string; severity: string; created_at: string }>;
}

/**
 * Fetch all hives for the authenticated user
 */
export const getAllHives = async (): Promise<HiveWithDetails[]> => {
  try {
    // Get all hives with apiary name
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

    // Enrich hive data with metrics and alerts
    const enrichedHives = await Promise.all(
      hives.map(async (hive) => {
        // Get latest metrics
        const { data: timeSeriesData, error: metricsError } = await supabase
          .from('metrics_time_series_data')
          .select('*')
          .eq('hive_id', hive.id)
          .order('timestamp', { ascending: false })
          .limit(24);  // Last 24 data points

        if (metricsError) {
          console.error('Error fetching metrics for hive:', hive.id, metricsError);
        }

        // Get active alerts
        const { data: alerts, error: alertsError } = await supabase
          .from('alerts')
          .select('*')
          .eq('hive_id', hive.id)
          .is('resolved_at', null)
          .order('created_at', { ascending: false });

        if (alertsError) {
          console.error('Error fetching alerts for hive:', hive.id, alertsError);
        }

        // Transform time series data to the format expected by components
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
      })
    );

    return enrichedHives;
  } catch (error) {
    console.error('Error in getAllHives:', error);
    throw error;
  }
};

/**
 * Get hives for a specific apiary
 */
export const getHivesByApiary = async (apiaryId: string): Promise<HiveWithDetails[]> => {
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

    // Enrich hive data
    const enrichedHives = await Promise.all(
      hives.map(async (hive) => {
        // Get latest metrics
        const { data: timeSeriesData, error: metricsError } = await supabase
          .from('metrics_time_series_data')
          .select('*')
          .eq('hive_id', hive.id)
          .order('timestamp', { ascending: false })
          .limit(24);

        if (metricsError) {
          console.error('Error fetching metrics for hive:', hive.id, metricsError);
        }

        // Get active alerts
        const { data: alerts, error: alertsError } = await supabase
          .from('alerts')
          .select('*')
          .eq('hive_id', hive.id)
          .is('resolved_at', null)
          .order('created_at', { ascending: false });

        if (alertsError) {
          console.error('Error fetching alerts for hive:', hive.id, alertsError);
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
      })
    );

    return enrichedHives;
  } catch (error) {
    console.error('Error in getHivesByApiary:', error);
    throw error;
  }
};

/**
 * Get a single hive by ID
 */
export const getHiveById = async (hiveId: string): Promise<HiveWithDetails | null> => {
  try {
    const { data: hive, error } = await supabase
      .from('hives')
      .select(`
        *,
        apiaries (
          name
        )
      `)
      .eq('id', hiveId)
      .single();

    if (error) {
      throw error;
    }

    if (!hive) {
      return null;
    }

    // Get latest metrics
    const { data: timeSeriesData, error: metricsError } = await supabase
      .from('metrics_time_series_data')
      .select('*')
      .eq('hive_id', hiveId)
      .order('timestamp', { ascending: false })
      .limit(24);

    if (metricsError) {
      console.error('Error fetching metrics for hive:', hiveId, metricsError);
    }

    // Get active alerts
    const { data: alerts, error: alertsError } = await supabase
      .from('alerts')
      .select('*')
      .eq('hive_id', hiveId)
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
export const addHive = async (hiveData: Omit<Hive, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Hive> => {
  try {
    const { data, error } = await supabase
      .from('hives')
      .insert(hiveData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in addHive:', error);
    throw error;
  }
};

/**
 * Update an existing hive
 */
export const updateHive = async (id: string, hiveData: Partial<Omit<Hive, 'id' | 'created_at' | 'updated_at' | 'user_id'>>): Promise<Hive> => {
  try {
    const { data, error } = await supabase
      .from('hives')
      .update(hiveData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateHive:', error);
    throw error;
  }
};

/**
 * Delete a hive
 */
export const deleteHive = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('hives')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteHive:', error);
    throw error;
  }
}; 