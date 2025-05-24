import { supabase } from '@/lib/supabase';
import logger from '@/utils/logger';


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
 * Fetch all apiaries for the authenticated user with pagination
 * @param page Page number (1-based)
 * @param pageSize Number of items per page
 * @returns Paginated response with apiaries
 */
export const getAllApiaries = async (
  page: number = 1,
  pageSize: number = 10
): Promise<PaginatedResponse<ApiaryWithStats>> => {
  try {
    // Ensure valid pagination parameters
    const validPage = Math.max(1, page);
    const validPageSize = Math.min(50, Math.max(1, pageSize)); // Limit page size between 1 and 50
    
    // Calculate offset
    const offset = (validPage - 1) * validPageSize;
    
    // Get total count first
    const { count, error: countError } = await supabase
      .from('apiaries')
      .select('*', { count: 'exact', head: true });
      
    if (countError) {
      throw countError;
    }
    
    // Get apiaries with pagination
    const { data: apiaries, error } = await supabase
      .from('apiaries')
      .select('*')
      .order('name', { ascending: true })
      .range(offset, offset + validPageSize - 1);

    if (error) {
      throw error;
    }

    if (!apiaries?.length) {
      return {
        data: [],
        count: count || 0,
        page: validPage,
        pageSize: validPageSize,
        totalPages: Math.ceil((count || 0) / validPageSize)
      };
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
          logger.error('Error fetching hive count:', hiveCountError);
        }

        // Get the hive IDs first
        const { data: hives, error: hivesError } = await supabase
          .from('hives')
          .select('hive_id')
          .eq('apiary_id', apiary.id);
        
        if (hivesError) {
          logger.error('Error fetching hives:', hivesError);
        }
        
        // Then get the metrics for those hive IDs
        const hiveIds = hives?.map(hive => hive.hive_id) || [];
        
        let metrics: any[] = [];
        if (hiveIds.length > 0) {
          // Fix: Get metrics one hive at a time to avoid issues with 'in' query parameter
          const allMetrics = await Promise.all(
            hiveIds.map(async (hiveId) => {
              const { data, error } = await supabase
                .from('metrics_time_series_data')
                .select('*')
                .eq('hive_id', hiveId)
                .order('timestamp', { ascending: false })
                .limit(25);  // Reduced from 100 to 25 per hive to avoid large payload
              
              if (error) {
                logger.error(`Error fetching metrics for hive ${hiveId}:`, error);
                return [];
              }
              
              return data || [];
            })
          );
          
          // Combine all metrics
          metrics = allMetrics.flat();
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

    return {
      data: enrichedApiaries,
      count: count || 0,
      page: validPage,
      pageSize: validPageSize,
      totalPages: Math.ceil((count || 0) / validPageSize)
    };
  } catch (error) {
    logger.error('Error in getAllApiaries:', error);
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
      logger.error('Error fetching hive count:', hiveCountError);
    }

    // Get the hive IDs first
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select('hive_id')
      .eq('apiary_id', id);
    
    if (hivesError) {
      logger.error('Error fetching hives:', hivesError);
    }
    
    // Then get the metrics for those hive IDs
    const hiveIds = hives?.map(hive => hive.hive_id) || [];
    
    let metrics: any[] = [];
    if (hiveIds.length > 0) {
      // Fix: Get metrics one hive at a time to avoid issues with 'in' query parameter
      const allMetrics = await Promise.all(
        hiveIds.map(async (hiveId) => {
          const { data, error } = await supabase
            .from('metrics_time_series_data')
            .select('*')
            .eq('hive_id', hiveId)
            .order('timestamp', { ascending: false })
            .limit(25);  // Reduced from 100 to 25 per hive to avoid large payload
          
          if (error) {
            logger.error(`Error fetching metrics for hive ${hiveId}:`, error);
            return [];
          }
          
          return data || [];
        })
      );
      
      // Combine all metrics
      metrics = allMetrics.flat();
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
    logger.error('Error in getApiaryById:', error);
    throw error;
  }
};

/**
 * Create a new apiary
 */
export const addApiary = async (apiaryData: Omit<Apiary, 'id' | 'created_at' | 'updated_at' | 'user_id'>): Promise<Apiary> => {
  try {
    // Get the current user's ID
    const { data: userData } = await supabase.auth.getUser();
    if (!userData?.user) {
      throw new Error('User is not authenticated');
    }

    // Add user_id to the data
    const dataWithUserId = {
      ...apiaryData,
      user_id: userData.user.id
    };

    const { data, error } = await supabase
      .from('apiaries')
      .insert(dataWithUserId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    logger.error('Error in addApiary:', error);
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
    logger.error('Error in updateApiary:', error);
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
    logger.error('Error in deleteApiary:', error);
    throw error;
  }
};

/**
 * Optimized function to fetch apiaries with basic stats for dashboard
 * This function reduces database calls by using aggregation and limiting data
 */
export const getDashboardApiaries = async (): Promise<ApiaryWithStats[]> => {
  try {
    // Get all apiaries first
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

    // Get all hives in a single query
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select('hive_id, apiary_id');
    
    if (hivesError) {
      logger.error('Error fetching hives:', hivesError);
      return apiaries.map(apiary => ({
        ...apiary,
        hiveCount: 0,
        avgTemperature: 0,
        avgHumidity: 0,
        avgSound: 0,
        avgWeight: 0
      }));
    }

    // Group hives by apiary_id
    const hivesByApiary = hives?.reduce((acc, hive) => {
      if (!acc[hive.apiary_id]) {
        acc[hive.apiary_id] = [];
      }
      acc[hive.apiary_id].push(hive.hive_id);
      return acc;
    }, {} as Record<string, string[]>) || {};

    // Get the latest metrics for all hives in a single query
    // Using a SQL query with DISTINCT ON to get only the latest record per hive
    const { data: latestMetrics, error: metricsError } = await supabase
      .rpc('get_latest_metrics_for_dashboard');

    if (metricsError) {
      logger.error('Error fetching metrics:', metricsError);
      return apiaries.map(apiary => ({
        ...apiary,
        hiveCount: hivesByApiary[apiary.id]?.length || 0,
        avgTemperature: 0,
        avgHumidity: 0,
        avgSound: 0,
        avgWeight: 0
      }));
    }

    // Group metrics by hive_id
    const metricsByHive = latestMetrics?.reduce((acc, metric) => {
      acc[metric.hive_id] = metric;
      return acc;
    }, {} as Record<string, any>) || {};

    // Calculate stats for each apiary
    const enrichedApiaries = apiaries.map(apiary => {
      const apiaryHives = hivesByApiary[apiary.id] || [];
      const hiveCount = apiaryHives.length;
      
      // Calculate averages from the latest metrics
      let tempSum = 0, humSum = 0, soundSum = 0, weightSum = 0;
      let tempCount = 0, humCount = 0, soundCount = 0, weightCount = 0;
      
      apiaryHives.forEach(hiveId => {
        const metric = metricsByHive[hiveId];
        if (metric) {
          if (metric.temp_value !== null) {
            tempSum += metric.temp_value;
            tempCount++;
          }
          if (metric.hum_value !== null) {
            humSum += metric.hum_value;
            humCount++;
          }
          if (metric.sound_value !== null) {
            soundSum += metric.sound_value;
            soundCount++;
          }
          if (metric.weight_value !== null) {
            weightSum += metric.weight_value;
            weightCount++;
          }
        }
      });
      
      return {
        ...apiary,
        hiveCount,
        avgTemperature: tempCount > 0 ? Math.round((tempSum / tempCount) * 10) / 10 : 0,
        avgHumidity: humCount > 0 ? Math.round(humSum / humCount) : 0,
        avgSound: soundCount > 0 ? Math.round(soundSum / soundCount) : 0,
        avgWeight: weightCount > 0 ? Math.round((weightSum / weightCount) * 10) / 10 : 0
      };
    });

    return enrichedApiaries;
  } catch (error) {
    logger.error('Error in getDashboardApiaries:', error);
    throw error;
  }
}; 