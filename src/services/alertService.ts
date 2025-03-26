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