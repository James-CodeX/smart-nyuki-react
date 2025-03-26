import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

export interface UserProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  bio?: string;
  experience_level?: 'beginner' | 'intermediate' | 'advanced' | 'professional';
  profile_image_url?: string;
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  id: string;
  user_id: string;
  theme: 'light' | 'dark' | 'system';
  language: string; 
  font_size: 'small' | 'medium' | 'large';
  high_contrast: boolean;
  temperature_unit: 'celsius' | 'fahrenheit';
  weight_unit: 'kg' | 'lb';
  date_format: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  created_at: string;
  updated_at: string;
}

export interface NotificationPreferences {
  id: string;
  user_id: string;
  email_notifications: boolean;
  sms_notifications: boolean;
  push_notifications: boolean;
  quiet_hours_start?: string; // Format: 'HH:MM'
  quiet_hours_end?: string; // Format: 'HH:MM'
  created_at: string;
  updated_at: string;
}

export interface AlertThresholds {
  id: string;
  user_id: string;
  temperature_min: number;
  temperature_max: number;
  humidity_min: number;
  humidity_max: number;
  sound_min: number;
  sound_max: number;
  weight_min: number;
  weight_max: number;
  created_at: string;
  updated_at: string;
}

export interface SharingPreferences {
  id: string;
  user_id: string;
  default_sharing_permission: 'view' | 'edit' | 'admin';
  allow_data_analytics: boolean;
  share_location: boolean;
  profile_visibility: 'public' | 'private' | 'contacts';
  production_data_visibility: 'public' | 'private' | 'contacts';
  activity_tracking: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get the current user's profile
 */
export const getUserProfile = async (): Promise<UserProfile | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userData.user.id)
      .single();

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error in getUserProfile:', error);
    return null;
  }
};

/**
 * Update user profile
 */
export const updateUserProfile = async (profileData: Partial<Omit<UserProfile, 'id' | 'created_at' | 'updated_at' | 'email'>>): Promise<UserProfile | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from('profiles')
      .update({ 
        ...profileData,
        updated_at: new Date().toISOString() 
      })
      .eq('id', userData.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user profile:', error);
      return null;
    }

    return data as UserProfile;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return null;
  }
};

/**
 * Upload profile image
 */
export const uploadProfileImage = async (file: File): Promise<string | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const fileExt = file.name.split('.').pop();
    const filePath = `profile-images/${userData.user.id}-${Date.now()}.${fileExt}`;

    const { error } = await supabase.storage
      .from('user-content')
      .upload(filePath, file);

    if (error) {
      console.error('Error uploading profile image:', error);
      return null;
    }

    const { data } = supabase.storage
      .from('user-content')
      .getPublicUrl(filePath);

    // Update the user profile with the new image URL
    await updateUserProfile({ profile_image_url: data.publicUrl });

    return data.publicUrl;
  } catch (error) {
    console.error('Error in uploadProfileImage:', error);
    return null;
  }
};

/**
 * Remove profile image
 */
export const removeProfileImage = async (): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    // Get the current profile to find the image URL
    const profile = await getUserProfile();
    if (!profile?.profile_image_url) return true; // No image to remove

    // Extract the file path from the URL
    const url = new URL(profile.profile_image_url);
    const pathSegments = url.pathname.split('/');
    const fileName = pathSegments[pathSegments.length - 1];
    const filePath = `profile-images/${fileName}`;

    // Remove the file from storage
    const { error: storageError } = await supabase.storage
      .from('user-content')
      .remove([filePath]);

    if (storageError) {
      console.error('Error removing profile image from storage:', storageError);
    }

    // Update the profile to remove the image URL
    await updateUserProfile({ profile_image_url: null });

    return true;
  } catch (error) {
    console.error('Error in removeProfileImage:', error);
    return false;
  }
};

/**
 * Get user preferences
 */
export const getUserPreferences = async (): Promise<UserPreferences | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        // Create default preferences if none exist
        return createDefaultUserPreferences(userData.user);
      }
      console.error('Error fetching user preferences:', error);
      return null;
    }

    return data as UserPreferences;
  } catch (error) {
    console.error('Error in getUserPreferences:', error);
    return null;
  }
};

/**
 * Create default user preferences
 */
const createDefaultUserPreferences = async (user: User): Promise<UserPreferences | null> => {
  try {
    const defaultPreferences = {
      user_id: user.id,
      theme: 'system' as const,
      language: 'en',
      font_size: 'medium' as const,
      high_contrast: false,
      temperature_unit: 'celsius' as const,
      weight_unit: 'kg' as const,
      date_format: 'MM/DD/YYYY' as const,
    };

    const { data, error } = await supabase
      .from('user_preferences')
      .insert([defaultPreferences])
      .select()
      .single();

    if (error) {
      console.error('Error creating default user preferences:', error);
      return null;
    }

    return data as UserPreferences;
  } catch (error) {
    console.error('Error in createDefaultUserPreferences:', error);
    return null;
  }
};

/**
 * Update user preferences
 */
export const updateUserPreferences = async (preferencesData: Partial<Omit<UserPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<UserPreferences | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    // Check if preferences exist
    const currentPreferences = await getUserPreferences();
    if (!currentPreferences) return null;

    const { data, error } = await supabase
      .from('user_preferences')
      .update({ 
        ...preferencesData,
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userData.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating user preferences:', error);
      return null;
    }

    return data as UserPreferences;
  } catch (error) {
    console.error('Error in updateUserPreferences:', error);
    return null;
  }
};

/**
 * Get notification preferences
 */
export const getNotificationPreferences = async (): Promise<NotificationPreferences | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        // Create default notification preferences
        return createDefaultNotificationPreferences(userData.user);
      }
      console.error('Error fetching notification preferences:', error);
      return null;
    }

    return data as NotificationPreferences;
  } catch (error) {
    console.error('Error in getNotificationPreferences:', error);
    return null;
  }
};

/**
 * Create default notification preferences
 */
const createDefaultNotificationPreferences = async (user: User): Promise<NotificationPreferences | null> => {
  try {
    const defaultPreferences = {
      user_id: user.id,
      email_notifications: true,
      sms_notifications: false,
      push_notifications: true,
      quiet_hours_start: '22:00',
      quiet_hours_end: '08:00',
    };

    const { data, error } = await supabase
      .from('notification_preferences')
      .insert([defaultPreferences])
      .select()
      .single();

    if (error) {
      console.error('Error creating default notification preferences:', error);
      return null;
    }

    return data as NotificationPreferences;
  } catch (error) {
    console.error('Error in createDefaultNotificationPreferences:', error);
    return null;
  }
};

/**
 * Update notification preferences
 */
export const updateNotificationPreferences = async (preferencesData: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<NotificationPreferences | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    // Check if preferences exist
    const currentPreferences = await getNotificationPreferences();
    if (!currentPreferences) return null;

    const { data, error } = await supabase
      .from('notification_preferences')
      .update({ 
        ...preferencesData,
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userData.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification preferences:', error);
      return null;
    }

    return data as NotificationPreferences;
  } catch (error) {
    console.error('Error in updateNotificationPreferences:', error);
    return null;
  }
};

/**
 * Get alert thresholds
 */
export const getAlertThresholds = async (): Promise<AlertThresholds | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from('alert_thresholds')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        // Create default alert thresholds
        return createDefaultAlertThresholds(userData.user);
      }
      console.error('Error fetching alert thresholds:', error);
      return null;
    }

    return data as AlertThresholds;
  } catch (error) {
    console.error('Error in getAlertThresholds:', error);
    return null;
  }
};

/**
 * Create default alert thresholds
 */
const createDefaultAlertThresholds = async (user: User): Promise<AlertThresholds | null> => {
  try {
    const defaultThresholds = {
      user_id: user.id,
      temperature_min: 32,
      temperature_max: 36,
      humidity_min: 40,
      humidity_max: 65,
      sound_min: 30,
      sound_max: 60,
      weight_min: 10,
      weight_max: 25,
    };

    const { data, error } = await supabase
      .from('alert_thresholds')
      .insert([defaultThresholds])
      .select()
      .single();

    if (error) {
      console.error('Error creating default alert thresholds:', error);
      return null;
    }

    return data as AlertThresholds;
  } catch (error) {
    console.error('Error in createDefaultAlertThresholds:', error);
    return null;
  }
};

/**
 * Update alert thresholds
 */
export const updateAlertThresholds = async (thresholdsData: Partial<Omit<AlertThresholds, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<AlertThresholds | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    // Check if thresholds exist
    const currentThresholds = await getAlertThresholds();
    if (!currentThresholds) return null;

    const { data, error } = await supabase
      .from('alert_thresholds')
      .update({ 
        ...thresholdsData,
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userData.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating alert thresholds:', error);
      return null;
    }

    return data as AlertThresholds;
  } catch (error) {
    console.error('Error in updateAlertThresholds:', error);
    return null;
  }
};

/**
 * Get sharing preferences
 */
export const getSharingPreferences = async (): Promise<SharingPreferences | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const { data, error } = await supabase
      .from('sharing_preferences')
      .select('*')
      .eq('user_id', userData.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') { // No rows returned
        // Create default sharing preferences
        return createDefaultSharingPreferences(userData.user);
      }
      console.error('Error fetching sharing preferences:', error);
      return null;
    }

    return data as SharingPreferences;
  } catch (error) {
    console.error('Error in getSharingPreferences:', error);
    return null;
  }
};

/**
 * Create default sharing preferences
 */
const createDefaultSharingPreferences = async (user: User): Promise<SharingPreferences | null> => {
  try {
    const defaultPreferences = {
      user_id: user.id,
      default_sharing_permission: 'view' as const,
      allow_data_analytics: true,
      share_location: false,
      profile_visibility: 'contacts' as const,
      production_data_visibility: 'private' as const,
      activity_tracking: true,
    };

    const { data, error } = await supabase
      .from('sharing_preferences')
      .insert([defaultPreferences])
      .select()
      .single();

    if (error) {
      console.error('Error creating default sharing preferences:', error);
      return null;
    }

    return data as SharingPreferences;
  } catch (error) {
    console.error('Error in createDefaultSharingPreferences:', error);
    return null;
  }
};

/**
 * Update sharing preferences
 */
export const updateSharingPreferences = async (preferencesData: Partial<Omit<SharingPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<SharingPreferences | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    // Check if preferences exist
    const currentPreferences = await getSharingPreferences();
    if (!currentPreferences) return null;

    const { data, error } = await supabase
      .from('sharing_preferences')
      .update({ 
        ...preferencesData,
        updated_at: new Date().toISOString() 
      })
      .eq('user_id', userData.user.id)
      .select()
      .single();

    if (error) {
      console.error('Error updating sharing preferences:', error);
      return null;
    }

    return data as SharingPreferences;
  } catch (error) {
    console.error('Error in updateSharingPreferences:', error);
    return null;
  }
};

/**
 * Get list of shared apiaries for the current user
 */
export const getSharedApiaries = async (): Promise<any[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
      .from('shared_apiaries')
      .select(`
        id,
        permission,
        created_at,
        apiaries(id, name),
        profiles!shared_apiaries_shared_with_fkey(id, first_name, last_name)
      `)
      .eq('user_id', userData.user.id);

    if (error) {
      console.error('Error fetching shared apiaries:', error);
      return [];
    }

    // Format the data for easier consumption
    return (data || []).map(item => {
      // Handle the response structure from Supabase joins
      const apiaryData = Array.isArray(item.apiaries) ? item.apiaries[0] : item.apiaries;
      const profileData = Array.isArray(item.profiles) ? item.profiles[0] : item.profiles;
      
      return {
        id: item.id,
        permission: item.permission,
        created_at: item.created_at,
        apiary_id: apiaryData?.id || null,
        apiary_name: apiaryData?.name || null,
        user_id: profileData?.id || null,
        user_name: profileData?.first_name && profileData?.last_name 
          ? `${profileData.first_name} ${profileData.last_name}`
          : 'Unknown User'
      };
    });
  } catch (error) {
    console.error('Error in getSharedApiaries:', error);
    return [];
  }
};

/**
 * Update sharing permission for a shared apiary
 */
export const updateSharingPermission = async (sharingId: string, permission: 'view' | 'edit' | 'admin'): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('shared_apiaries')
      .update({ permission })
      .eq('id', sharingId);

    if (error) {
      console.error('Error updating sharing permission:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateSharingPermission:', error);
    return false;
  }
};

/**
 * Remove sharing for an apiary
 */
export const removeSharing = async (sharingId: string): Promise<boolean> => {
  try {
    const { error } = await supabase
      .from('shared_apiaries')
      .delete()
      .eq('id', sharingId);

    if (error) {
      console.error('Error removing sharing:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in removeSharing:', error);
    return false;
  }
};

/**
 * Create a backup record
 */
export const createBackupRecord = async (): Promise<{ id: string; created_at: string; backup_type: string } | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    const backupRecord = {
      user_id: userData.user.id,
      backup_type: 'manual',
      status: 'completed',
      file_path: `backups/${userData.user.id}/${new Date().toISOString()}.json`
    };

    const { data, error } = await supabase
      .from('backups')
      .insert([backupRecord])
      .select()
      .single();

    if (error) {
      console.error('Error creating backup record:', error);
      return null;
    }

    return {
      id: data.id,
      created_at: data.created_at,
      backup_type: data.backup_type
    };
  } catch (error) {
    console.error('Error in createBackupRecord:', error);
    return null;
  }
};

/**
 * Get backup history for the current user
 */
export const getBackupHistory = async (): Promise<{ id: string; created_at: string; backup_type: string }[]> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
      .from('backups')
      .select('id, created_at, backup_type, status')
      .eq('user_id', userData.user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching backup history:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getBackupHistory:', error);
    return [];
  }
};

/**
 * Get user notification settings
 */
export const getUserNotificationSettings = async (): Promise<NotificationPreferences | null> => {
  return getNotificationPreferences();
};

/**
 * Update user notification settings
 */
export const updateUserNotificationSettings = async (settings: Partial<Omit<NotificationPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<NotificationPreferences | null> => {
  return updateNotificationPreferences(settings);
};

/**
 * Get user sharing settings
 */
export const getUserSharingSettings = async (): Promise<SharingPreferences | null> => {
  return getSharingPreferences();
};

/**
 * Update user sharing settings
 */
export const updateUserSharingSettings = async (settings: Partial<Omit<SharingPreferences, 'id' | 'user_id' | 'created_at' | 'updated_at'>>): Promise<SharingPreferences | null> => {
  return updateSharingPreferences(settings);
};

/**
 * Export all user data as a JSON file
 */
export const exportUserData = async (): Promise<Blob | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    // Gather all user data
    const [
      profile,
      preferences,
      notifications,
      alertThresholds,
      sharingPreferences,
      apiaries,
      hives,
      inspections,
      harvests
    ] = await Promise.all([
      getUserProfile(),
      getUserPreferences(),
      getNotificationPreferences(),
      getAlertThresholds(),
      getSharingPreferences(),
      getApiariesForUser(userData.user.id),
      getHivesForUser(userData.user.id),
      getInspectionsForUser(userData.user.id),
      getHarvestsForUser(userData.user.id)
    ]);

    const exportData = {
      profile,
      preferences,
      notifications,
      alertThresholds,
      sharingPreferences,
      apiaries,
      hives,
      inspections,
      harvests,
      exportDate: new Date().toISOString(),
      version: '1.0'
    };

    // Create backup record in database
    await createBackupRecord();

    // Convert data to JSON blob
    const jsonString = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    
    return blob;
  } catch (error) {
    console.error('Error in exportUserData:', error);
    return null;
  }
};

/**
 * Import user data from JSON file
 */
export const importUserData = async (file: File): Promise<boolean> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    // Read file contents
    const fileContents = await file.text();
    const importData = JSON.parse(fileContents);

    // Validate data structure
    if (!importData.version || !importData.profile) {
      throw new Error('Invalid data format');
    }

    // Update user profile if it exists
    if (importData.profile) {
      await updateUserProfile({
        first_name: importData.profile.first_name,
        last_name: importData.profile.last_name,
        phone: importData.profile.phone,
        bio: importData.profile.bio,
        experience_level: importData.profile.experience_level,
      });
    }

    // Update preferences if they exist
    if (importData.preferences) {
      await updateUserPreferences({
        theme: importData.preferences.theme,
        language: importData.preferences.language,
        font_size: importData.preferences.font_size,
        high_contrast: importData.preferences.high_contrast,
        temperature_unit: importData.preferences.temperature_unit,
        weight_unit: importData.preferences.weight_unit,
        date_format: importData.preferences.date_format
      });
    }

    // Update notification preferences if they exist
    if (importData.notifications) {
      await updateNotificationPreferences({
        email_notifications: importData.notifications.email_notifications,
        sms_notifications: importData.notifications.sms_notifications,
        push_notifications: importData.notifications.push_notifications,
        quiet_hours_start: importData.notifications.quiet_hours_start,
        quiet_hours_end: importData.notifications.quiet_hours_end
      });
    }

    // Update alert thresholds if they exist
    if (importData.alertThresholds) {
      await updateAlertThresholds({
        temperature_min: importData.alertThresholds.temperature_min,
        temperature_max: importData.alertThresholds.temperature_max,
        humidity_min: importData.alertThresholds.humidity_min,
        humidity_max: importData.alertThresholds.humidity_max,
        sound_min: importData.alertThresholds.sound_min,
        sound_max: importData.alertThresholds.sound_max,
        weight_min: importData.alertThresholds.weight_min,
        weight_max: importData.alertThresholds.weight_max
      });
    }

    // Update sharing preferences if they exist
    if (importData.sharingPreferences) {
      await updateSharingPreferences({
        default_sharing_permission: importData.sharingPreferences.default_sharing_permission,
        allow_data_analytics: importData.sharingPreferences.allow_data_analytics,
        share_location: importData.sharingPreferences.share_location,
        profile_visibility: importData.sharingPreferences.profile_visibility,
        production_data_visibility: importData.sharingPreferences.production_data_visibility,
        activity_tracking: importData.sharingPreferences.activity_tracking
      });
    }

    return true;
  } catch (error) {
    console.error('Error in importUserData:', error);
    return false;
  }
};

/**
 * Get database statistics for the current user
 */
export const getDatabaseStats = async (): Promise<{
  apiariesCount: number;
  hivesCount: number;
  inspectionsCount: number;
  harvestsCount: number;
  storageUsed: number; // in bytes
} | null> => {
  try {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;

    // Get counts from database with proper error handling
    const apiariesResult = await supabase
      .from('apiaries')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id);
      
    const hivesResult = await supabase
      .from('hives')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id);
      
    const inspectionsResult = await supabase
      .from('inspections')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id);
      
    const harvestsResult = await supabase
      .from('harvests')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userData.user.id);
      
    const storageData = await supabase.storage
      .from('user-content')
      .list(`user-data/${userData.user.id}`);

    // Safely handle possible errors and missing counts
    const apiariesCount = apiariesResult.error ? 0 : (apiariesResult.count || 0);
    const hivesCount = hivesResult.error ? 0 : (hivesResult.count || 0);
    const inspectionsCount = inspectionsResult.error ? 0 : (inspectionsResult.count || 0);
    const harvestsCount = harvestsResult.error ? 0 : (harvestsResult.count || 0);

    // Calculate storage usage
    let storageUsed = 0;
    if (!storageData.error && storageData.data) {
      storageUsed = storageData.data.reduce((total, file) => total + (file.metadata?.size || 0), 0);
    }

    return {
      apiariesCount,
      hivesCount,
      inspectionsCount,
      harvestsCount,
      storageUsed
    };
  } catch (error) {
    console.error('Error in getDatabaseStats:', error);
    return null;
  }
};

// Helper functions to fetch data for export
async function getApiariesForUser(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('apiaries')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching apiaries:', error);
    return [];
  }
  
  return data || [];
}

async function getHivesForUser(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('hives')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching hives:', error);
    return [];
  }
  
  return data || [];
}

async function getInspectionsForUser(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('inspections')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching inspections:', error);
    return [];
  }
  
  return data || [];
}

async function getHarvestsForUser(userId: string): Promise<any[]> {
  const { data, error } = await supabase
    .from('harvests')
    .select('*')
    .eq('user_id', userId);
  
  if (error) {
    console.error('Error fetching harvests:', error);
    return [];
  }
  
  return data || [];
} 