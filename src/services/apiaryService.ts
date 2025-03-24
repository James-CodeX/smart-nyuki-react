import { supabase } from '@/lib/supabase';

export interface Apiary {
  id: string;
  name: string;
  location: string;
  latitude?: number;
  longitude?: number;
  elevation?: number;
  notes?: string;
  image_url?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ApiaryWithStats extends Apiary {
  hiveCount: number;
  avgTemperature: number;
  avgHumidity: number;
  avgSound: number;
  avgWeight: number;
}

/**
 * Fetch all apiaries for the authenticated user
 */
export const getAllApiaries = async (): Promise<ApiaryWithStats[]> => {
  try {
    // Get all apiaries
    const { data: apiaries, error } = await supabase
      .from('apiaries')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      throw error;
    }

    if (!apiaries?.length) {
      return [];
    }

    // Enrich apiary data with statistics
    const enrichedApiaries = await Promise.all(
      apiaries.map(async (apiary) => {
        // Get hive count
        const { count: hiveCount, error: hiveCountError } = await supabase
          .from('hives')
          .select('*', { count: 'exact', head: true })
          .eq('apiary_id', apiary.id);
        
        if (hiveCountError) {
          console.error('Error fetching hive count:', hiveCountError);
        }

        // Get the hive IDs first
        const { data: hives, error: hivesError } = await supabase
          .from('hives')
          .select('id')
          .eq('apiary_id', apiary.id);
        
        if (hivesError) {
          console.error('Error fetching hives:', hivesError);
        }
        
        // Then get the metrics for those hive IDs
        const hiveIds = hives?.map(hive => hive.id) || [];
        
        let metrics: any[] = [];
        if (hiveIds.length > 0) {
          const { data: metricsData, error: metricsError } = await supabase
            .from('metrics_time_series_data')
            .select('*')
            .in('hive_id', hiveIds)
            .order('timestamp', { ascending: false })
            .limit(100);
          
          if (metricsError) {
            console.error('Error fetching metrics:', metricsError);
          } else {
            metrics = metricsData || [];
          }
        }

        // Calculate averages if metrics are available
        let avgTemperature = 0;
        let avgHumidity = 0;
        let avgSound = 0;
        let avgWeight = 0;
        let count = 0;

        if (metrics && metrics.length > 0) {
          metrics.forEach(metric => {
            if (metric.temp_value) avgTemperature += metric.temp_value;
            if (metric.hum_value) avgHumidity += metric.hum_value;
            if (metric.sound_value) avgSound += metric.sound_value;
            if (metric.weight_value) avgWeight += metric.weight_value;
            count++;
          });

          if (count > 0) {
            avgTemperature /= count;
            avgHumidity /= count;
            avgSound /= count;
            avgWeight /= count;
          }
        }

        return {
          ...apiary,
          hiveCount: hiveCount || 0,
          avgTemperature: Math.round(avgTemperature * 10) / 10, // Round to 1 decimal place
          avgHumidity: Math.round(avgHumidity),
          avgSound: Math.round(avgSound),
          avgWeight: Math.round(avgWeight * 10) / 10, // Round to 1 decimal place
        };
      })
    );

    return enrichedApiaries;
  } catch (error) {
    console.error('Error in getAllApiaries:', error);
    throw error;
  }
};

/**
 * Fetch a single apiary by ID
 */
export const getApiaryById = async (id: string): Promise<ApiaryWithStats | null> => {
  try {
    const { data, error } = await supabase
      .from('apiaries')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      return null;
    }

    // Get hive count
    const { count: hiveCount, error: hiveCountError } = await supabase
      .from('hives')
      .select('*', { count: 'exact', head: true })
      .eq('apiary_id', id);
    
    if (hiveCountError) {
      console.error('Error fetching hive count:', hiveCountError);
    }

    // Get the hive IDs first
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select('id')
      .eq('apiary_id', id);
    
    if (hivesError) {
      console.error('Error fetching hives:', hivesError);
    }
    
    // Then get the metrics for those hive IDs
    const hiveIds = hives?.map(hive => hive.id) || [];
    
    let metrics: any[] = [];
    if (hiveIds.length > 0) {
      const { data: metricsData, error: metricsError } = await supabase
        .from('metrics_time_series_data')
        .select('*')
        .in('hive_id', hiveIds)
        .order('timestamp', { ascending: false })
        .limit(100);
      
      if (metricsError) {
        console.error('Error fetching metrics:', metricsError);
      } else {
        metrics = metricsData || [];
      }
    }

    // Calculate averages if metrics are available
    let avgTemperature = 0;
    let avgHumidity = 0;
    let avgSound = 0;
    let avgWeight = 0;
    let count = 0;

    if (metrics && metrics.length > 0) {
      metrics.forEach(metric => {
        if (metric.temp_value) avgTemperature += metric.temp_value;
        if (metric.hum_value) avgHumidity += metric.hum_value;
        if (metric.sound_value) avgSound += metric.sound_value;
        if (metric.weight_value) avgWeight += metric.weight_value;
        count++;
      });

      if (count > 0) {
        avgTemperature /= count;
        avgHumidity /= count;
        avgSound /= count;
        avgWeight /= count;
      }
    }

    return {
      ...data,
      hiveCount: hiveCount || 0,
      avgTemperature: Math.round(avgTemperature * 10) / 10,
      avgHumidity: Math.round(avgHumidity),
      avgSound: Math.round(avgSound),
      avgWeight: Math.round(avgWeight * 10) / 10,
    };
  } catch (error) {
    console.error('Error in getApiaryById:', error);
    throw error;
  }
};

/**
 * Create a new apiary
 */
export const addApiary = async (apiaryData: Omit<Apiary, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Apiary> => {
  try {
    const { data, error } = await supabase
      .from('apiaries')
      .insert(apiaryData)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in addApiary:', error);
    throw error;
  }
};

/**
 * Update an existing apiary
 */
export const updateApiary = async (id: string, apiaryData: Partial<Omit<Apiary, 'id' | 'created_at' | 'updated_at' | 'user_id'>>): Promise<Apiary> => {
  try {
    const { data, error } = await supabase
      .from('apiaries')
      .update(apiaryData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error in updateApiary:', error);
    throw error;
  }
};

/**
 * Delete an apiary
 */
export const deleteApiary = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('apiaries')
      .delete()
      .eq('id', id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error in deleteApiary:', error);
    throw error;
  }
}; 