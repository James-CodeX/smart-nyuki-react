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
    // Get all apiaries for the current user
    const { data: apiaries, error: apiaryError } = await supabase
      .from('apiaries')
      .select('id, name, location')
      .order('name');

    if (apiaryError) throw apiaryError;
    if (!apiaries || apiaries.length === 0) return [];

    // Create an array to hold the detailed apiary production data
    const apiaryProductionData: ApiaryProductionSummary[] = [];

    // For each apiary, get the production data
    for (const apiary of apiaries) {
      // Get total production for this apiary
      const { data: productionData, error: productionError } = await supabase
        .from('hive_production_data')
        .select('amount')
        .eq('apiary_id', apiary.id);

      if (productionError) throw productionError;

      // Calculate total production
      const totalProduction = productionData?.reduce((sum, record) => sum + parseFloat(record.amount), 0) || 0;

      // Get previous year's production for comparison
      const currentYear = new Date().getFullYear();
      const { data: lastYearData, error: lastYearError } = await supabase
        .from('production_summary')
        .select('total_production')
        .eq('apiary_id', apiary.id)
        .eq('year', currentYear - 1)
        .is('month', null)
        .single();

      if (lastYearError && lastYearError.code !== 'PGRST116') {
        // PGRST116 is "Results contain 0 rows" which is fine
        throw lastYearError;
      }

      const lastYearProduction = lastYearData?.total_production || 0;
      const changePercent = lastYearProduction === 0 
        ? '0.0' 
        : ((totalProduction - lastYearProduction) / lastYearProduction * 100).toFixed(1);

      // Get hives for this apiary
      const { data: hives, error: hivesError } = await supabase
        .from('hives')
        .select('id, name')
        .eq('apiary_id', apiary.id);

      if (hivesError) throw hivesError;

      // For each hive, get the production data
      const hiveDetails = await Promise.all(hives.map(async (hive) => {
        // Get production for this hive
        const { data: hiveProduction, error: hiveProductionError } = await supabase
          .from('hive_production_data')
          .select('amount, date')
          .eq('hive_id', hive.id)
          .order('date', { ascending: false });

        if (hiveProductionError) throw hiveProductionError;

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
          .eq('hive_id', hive.id)
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
          id: hive.id,
          name: hive.name,
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
        totalProduction,
        changePercent,
        hives: hiveDetails
      });
    }

    return apiaryProductionData;
  } catch (error) {
    console.error('Error fetching production data:', error);
    throw error;
  }
};

/**
 * Get yearly production data from the production_summary table
 */
export const getYearlyProductionData = async () => {
  try {
    const { data, error } = await supabase
      .from('production_summary')
      .select('year, total_production')
      .is('month', null)
      .order('year');

    if (error) throw error;

    return data || [];
  } catch (error) {
    console.error('Error fetching yearly production data:', error);
    throw error;
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
      .select('month, total_production')
      .eq('year', currentYear)
      .not('month', 'is', null)
      .order('month');

    if (error) throw error;

    // Format the month numbers as month names
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ];

    return (data || []).map(record => ({
      month: monthNames[record.month - 1],
      production: record.total_production,
      year: currentYear
    }));
  } catch (error) {
    console.error('Error fetching monthly production data:', error);
    throw error;
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
      .select('id')
      .eq('apiary_id', apiaryId);

    if (hivesError) throw hivesError;

    const hiveCount = hives?.length || 0;
    const avgProduction = hiveCount === 0 ? null : totalProduction / hiveCount;

    // Check if a summary already exists for this year
    const { data: existingSummary, error: summaryError } = await supabase
      .from('production_summary')
      .select('id')
      .eq('apiary_id', apiaryId)
      .eq('year', year)
      .is('month', null)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') {
      throw summaryError;
    }

    // Update or insert the summary
    if (existingSummary) {
      await supabase
        .from('production_summary')
        .update({
          total_production: totalProduction,
          change_percent: changePercent,
          avg_production: avgProduction
        })
        .eq('id', existingSummary.id);
    } else {
      await supabase
        .from('production_summary')
        .insert({
          apiary_id: apiaryId,
          year,
          month: null,
          total_production: totalProduction,
          change_percent: changePercent,
          avg_production: avgProduction
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
    
    const { data: existingSummary, error: summaryError } = await supabase
      .from('production_summary')
      .select('id')
      .eq('apiary_id', apiaryId)
      .eq('year', year)
      .eq('month', month)
      .single();

    if (summaryError && summaryError.code !== 'PGRST116') {
      throw summaryError;
    }

    // Update or insert the summary
    if (existingSummary) {
      await supabase
        .from('production_summary')
        .update({
          total_production: totalProduction
        })
        .eq('id', existingSummary.id);
    } else {
      await supabase
        .from('production_summary')
        .insert({
          apiary_id: apiaryId,
          year,
          month,
          total_production: totalProduction
        });
    }

    return true;
  } catch (error) {
    console.error('Error updating monthly summary:', error);
    throw error;
  }
}; 