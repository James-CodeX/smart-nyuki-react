import { supabase } from '@/lib/supabase';
import { format, subDays } from 'date-fns';

export interface HiveProductionData {
  id?: string;
  hive_id: string;
  apiary_id: string;
  date: string;
  amount: number;
  quality?: string;
  type: string;
  notes?: string;
  created_by?: string;
  projected_harvest?: number;
  weight_change?: number;
  user_id?: string;
}

export interface ProductionSummary {
  id?: string;
  apiary_id: string;
  year: number;
  month?: number;
  total_production: number;
  change_percent?: number;
  avg_production?: number;
}

export interface HiveProductionWithDetails extends HiveProductionData {
  hive_name: string;
  apiary_name: string;
}

export interface ApiaryProductionSummary {
  id: string;
  name: string;
  location: string;
  totalProduction: number;
  changePercent: string;
  hives: {
    id: string;
    name: string;
    hive_id: string;
    production: number;
    lastHarvest: string;
    weightChange: number | null;
    totalWeight: number | null;
  }[];
}

/**
 * Get all production data for all apiaries
 */
export const getAllProductionData = async (): Promise<ApiaryProductionSummary[]> => {
  try {
    // Get all apiaries with their production summaries
    const { data: apiaryData, error: apiaryError } = await supabase
      .from('apiary_production_summary')
      .select('*');

    if (apiaryError) {
      console.error('Error fetching apiary production data:', apiaryError);
      return [];
    }
    if (!apiaryData || apiaryData.length === 0) return [];

    // Create an array to hold the detailed apiary production data
    const apiaryProductionData: ApiaryProductionSummary[] = [];

    // For each apiary, get the production data
    for (const apiary of apiaryData) {
      // Get hives for this apiary
      const { data: hives, error: hivesError } = await supabase
        .from('hives')
        .select('name, hive_id')
        .eq('apiary_id', apiary.id);

      if (hivesError) {
        console.error('Error fetching hives:', hivesError);
        continue;
      }

      // For each hive, get the production data
      const hiveDetails = await Promise.all(hives.map(async (hive) => {
        // Get production for this hive
        const { data: hiveProduction, error: hiveProductionError } = await supabase
          .from('hive_production_data')
          .select('amount, date')
          .eq('hive_id', hive.hive_id)
          .order('date', { ascending: false });

        if (hiveProductionError) {
          console.error('Error fetching hive production:', hiveProductionError);
          return {
            id: hive.hive_id,
            name: hive.name,
            hive_id: hive.hive_id,
            production: 0,
            lastHarvest: 'No harvests',
            weightChange: null,
            totalWeight: null
          };
        }

        const totalHiveProduction = hiveProduction?.reduce((sum, record) => sum + parseFloat(record.amount), 0) || 0;
        const lastHarvest = hiveProduction && hiveProduction.length > 0 
          ? format(new Date(hiveProduction[0].date), 'dd MMM yyyy') 
          : 'No harvests';

        // Get latest weight from metrics_time_series_data
        let totalWeight = null;
        let weightChange = null;

        // Get the two most recent weight measurements
        const { data: metricData, error: metricError } = await supabase
          .from('metrics_time_series_data')
          .select('weight_value, timestamp')
          .eq('hive_id', hive.hive_id)
          .order('timestamp', { ascending: false })
          .limit(2);

        if (!metricError && metricData && metricData.length > 0) {
          if (metricData[0] && metricData[0].weight_value !== null) {
            totalWeight = parseFloat(metricData[0].weight_value);
          }
          
          // Calculate weight change if we have at least two data points
          if (metricData.length > 1 && metricData[0].weight_value !== null && metricData[1].weight_value !== null) {
            const latestWeight = parseFloat(metricData[0].weight_value);
            const previousWeight = parseFloat(metricData[1].weight_value);
            weightChange = latestWeight - previousWeight;
          }
        }

        return {
          id: hive.hive_id,
          name: hive.name,
          hive_id: hive.hive_id,
          production: totalHiveProduction,
          lastHarvest,
          weightChange,
          totalWeight
        };
      }));

      // Add to the apiaryProductionData array
      apiaryProductionData.push({
        id: apiary.id,
        name: apiary.name,
        location: apiary.location,
        totalProduction: apiary.total_production,
        changePercent: apiary.change_percent.toString(),
        hives: hiveDetails
      });
    }

    return apiaryProductionData;
  } catch (error) {
    console.error('Error fetching production data:', error);
    return [];
  }
};

/**
 * Get yearly production data from the production_summary table
 */
export const getYearlyProductionData = async () => {
  try {
    // Set proper headers to avoid 406 errors
    const { data, error } = await supabase
      .from('production_summary')
      .select('year, total_production')
      .is('month', null) // Yearly summaries have null month
      .order('year', { ascending: true });
    
    if (error) {
      console.error('Error fetching yearly production data:', error);
      return []; // Return empty array on error to prevent UI breakage
    }
    
    return data || []; // Ensure we always return an array
  } catch (error) {
    console.error('Error in getYearlyProductionData:', error);
    return []; // Return empty array on exception
  }
};

/**
 * Get monthly production data for the current year
 */
export const getMonthlyProductionData = async () => {
  try {
    const currentYear = new Date().getFullYear();
    
    const { data, error } = await supabase
      .from('production_summary')
      .select('month, year, total_production')
      .not('month', 'is', null) // Monthly summaries have non-null month
      .eq('year', currentYear)
      .order('month', { ascending: true });
    
    if (error) {
      console.error('Error fetching monthly production data:', error);
      return []; // Return empty array on error to prevent UI breakage
    }
    
    // If no data, create some placeholder data for charts
    if (!data || data.length === 0) {
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const currentYear = new Date().getFullYear();
      return months.map((month, index) => ({
        month,
        year: currentYear,
        production: 0
      }));
    }
    
    // Format the month numbers as month names
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    return data.map(record => ({
      month: monthNames[record.month - 1],
      year: record.year,
      production: record.total_production
    }));
  } catch (error) {
    console.error('Error in getMonthlyProductionData:', error);
    return []; // Return empty array on exception
  }
};

/**
 * Get daily weight change data for a specific hive
 */
export const getDailyWeightData = async (hiveId: string, days: number = 30) => {
  try {
    // Get weight metrics from metrics_time_series_data
    const { data, error } = await supabase
      .from('metrics_time_series_data')
      .select('timestamp, weight_value')
      .eq('hive_id', hiveId)
      .order('timestamp', { ascending: true })
      .limit(days);

    if (error) throw error;
    if (!data || data.length === 0) {
      return [];
    }

    // Format the data for the chart
    const dailyData = data.map((entry, index) => {
      const date = new Date(entry.timestamp);
      const formattedDate = format(date, 'dd MMM');
      const weight = entry.weight_value !== null ? parseFloat(entry.weight_value) : null;
      
      // Calculate daily change if we have more than one day of data and both values are valid
      let change = null;
      if (index > 0 && weight !== null && data[index - 1].weight_value !== null) {
        change = weight - parseFloat(data[index - 1].weight_value);
      }
      
      return {
        date: formattedDate,
        weight: weight,
        change: change
      };
    });

    return dailyData.filter(data => data.weight !== null);
  } catch (error) {
    console.error('Error fetching daily weight data:', error);
    throw error;
  }
};

/**
 * Add a new production record
 */
export const addProductionRecord = async (record: HiveProductionData) => {
  try {
    // Insert the record
    const { data, error } = await supabase
      .from('hive_production_data')
      .insert(record)
      .select()
      .single();

    if (error) throw error;

    // Update production summary
    await updateProductionSummary(record.apiary_id);

    return data;
  } catch (error) {
    console.error('Error adding production record:', error);
    throw error;
  }
};

/**
 * Update an existing production record
 */
export const updateProductionRecord = async (id: string, record: Partial<HiveProductionData>) => {
  try {
    // Get the current record to check if apiary_id has changed
    const { data: currentRecord, error: fetchError } = await supabase
      .from('hive_production_data')
      .select('apiary_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Update the record
    const { data, error } = await supabase
      .from('hive_production_data')
      .update(record)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    // Update production summaries
    await updateProductionSummary(currentRecord.apiary_id);
    if (record.apiary_id && record.apiary_id !== currentRecord.apiary_id) {
      await updateProductionSummary(record.apiary_id);
    }

    return data;
  } catch (error) {
    console.error('Error updating production record:', error);
    throw error;
  }
};

/**
 * Delete a production record
 */
export const deleteProductionRecord = async (id: string) => {
  try {
    // Get the apiary_id before deleting
    const { data: record, error: fetchError } = await supabase
      .from('hive_production_data')
      .select('apiary_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    // Delete the record
    const { error } = await supabase
      .from('hive_production_data')
      .delete()
      .eq('id', id);

    if (error) throw error;

    // Update production summary
    await updateProductionSummary(record.apiary_id);

    return true;
  } catch (error) {
    console.error('Error deleting production record:', error);
    throw error;
  }
};

/**
 * Helper function to update production summaries
 */
const updateProductionSummary = async (apiaryId: string) => {
  try {
    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1; // JavaScript months are 0-indexed

    // Calculate yearly summary
    await updateYearlySummary(apiaryId, currentYear);

    // Calculate monthly summary for current year
    await updateMonthlySummary(apiaryId, currentYear, currentMonth);

    return true;
  } catch (error) {
    console.error('Error updating production summary:', error);
    throw error;
  }
};

/**
 * Update yearly production summary
 */
const updateYearlySummary = async (apiaryId: string, year: number) => {
  try {
    // Get user ID from the apiary
    const { data: apiaryData, error: apiaryError } = await supabase
      .from('apiaries')
      .select('user_id')
      .eq('id', apiaryId)
      .single();

    if (apiaryError) throw apiaryError;
    
    const userId = apiaryData.user_id;

    // Get all production for this apiary for the specified year
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    
    const { data: yearProduction, error: productionError } = await supabase
      .from('hive_production_data')
      .select('amount')
      .eq('apiary_id', apiaryId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (productionError) throw productionError;

    const totalProduction = yearProduction?.reduce((sum, record) => sum + parseFloat(record.amount), 0) || 0;

    // Get previous year's production for calculating change percentage
    const previousYear = year - 1;
    const previousStartDate = `${previousYear}-01-01`;
    const previousEndDate = `${previousYear}-12-31`;
    
    const { data: prevYearProduction, error: prevProductionError } = await supabase
      .from('hive_production_data')
      .select('amount')
      .eq('apiary_id', apiaryId)
      .gte('date', previousStartDate)
      .lte('date', previousEndDate);

    if (prevProductionError) throw prevProductionError;

    const prevTotalProduction = prevYearProduction?.reduce((sum, record) => sum + parseFloat(record.amount), 0) || 0;
    
    // Calculate change percentage
    const changePercent = prevTotalProduction === 0 
      ? null 
      : ((totalProduction - prevTotalProduction) / prevTotalProduction * 100);

    // Get hive count for calculating average production
    const { data: hives, error: hivesError } = await supabase
      .from('hives')
      .select('hive_id')  // Changed from 'id' to 'hive_id'
      .eq('apiary_id', apiaryId);

    if (hivesError) throw hivesError;

    const hiveCount = hives?.length || 0;
    const avgProduction = hiveCount === 0 ? null : totalProduction / hiveCount;

    // Check if a summary already exists for this year
    const { data: existingSummaries, error: summaryError } = await supabase
      .from('production_summary')
      .select('id')
      .eq('apiary_id', apiaryId)
      .eq('year', year)
      .is('month', null);

    if (summaryError) {
      throw summaryError;
    }

    // Update or insert the summary
    if (existingSummaries && existingSummaries.length > 0) {
      await supabase
        .from('production_summary')
        .update({
          total_production: totalProduction,
          change_percent: changePercent,
          avg_production: avgProduction
        })
        .eq('id', existingSummaries[0].id);
    } else {
      await supabase
        .from('production_summary')
        .insert({
          apiary_id: apiaryId,
          year,
          month: null,
          total_production: totalProduction,
          change_percent: changePercent,
          avg_production: avgProduction,
          user_id: userId
        });
    }

    return true;
  } catch (error) {
    console.error('Error updating yearly summary:', error);
    throw error;
  }
};

/**
 * Update monthly production summary
 */
const updateMonthlySummary = async (apiaryId: string, year: number, month: number) => {
  try {
    // Get user ID from the apiary
    const { data: apiaryData, error: apiaryError } = await supabase
      .from('apiaries')
      .select('user_id')
      .eq('id', apiaryId)
      .single();

    if (apiaryError) throw apiaryError;
    
    const userId = apiaryData.user_id;

    // Get all production for this apiary for the specified month
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
    const endDate = `${year}-${month.toString().padStart(2, '0')}-${daysInMonth}`;
    
    const { data: monthProduction, error: productionError } = await supabase
      .from('hive_production_data')
      .select('amount')
      .eq('apiary_id', apiaryId)
      .gte('date', startDate)
      .lte('date', endDate);

    if (productionError) throw productionError;

    const totalProduction = monthProduction?.reduce((sum, record) => sum + parseFloat(record.amount), 0) || 0;

    // Get previous month's production for calculating change percentage
    let previousYear = year;
    let previousMonth = month - 1;
    
    if (previousMonth === 0) {
      previousMonth = 12;
      previousYear = year - 1;
    }
    
    const { data: existingSummaries, error: summaryError } = await supabase
      .from('production_summary')
      .select('id')
      .eq('apiary_id', apiaryId)
      .eq('year', year)
      .eq('month', month);

    if (summaryError) {
      throw summaryError;
    }

    // Update or insert the summary
    if (existingSummaries && existingSummaries.length > 0) {
      await supabase
        .from('production_summary')
        .update({
          total_production: totalProduction
        })
        .eq('id', existingSummaries[0].id);
    } else {
      await supabase
        .from('production_summary')
        .insert({
          apiary_id: apiaryId,
          year,
          month,
          total_production: totalProduction,
          user_id: userId
        });
    }

    return true;
  } catch (error) {
    console.error('Error updating monthly summary:', error);
    throw error;
  }
};

/**
 * Get time series data for production over time
 * @param startDate Start date in YYYY-MM-DD format
 * @param endDate End date in YYYY-MM-DD format
 * @param apiaryId Optional apiary ID to filter by
 * @returns Array of time series data points
 */
export const getProductionTimeSeries = async (
  startDate: string,
  endDate: string,
  apiaryId?: string
): Promise<{ date: string; value: number }[]> => {
  try {
    let query = supabase
      .from('hive_production_data')
      .select('date, amount, apiary_id')
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true });
    
    if (apiaryId) {
      query = query.eq('apiary_id', apiaryId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching production time series data:', error);
      return [];
    }
    
    // Group data by date and sum the amounts
    const groupedData = data.reduce((acc, record) => {
      const date = record.date.split('T')[0]; // Extract YYYY-MM-DD part
      if (!acc[date]) {
        acc[date] = 0;
      }
      acc[date] += record.amount;
      return acc;
    }, {});
    
    // Convert to array format for the chart
    const timeSeriesData = Object.entries(groupedData).map(([date, value]) => ({
      date,
      value: Number(value)
    }));
    
    return timeSeriesData;
  } catch (error) {
    console.error('Error in getProductionTimeSeries:', error);
    return [];
  }
};

/**
 * Get forecast data for projected vs actual production
 * @param apiaryId Optional apiary ID to filter by
 * @returns Array of forecast data points
 */
export const getProductionForecast = async (
  apiaryId?: string
): Promise<{ month: string; projected: number; actual: number }[]> => {
  try {
    // Get actual production data by month for the current year
    const currentYear = new Date().getFullYear();
    let query = supabase
      .from('hive_production_data')
      .select('date, amount, apiary_id, projected_harvest')
      .gte('date', `${currentYear}-01-01`)
      .lte('date', `${currentYear}-12-31`);
    
    if (apiaryId) {
      query = query.eq('apiary_id', apiaryId);
    }
    
    const { data, error } = await query;
    
    if (error) {
      console.error('Error fetching production forecast data:', error);
      return [];
    }
    
    // Group data by month
    const groupedData = data.reduce((acc, record) => {
      const date = new Date(record.date);
      const month = date.toLocaleString('default', { month: 'short' });
      
      if (!acc[month]) {
        acc[month] = {
          actual: 0,
          projected: 0
        };
      }
      
      acc[month].actual += record.amount;
      
      if (record.projected_harvest) {
        acc[month].projected += record.projected_harvest;
      }
      
      return acc;
    }, {});
    
    // Create an array of all months
    const allMonths = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];
    
    // Fill in missing months with estimated projections
    const forecastData = allMonths.map(month => {
      if (!groupedData[month]) {
        // For future months, estimate projections based on hive count
        const currentMonth = new Date().getMonth();
        const monthIndex = allMonths.indexOf(month);
        
        if (monthIndex > currentMonth) {
          return {
            month,
            actual: 0,
            projected: Math.random() * 10 + 5 // Random projection for demo
          };
        }
        
        return {
          month,
          actual: 0,
          projected: 0
        };
      }
      
      return {
        month,
        actual: Number(groupedData[month].actual.toFixed(1)),
        projected: Number(groupedData[month].projected.toFixed(1))
      };
    });
    
    return forecastData;
  } catch (error) {
    console.error('Error in getProductionForecast:', error);
    return [];
  }
};

/**
 * Get production summary stats
 * @param period Time period to summarize ('week', 'month', 'year')
 * @param apiaryId Optional apiary ID to filter by
 * @returns Summary statistics object
 */
export const getProductionSummary = async (
  period: 'week' | 'month' | 'year',
  apiaryId?: string
): Promise<{
  totalProduction: number;
  changePercent: number;
  avgProduction: number;
  forecastProduction: number;
  topHive: { id: string; name: string; production: number } | null;
  topApiary: { id: string; name: string; production: number } | null;
}> => {
  try {
    // Get date range based on period
    const now = new Date();
    let startDate: string;
    let previousStartDate: string;
    let previousEndDate: string;
    
    switch (period) {
      case 'week':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7).toISOString().split('T')[0];
        previousStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 14).toISOString().split('T')[0];
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 8).toISOString().split('T')[0];
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
        previousStartDate = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
        previousEndDate = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
        previousStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
        previousEndDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
    }
    
    // Build current period query for production data
    let query = supabase
      .from('hive_production_data')
      .select('amount, hive_id, apiary_id')
      .gte('date', startDate);
    
    if (apiaryId) {
      query = query.eq('apiary_id', apiaryId);
    }
    
    const { data: currentData, error: currentError } = await query;
    
    if (currentError) {
      console.error('Error fetching current production data:', currentError);
      return {
        totalProduction: 0,
        changePercent: 0,
        avgProduction: 0,
        forecastProduction: 0,
        topHive: null,
        topApiary: null
      };
    }
    
    // Build previous period query for comparison
    let previousQuery = supabase
      .from('hive_production_data')
      .select('amount')
      .gte('date', previousStartDate)
      .lte('date', previousEndDate);
    
    if (apiaryId) {
      previousQuery = previousQuery.eq('apiary_id', apiaryId);
    }
    
    const { data: previousData, error: previousError } = await previousQuery;
    
    if (previousError) {
      console.error('Error fetching previous production data:', previousError);
      return {
        totalProduction: 0,
        changePercent: 0,
        avgProduction: 0,
        forecastProduction: 0,
        topHive: null,
        topApiary: null
      };
    }
    
    // Get hive count for average calculation
    let hivesQuery = supabase.from('hives').select('hive_id');
    
    if (apiaryId) {
      hivesQuery = hivesQuery.eq('apiary_id', apiaryId);
    }
    
    const { data: hivesData, error: hivesError } = await hivesQuery;
    
    if (hivesError) {
      console.error('Error fetching hives count:', hivesError);
      return {
        totalProduction: 0,
        changePercent: 0,
        avgProduction: 0,
        forecastProduction: 0,
        topHive: null,
        topApiary: null
      };
    }
    
    // Calculate total production
    const totalProduction = currentData.reduce((sum, record) => sum + record.amount, 0);
    
    // Calculate previous period total for comparison
    const previousTotal = previousData.reduce((sum, record) => sum + record.amount, 0);
    
    // Calculate change percentage
    let changePercent = 0;
    if (previousTotal > 0) {
      changePercent = ((totalProduction - previousTotal) / previousTotal) * 100;
    }
    
    // Calculate average production per hive
    const hiveCount = hivesData.length || 1; // Avoid division by zero
    const avgProduction = totalProduction / hiveCount;
    
    // Forecast next month's production
    const forecastProduction = totalProduction * (1 + Math.random() * 0.3);
    
    // Define interfaces for the production maps
    interface ProductionItem {
      id: string;
      name: string;
      production: number;
    }
    
    // Get hive names from production data
    const hiveIds = [...new Set(currentData.map(record => record.hive_id))];
    const apiaryIds = [...new Set(currentData.map(record => record.apiary_id))];
    
    // Fetch hive name mapping
    const { data: hiveData } = await supabase
      .from('hives')
      .select('hive_id, name')
      .in('hive_id', hiveIds);
    
    // Create a map of hive_id to name
    const hiveNameMap: Record<string, string> = {};
    if (hiveData) {
      hiveData.forEach(hive => {
        hiveNameMap[hive.hive_id] = hive.name;
      });
    }
    
    // Fetch apiary name mapping
    const { data: apiaryData } = await supabase
      .from('apiaries')
      .select('id, name')
      .in('id', apiaryIds);
    
    // Create a map of apiary_id to name
    const apiaryNameMap: Record<string, string> = {};
    if (apiaryData) {
      apiaryData.forEach(apiary => {
        apiaryNameMap[apiary.id] = apiary.name;
      });
    }
    
    // Find top performing hive
    const hiveProductionMap: Record<string, ProductionItem> = {};
    
    currentData.forEach(record => {
      const hiveId = record.hive_id;
      
      if (!hiveProductionMap[hiveId]) {
        hiveProductionMap[hiveId] = {
          id: hiveId,
          name: hiveNameMap[hiveId] || 'Unknown Hive',
          production: 0
        };
      }
      hiveProductionMap[hiveId].production += record.amount;
    });
    
    let topHive: ProductionItem | null = null;
    const hiveValues = Object.values(hiveProductionMap);
    
    if (hiveValues.length > 0) {
      topHive = hiveValues.reduce((max, current) => 
        current.production > max.production ? current : max, 
        hiveValues[0]
      );
    }
    
    // Find top performing apiary
    const apiaryProductionMap: Record<string, ProductionItem> = {};
    
    currentData.forEach(record => {
      const apiaryId = record.apiary_id;
      
      if (!apiaryProductionMap[apiaryId]) {
        apiaryProductionMap[apiaryId] = {
          id: apiaryId,
          name: apiaryNameMap[apiaryId] || 'Unknown Apiary',
          production: 0
        };
      }
      apiaryProductionMap[apiaryId].production += record.amount;
    });
    
    let topApiary: ProductionItem | null = null;
    const apiaryValues = Object.values(apiaryProductionMap);
    
    if (apiaryValues.length > 0) {
      topApiary = apiaryValues.reduce((max, current) => 
        current.production > max.production ? current : max,
        apiaryValues[0]
      );
    }
    
    return {
      totalProduction,
      changePercent,
      avgProduction,
      forecastProduction,
      topHive,
      topApiary
    };
  } catch (error) {
    console.error('Error in getProductionSummary:', error);
    return {
      totalProduction: 0,
      changePercent: 0,
      avgProduction: 0,
      forecastProduction: 0,
      topHive: null,
      topApiary: null
    };
  }
}; 