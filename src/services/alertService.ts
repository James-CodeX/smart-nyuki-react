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
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select(`
        *,
        hives (
          id,
          name,
          apiary_id,
          apiaries (
            id,
            name
          )
        )
      `)
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
      hive_name: alert.hives?.name || 'Unknown',
      apiary_id: alert.hives?.apiary_id || '',
      apiary_name: alert.hives?.apiaries?.name || 'Unknown',
    }));

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
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select(`
        *,
        hives (
          id,
          name,
          apiary_id,
          apiaries (
            id,
            name
          )
        )
      `)
      .eq('hive_id', hiveId)
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
      hive_name: alert.hives?.name || 'Unknown',
      apiary_id: alert.hives?.apiary_id || '',
      apiary_name: alert.hives?.apiaries?.name || 'Unknown',
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
    const { data: alerts, error } = await supabase
      .from('alerts')
      .select(`
        *,
        hives (
          id,
          name,
          apiary_id,
          apiaries (
            id,
            name
          )
        )
      `)
      .eq('hives.apiary_id', apiaryId)
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
      hive_name: alert.hives?.name || 'Unknown',
      apiary_id: alert.hives?.apiary_id || '',
      apiary_name: alert.hives?.apiaries?.name || 'Unknown',
    }));

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
    const { data, error } = await supabase
      .from('alerts')
      .insert([{
        ...alertData,
        is_read: false,
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        hives (
          id,
          name,
          apiary_id,
          apiaries (
            id,
            name
          )
        )
      `)
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      hive_name: data.hives?.name || 'Unknown',
      apiary_id: data.hives?.apiary_id || '',
      apiary_name: data.hives?.apiaries?.name || 'Unknown',
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
    const { count, error } = await supabase
      .from('alerts')
      .select('*', { count: 'exact', head: true })
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