import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bell, User, Lock, Thermometer, Droplets, Volume2, Weight, Save, Database, Download, Upload, RefreshCw, Languages, Monitor, Sun, Moon, PieChart, Share2, Eye, EyeOff, UserCircle, Share, Settings2 } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { 
  getUserProfile, 
  updateUserProfile, 
  uploadProfileImage,
  removeProfileImage,
  getUserPreferences,
  updateUserPreferences,
  getNotificationPreferences,
  updateNotificationPreferences,
  getAlertThresholds,
  updateAlertThresholds,
  getSharingPreferences,
  updateSharingPreferences,
  exportUserData,
  importUserData,
  getDatabaseStats,
  createBackupRecord,
  getBackupHistory,
  getSharedApiaries,
  updateSharingPermission,
  removeSharing
} from '@/services/settingsService';
import { supabase } from '@/lib/supabase';

// Profile Section
const ProfileSection = () => {
  const [profile, setProfile] = useState<{ 
    first_name: string; 
    last_name: string; 
    email: string; 
    phone?: string;
    bio?: string;
    experience_level?: string;
    profile_image_url?: string;
  }>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    bio: '',
    experience_level: 'intermediate'
  });
  
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  // Load user profile data
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      try {
        const userProfile = await getUserProfile();
        if (userProfile) {
          setProfile({
            first_name: userProfile.first_name || '',
            last_name: userProfile.last_name || '',
            email: userProfile.email || '',
            phone: userProfile.phone || '',
            bio: userProfile.bio || '',
            experience_level: userProfile.experience_level || 'intermediate',
            profile_image_url: userProfile.profile_image_url
          });
        }
      } catch (error) {
        console.error('Error loading profile:', error);
        toast({
          variant: "destructive",
          title: "Error loading profile",
          description: "Failed to load profile data. Please try again."
        });
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [toast]);

  // Handle form input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const result = await updateUserProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
        bio: profile.bio,
        experience_level: profile.experience_level as any
      });

      if (result) {
        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully."
        });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        variant: "destructive",
        title: "Error updating profile",
        description: "Failed to update profile. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle profile image upload
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsSaving(true);
    
    try {
      const imageUrl = await uploadProfileImage(file);
      if (imageUrl) {
        setProfile(prev => ({ ...prev, profile_image_url: imageUrl }));
        toast({
          title: "Image uploaded",
          description: "Your profile image has been updated."
        });
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        variant: "destructive",
        title: "Error uploading image",
        description: "Failed to upload image. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  // Handle profile image removal
  const handleRemoveImage = async () => {
    setIsSaving(true);
    
    try {
      const success = await removeProfileImage();
      if (success) {
        setProfile(prev => ({ ...prev, profile_image_url: undefined }));
        toast({
          title: "Image removed",
          description: "Your profile image has been removed."
        });
      } else {
        throw new Error('Failed to remove image');
      }
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        variant: "destructive",
        title: "Error removing image",
        description: "Failed to remove image. Please try again."
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="metric-card p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Personal Information</h3>
        <div className="space-y-3 sm:space-y-4">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-foreground mb-1">
              First Name
            </label>
            <input
              type="text"
              id="first_name"
              name="first_name"
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg"
              value={profile.first_name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-foreground mb-1">
              Last Name
            </label>
            <input
              type="text"
              id="last_name"
              name="last_name"
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg"
              value={profile.last_name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg"
              value={profile.email}
              disabled
              readOnly
            />
            <p className="text-xs text-muted-foreground mt-1">Email cannot be changed. Contact support for assistance.</p>
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg"
              value={profile.phone || ''}
              onChange={handleChange}
            />
          </div>
        </div>
        <button 
          type="submit" 
          className="mt-4 sm:mt-6 bg-primary text-primary-foreground w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center"
          disabled={isSaving}
        >
          {isSaving ? (
            <>
              <span className="mr-2 animate-spin">⟳</span>
              Updating...
            </>
          ) : 'Update Profile'}
        </button>
      </div>
      
      {/* Profile picture section */}
      <div className="metric-card p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">Profile Picture</h3>
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <div className="w-24 h-24 rounded-full bg-secondary/70 overflow-hidden flex items-center justify-center">
            {profile.profile_image_url ? (
              <img 
                src={profile.profile_image_url} 
                alt="Profile" 
                className="w-full h-full object-cover"
              />
            ) : (
              <User className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 space-y-3 w-full">
            <p className="text-sm text-muted-foreground">Upload a profile picture to personalize your account.</p>
            <div className="flex flex-col xs:flex-row gap-2">
              <label className="bg-primary/10 hover:bg-primary/20 text-primary py-2 px-4 rounded-lg text-sm font-medium flex-1 text-center cursor-pointer">
                Upload Photo
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleImageUpload}
                  disabled={isSaving}
                />
              </label>
              <button 
                type="button"
                className="bg-secondary hover:bg-secondary/70 py-2 px-4 rounded-lg text-sm font-medium flex-1"
                onClick={handleRemoveImage}
                disabled={!profile.profile_image_url || isSaving}
              >
                Remove Photo
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* About Me section */}
      <div className="metric-card p-4 sm:p-6">
        <h3 className="text-base sm:text-lg font-medium mb-3 sm:mb-4">About Me</h3>
        <div className="space-y-3">
          <label htmlFor="bio" className="block text-sm font-medium text-foreground mb-1">
            Bio
          </label>
          <textarea
            id="bio"
            name="bio"
            rows={4}
            className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg"
            placeholder="Tell us about your beekeeping experience..."
            value={profile.bio || ''}
            onChange={handleChange}
          />
          <label htmlFor="experience_level" className="block text-sm font-medium text-foreground mb-1">
            Experience Level
          </label>
          <select
            id="experience_level"
            name="experience_level"
            className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg"
            value={profile.experience_level || 'intermediate'}
            onChange={handleChange}
          >
            <option value="beginner">Beginner (0-2 years)</option>
            <option value="intermediate">Intermediate (3-5 years)</option>
            <option value="advanced">Advanced (5+ years)</option>
            <option value="professional">Professional Beekeeper</option>
          </select>
          <button 
            type="submit" 
            className="mt-2 bg-primary text-primary-foreground w-full py-2 rounded-lg text-sm font-medium flex items-center justify-center"
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <span className="mr-2 animate-spin">⟳</span>
                Saving...
              </>
            ) : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  );
};

// Notifications Section
const NotificationsSection = () => {
  const [notificationSettings, setNotificationSettings] = useState({
    email_notifications: true,
    sms_notifications: false,
    push_notifications: true,
    quiet_hours_start: '',
    quiet_hours_end: ''
  });
  
  const [thresholds, setThresholds] = useState({
    temperature_min: 10,
    temperature_max: 40,
    humidity_min: 30,
    humidity_max: 80,
    sound_min: 30,
    sound_max: 90,
    weight_min: 10,
    weight_max: 100
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load notification settings
  useEffect(() => {
    const loadNotificationSettings = async () => {
      setLoading(true);
      try {
        // Load notification preferences
        const settings = await getNotificationPreferences();
        if (settings) {
          setNotificationSettings({
            email_notifications: settings.email_notifications,
            sms_notifications: settings.sms_notifications,
            push_notifications: settings.push_notifications,
            quiet_hours_start: settings.quiet_hours_start || '',
            quiet_hours_end: settings.quiet_hours_end || ''
          });
        }

        // Load alert thresholds
        const alerts = await getAlertThresholds();
        if (alerts) {
          setThresholds({
            temperature_min: alerts.temperature_min,
            temperature_max: alerts.temperature_max,
            humidity_min: alerts.humidity_min,
            humidity_max: alerts.humidity_max,
            sound_min: alerts.sound_min,
            sound_max: alerts.sound_max,
            weight_min: alerts.weight_min,
            weight_max: alerts.weight_max
          });
        }
      } catch (error) {
        console.error('Error loading notification settings:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load notification settings"
        });
      } finally {
        setLoading(false);
      }
    };

    loadNotificationSettings();
  }, [toast]);

  // Handle notification toggle
  const handleNotificationToggle = (field: string) => {
    const newValue = !notificationSettings[field as keyof typeof notificationSettings];
    setNotificationSettings(prev => ({ ...prev, [field]: newValue }));
    
    // Save to database
    updateNotificationSetting({ [field]: newValue });
  };

  // Handle time change
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNotificationSettings(prev => ({ ...prev, [name]: value }));
  };

  // Handle threshold change
  const handleThresholdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = parseInt(value, 10);
    setThresholds(prev => ({ ...prev, [name]: numValue }));
  };

  // Save time settings
  const saveTimeSettings = async () => {
    await updateNotificationSetting({
      quiet_hours_start: notificationSettings.quiet_hours_start,
      quiet_hours_end: notificationSettings.quiet_hours_end
    });
  };

  // Save threshold settings
  const saveThresholdSettings = async () => {
    await updateThreshold(thresholds);
  };

  // Update notification setting in database
  const updateNotificationSetting = async (data: Partial<typeof notificationSettings>) => {
    setSaving(true);
    try {
      const result = await updateNotificationPreferences(data);
      if (!result) {
        throw new Error('Failed to update notification settings');
      }
      
      toast({
        title: "Success",
        description: "Notification settings updated"
      });
    } catch (error) {
      console.error('Error saving notification settings:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save notification settings"
      });
    } finally {
      setSaving(false);
    }
  };

  // Update threshold in database
  const updateThreshold = async (data: Partial<typeof thresholds>) => {
    setSaving(true);
    try {
      const result = await updateAlertThresholds(data);
      if (!result) {
        throw new Error('Failed to update alert thresholds');
      }
      
      toast({
        title: "Success",
        description: "Alert thresholds updated"
      });
    } catch (error) {
      console.error('Error saving alert thresholds:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save alert thresholds"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Notification Channels</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email Notifications</div>
              <div className="text-sm text-muted-foreground">Receive important updates via email</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notificationSettings.email_notifications}
                onChange={() => handleNotificationToggle('email_notifications')}
                disabled={saving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">SMS Notifications</div>
              <div className="text-sm text-muted-foreground">Receive urgent alerts via text messages</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notificationSettings.sms_notifications}
                onChange={() => handleNotificationToggle('sms_notifications')}
                disabled={saving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Push Notifications</div>
              <div className="text-sm text-muted-foreground">Receive real-time alerts on your device</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={notificationSettings.push_notifications}
                onChange={() => handleNotificationToggle('push_notifications')}
                disabled={saving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>

      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Quiet Hours</h3>
        <div className="space-y-4">
          <div className="text-sm text-muted-foreground mb-4">
            During these hours, only urgent alerts will be sent.
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="quietHoursStart" className="block text-sm font-medium mb-1">Start Time</label>
              <input 
                type="time" 
                id="quietHoursStart" 
                name="quiet_hours_start"
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2"
                value={notificationSettings.quiet_hours_start}
                onChange={handleTimeChange}
                disabled={saving}
              />
            </div>
            <div>
              <label htmlFor="quietHoursEnd" className="block text-sm font-medium mb-1">End Time</label>
              <input 
                type="time" 
                id="quietHoursEnd" 
                name="quiet_hours_end"
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2"
                value={notificationSettings.quiet_hours_end}
                onChange={handleTimeChange}
                disabled={saving}
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button 
              size="sm" 
              onClick={saveTimeSettings}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Quiet Hours'}
            </Button>
          </div>
        </div>
      </div>

      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Alert Thresholds</h3>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium flex items-center gap-2">
                <Thermometer className="w-4 h-4" /> Temperature (°C)
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="temperatureMin" className="block text-xs font-medium mb-1">Min</label>
                <input 
                  type="number" 
                  id="temperatureMin" 
                  name="temperature_min"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2"
                  value={thresholds.temperature_min}
                  onChange={handleThresholdChange}
                  disabled={saving}
                />
              </div>
              <div>
                <label htmlFor="temperatureMax" className="block text-xs font-medium mb-1">Max</label>
                <input 
                  type="number" 
                  id="temperatureMax" 
                  name="temperature_max"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2"
                  value={thresholds.temperature_max}
                  onChange={handleThresholdChange}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium flex items-center gap-2">
                <Droplets className="w-4 h-4" /> Humidity (%)
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="humidityMin" className="block text-xs font-medium mb-1">Min</label>
                <input 
                  type="number" 
                  id="humidityMin" 
                  name="humidity_min"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2"
                  value={thresholds.humidity_min}
                  onChange={handleThresholdChange}
                  disabled={saving}
                />
              </div>
              <div>
                <label htmlFor="humidityMax" className="block text-xs font-medium mb-1">Max</label>
                <input 
                  type="number" 
                  id="humidityMax" 
                  name="humidity_max"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2"
                  value={thresholds.humidity_max}
                  onChange={handleThresholdChange}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium flex items-center gap-2">
                <Volume2 className="w-4 h-4" /> Sound Level (dB)
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="soundMin" className="block text-xs font-medium mb-1">Min</label>
                <input 
                  type="number" 
                  id="soundMin" 
                  name="sound_min"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2"
                  value={thresholds.sound_min}
                  onChange={handleThresholdChange}
                  disabled={saving}
                />
              </div>
              <div>
                <label htmlFor="soundMax" className="block text-xs font-medium mb-1">Max</label>
                <input 
                  type="number" 
                  id="soundMax" 
                  name="sound_max"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2"
                  value={thresholds.sound_max}
                  onChange={handleThresholdChange}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="font-medium flex items-center gap-2">
                <Weight className="w-4 h-4" /> Weight (kg)
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="weightMin" className="block text-xs font-medium mb-1">Min</label>
                <input 
                  type="number" 
                  id="weightMin" 
                  name="weight_min"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2"
                  value={thresholds.weight_min}
                  onChange={handleThresholdChange}
                  disabled={saving}
                />
              </div>
              <div>
                <label htmlFor="weightMax" className="block text-xs font-medium mb-1">Max</label>
                <input 
                  type="number" 
                  id="weightMax" 
                  name="weight_max"
                  className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2"
                  value={thresholds.weight_max}
                  onChange={handleThresholdChange}
                  disabled={saving}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button 
              size="sm" 
              onClick={saveThresholdSettings}
              disabled={saving}
            >
              {saving ? 'Saving...' : 'Save Thresholds'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Appearance Section
const AppearanceSection = () => {
  const [preferences, setPreferences] = useState({
    theme: 'system' as 'light' | 'dark' | 'system',
    language: 'en',
    fontSize: 'medium' as 'small' | 'medium' | 'large',
    highContrast: false,
    temperatureUnit: 'celsius' as 'celsius' | 'fahrenheit',
    weightUnit: 'kg' as 'kg' | 'lb',
    dateFormat: 'MM/DD/YYYY' as 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD'
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load user preferences
  useEffect(() => {
    const loadPreferences = async () => {
      setLoading(true);
      try {
        const userPrefs = await getUserPreferences();
        if (userPrefs) {
          setPreferences({
            theme: userPrefs.theme,
            language: userPrefs.language,
            fontSize: userPrefs.font_size,
            highContrast: userPrefs.high_contrast,
            temperatureUnit: userPrefs.temperature_unit,
            weightUnit: userPrefs.weight_unit,
            dateFormat: userPrefs.date_format
          });
        }
      } catch (error) {
        console.error('Error loading preferences:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load appearance preferences"
        });
      } finally {
        setLoading(false);
      }
    };

    loadPreferences();
  }, [toast]);

  // Handle theme change
  const handleThemeChange = async (theme: 'light' | 'dark' | 'system') => {
    setPreferences(prev => ({ ...prev, theme }));
    savePreference({ theme });
  };

  // Handle other preference changes
  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setPreferences(prev => ({ ...prev, [name]: value }));
    
    // Map the form field names to database field names
    const fieldMap: Record<string, string> = {
      'language': 'language',
      'fontSize': 'font_size',
      'dateFormat': 'date_format'
    };
    
    const dbField = fieldMap[name];
    if (dbField) {
      savePreference({ [dbField]: value });
    }
  };

  // Handle toggle changes
  const handleToggleChange = (field: string) => {
    const newValue = !preferences[field as keyof typeof preferences];
    setPreferences(prev => ({ ...prev, [field]: newValue }));
    
    // Map the form field names to database field names
    const fieldMap: Record<string, string> = {
      'highContrast': 'high_contrast'
    };
    
    const dbField = fieldMap[field];
    if (dbField) {
      savePreference({ [dbField]: newValue });
    }
  };

  // Handle unit toggle changes
  const handleUnitToggle = (field: string, value: string) => {
    setPreferences(prev => ({ ...prev, [field]: value }));
    
    // Map the form field names to database field names
    const fieldMap: Record<string, string> = {
      'temperatureUnit': 'temperature_unit',
      'weightUnit': 'weight_unit'
    };
    
    const dbField = fieldMap[field];
    if (dbField) {
      savePreference({ [dbField]: value });
    }
  };

  // Save preference to database
  const savePreference = async (data: Record<string, any>) => {
    setSaving(true);
    try {
      const result = await updateUserPreferences(data);
      if (!result) {
        throw new Error('Failed to update preferences');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save preferences"
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Display Settings</h3>
        <div className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label htmlFor="theme" className="text-sm font-medium">Theme Preference</label>
              <span className="text-xs text-muted-foreground">Changes the appearance of the app</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button 
                className={`p-3 border rounded-lg flex flex-col items-center justify-center gap-2 ${preferences.theme === 'light' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}
                onClick={() => handleThemeChange('light')}
                disabled={saving}
              >
                <Sun className="h-5 w-5" />
                <span className="text-xs">Light</span>
              </button>
              <button 
                className={`p-3 border rounded-lg flex flex-col items-center justify-center gap-2 ${preferences.theme === 'dark' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}
                onClick={() => handleThemeChange('dark')}
                disabled={saving}
              >
                <Moon className="h-5 w-5" />
                <span className="text-xs">Dark</span>
              </button>
              <button 
                className={`p-3 border rounded-lg flex flex-col items-center justify-center gap-2 ${preferences.theme === 'system' ? 'border-primary bg-primary/10' : 'border-border hover:border-muted-foreground'}`}
                onClick={() => handleThemeChange('system')}
                disabled={saving}
              >
                <Monitor className="h-5 w-5" />
                <span className="text-xs">System</span>
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="language" className="block text-sm font-medium mb-1">Language</label>
            <select 
              id="language" 
              name="language"
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2"
              value={preferences.language}
              onChange={handleChange}
              disabled={saving}
            >
              <option value="en">English</option>
              <option value="fr">Français</option>
              <option value="es">Español</option>
              <option value="de">Deutsch</option>
              <option value="sw">Kiswahili</option>
            </select>
          </div>
          
          <div>
            <label htmlFor="fontSize" className="block text-sm font-medium mb-1">Font Size</label>
            <select 
              id="fontSize" 
              name="fontSize"
              className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2"
              value={preferences.fontSize}
              onChange={handleChange}
              disabled={saving}
            >
              <option value="small">Small</option>
              <option value="medium">Medium</option>
              <option value="large">Large</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">High Contrast Mode</div>
              <div className="text-sm text-muted-foreground">Increases contrast for better visibility</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input 
                type="checkbox" 
                className="sr-only peer" 
                checked={preferences.highContrast}
                onChange={() => handleToggleChange('highContrast')}
                disabled={saving}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Metric Display</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Temperature Unit</div>
              <div className="text-sm text-muted-foreground">Choose between Celsius and Fahrenheit</div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${preferences.temperatureUnit === 'celsius' ? 'font-bold' : ''}`}>°C</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.temperatureUnit === 'fahrenheit'}
                  onChange={() => handleUnitToggle('temperatureUnit', preferences.temperatureUnit === 'celsius' ? 'fahrenheit' : 'celsius')}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span className={`text-sm ${preferences.temperatureUnit === 'fahrenheit' ? 'font-bold' : ''}`}>°F</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Weight Unit</div>
              <div className="text-sm text-muted-foreground">Choose between Kilograms and Pounds</div>
            </div>
            <div className="flex items-center space-x-2">
              <span className={`text-sm ${preferences.weightUnit === 'kg' ? 'font-bold' : ''}`}>kg</span>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={preferences.weightUnit === 'lb'}
                  onChange={() => handleUnitToggle('weightUnit', preferences.weightUnit === 'kg' ? 'lb' : 'kg')}
                  disabled={saving}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span className={`text-sm ${preferences.weightUnit === 'lb' ? 'font-bold' : ''}`}>lb</span>
            </div>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Date Format</div>
              <div className="text-sm text-muted-foreground">Choose your preferred date format</div>
            </div>
            <select 
              className="bg-secondary/50 border border-border rounded-lg px-3 py-1 text-sm"
              name="dateFormat"
              value={preferences.dateFormat}
              onChange={handleChange}
              disabled={saving}
            >
              <option value="MM/DD/YYYY">MM/DD/YYYY</option>
              <option value="DD/MM/YYYY">DD/MM/YYYY</option>
              <option value="YYYY-MM-DD">YYYY-MM-DD</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

// Security Section
const SecuritySection = () => {
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false
  });
  
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPassword(prev => ({ ...prev, [field]: !prev[field] }));
  };

  // Handle password change
  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate passwords
    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New passwords do not match"
      });
      return;
    }
    
    if (formData.newPassword.length < 8) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "New password must be at least 8 characters"
      });
      return;
    }
    
    setSaving(true);
    try {
      // Update password in Supabase Auth
      const { error } = await supabase.auth.updateUser({ 
        password: formData.newPassword 
      });
      
      if (error) {
        throw error;
      }
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      toast({
        title: "Success",
        description: "Password updated successfully"
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to update password"
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Password Management</h3>
        <form onSubmit={handlePasswordChange} className="space-y-4">
          <div>
            <label htmlFor="currentPassword" className="block text-sm font-medium mb-1">Current Password</label>
            <div className="relative">
              <input 
                type={showPassword.current ? "text" : "password"} 
                id="currentPassword" 
                name="currentPassword"
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 pr-10"
                value={formData.currentPassword}
                onChange={handleChange}
                required
                disabled={saving}
              />
              <button 
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                onClick={() => togglePasswordVisibility('current')}
              >
                {showPassword.current ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          
          <div>
            <label htmlFor="newPassword" className="block text-sm font-medium mb-1">New Password</label>
            <div className="relative">
              <input 
                type={showPassword.new ? "text" : "password"} 
                id="newPassword" 
                name="newPassword"
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 pr-10"
                value={formData.newPassword}
                onChange={handleChange}
                required
                disabled={saving}
                minLength={8}
              />
              <button 
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                onClick={() => togglePasswordVisibility('new')}
              >
                {showPassword.new ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-1">Password must be at least 8 characters</p>
          </div>
          
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium mb-1">Confirm New Password</label>
            <div className="relative">
              <input 
                type={showPassword.confirm ? "text" : "password"} 
                id="confirmPassword" 
                name="confirmPassword"
                className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2 pr-10"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                disabled={saving}
              />
              <button 
                type="button"
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-muted-foreground"
                onClick={() => togglePasswordVisibility('confirm')}
              >
                {showPassword.confirm ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit"
              disabled={saving}
            >
              {saving ? 'Updating...' : 'Update Password'}
            </Button>
          </div>
        </form>
      </div>
      
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Enable 2FA</div>
              <div className="text-sm text-muted-foreground">Add an extra layer of security to your account</div>
            </div>
            <Button variant="outline" size="sm">
              Set Up 2FA
            </Button>
          </div>
        </div>
      </div>
      
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Session Management</h3>
        <div className="space-y-4">
          <div className="p-3 bg-destructive/10 text-destructive rounded-lg flex items-center justify-between">
            <div className="font-medium">Sign out of all devices</div>
            <Button variant="destructive" size="sm">
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Data Management Section
const DataManagementSection = () => {
  const [dbStats, setDbStats] = useState<{
    apiariesCount: number;
    hivesCount: number;
    inspectionsCount: number;
    harvestsCount: number;
    storageUsed: number;
  } | null>(null);
  
  const [backupHistory, setBackupHistory] = useState<{
    id: string;
    created_at: string;
    backup_type: string;
  }[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [creating, setCreating] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // Load database stats and backup history
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Load database stats
        const stats = await getDatabaseStats();
        setDbStats(stats);

        // Load backup history
        const history = await getBackupHistory();
        setBackupHistory(history);
      } catch (error) {
        console.error('Error loading data management info:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: "Failed to load data management information"
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(1) + ' GB';
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(undefined, {
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle export data
  const handleExportData = async () => {
    setExporting(true);
    try {
      const blob = await exportUserData();
      if (!blob) {
        throw new Error('Failed to export data');
      }
      
      // Create download link
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `beekeeping-data-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Success",
        description: "Data exported successfully"
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to export data"
      });
    } finally {
      setExporting(false);
    }
  };

  // Handle file selection for import
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setImporting(true);
    try {
      const success = await importUserData(file);
      if (!success) {
        throw new Error('Failed to import data');
      }
      
      toast({
        title: "Success",
        description: "Data imported successfully"
      });
      
      // Reload page to show updated data
      window.location.reload();
    } catch (error) {
      console.error('Error importing data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to import data. Make sure the file is valid."
      });
    } finally {
      setImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Create backup
  const handleCreateBackup = async () => {
    setCreating(true);
    try {
      const result = await createBackupRecord();
      if (!result) {
        throw new Error('Failed to create backup');
      }
      
      // Add to backup history
      setBackupHistory(prev => [
        {
          id: result.id,
          created_at: result.created_at,
          backup_type: 'manual'
        },
        ...prev
      ]);
      
      toast({
        title: "Success",
        description: "Backup created successfully"
      });
    } catch (error) {
      console.error('Error creating backup:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to create backup"
      });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-48">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Database Statistics</h3>
        {dbStats && (
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Apiaries</div>
              <div className="text-2xl font-bold">{dbStats.apiariesCount}</div>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Hives</div>
              <div className="text-2xl font-bold">{dbStats.hivesCount}</div>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Inspections</div>
              <div className="text-2xl font-bold">{dbStats.inspectionsCount}</div>
            </div>
            <div className="p-4 bg-secondary/30 rounded-lg">
              <div className="text-sm text-muted-foreground">Harvests</div>
              <div className="text-2xl font-bold">{dbStats.harvestsCount}</div>
            </div>
          </div>
        )}
        
        <div className="mt-4 p-4 bg-secondary/30 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-muted-foreground">Storage Used</div>
              <div className="text-xl font-bold">{dbStats ? formatFileSize(dbStats.storageUsed) : '0 bytes'}</div>
            </div>
            <PieChart className="h-10 w-10 text-primary opacity-70" />
          </div>
        </div>
      </div>

      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Data Management</h3>
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <button 
              className="flex-1 flex items-center justify-center gap-2 p-3 bg-secondary/50 hover:bg-secondary/80 rounded-lg text-sm font-medium"
              onClick={handleExportData}
              disabled={exporting}
            >
              <Download className="h-4 w-4" />
              {exporting ? 'Exporting...' : 'Export All Data'}
            </button>
            
            <div className="flex-1 relative">
              <input
                type="file"
                id="import-file"
                ref={fileInputRef}
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
                disabled={importing}
              />
              <label 
                htmlFor="import-file"
                className="flex items-center justify-center gap-2 p-3 bg-secondary/50 hover:bg-secondary/80 rounded-lg text-sm font-medium cursor-pointer w-full"
              >
                <Upload className="h-4 w-4" />
                {importing ? 'Importing...' : 'Import Data'}
              </label>
            </div>
          </div>
          
          <button 
            className="w-full flex items-center justify-center gap-2 p-3 bg-secondary/50 hover:bg-secondary/80 rounded-lg text-sm font-medium"
            onClick={handleCreateBackup}
            disabled={creating}
          >
            <Save className="h-4 w-4" />
            {creating ? 'Creating...' : 'Create Backup'}
          </button>
        </div>
      </div>

      {backupHistory.length > 0 && (
        <div className="metric-card p-6">
          <h3 className="text-lg font-medium mb-4">Backup History</h3>
          <div className="space-y-3">
            {backupHistory.map((backup) => (
              <div key={backup.id} className="flex items-center justify-between p-3 bg-secondary/30 rounded-lg">
                <div>
                  <div className="text-sm font-medium">{backup.backup_type === 'auto' ? 'Automatic Backup' : 'Manual Backup'}</div>
                  <div className="text-xs text-muted-foreground">{formatDate(backup.created_at)}</div>
                </div>
                <button className="text-primary hover:text-primary/80">
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// Sharing Section
const SharingSection = () => {
  return (
    <div className="space-y-4">
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Sharing Preferences</h3>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Manage how you share your apiaries and hive data with others.</p>
          
          <div className="space-y-6 mt-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Default Sharing Permissions</div>
                <div className="text-sm text-muted-foreground">Set the default permissions when sharing apiaries</div>
              </div>
              <select className="bg-secondary/50 border border-border rounded-lg px-3 py-1 text-sm">
                <option value="view">View Only</option>
                <option value="edit">View & Edit</option>
                <option value="admin">Full Access</option>
              </select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Allow Data Sharing for Analytics</div>
                <div className="text-sm text-muted-foreground">Share anonymous data to improve beekeeping insights</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <div className="font-medium">Share Location Information</div>
                <div className="text-sm text-muted-foreground">Allow sharing of apiary locations</div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" value="" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>
          </div>
        </div>
      </div>
      
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Privacy Settings</h3>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Profile Visibility</div>
              <div className="text-sm text-muted-foreground">Control who can see your beekeeper profile</div>
            </div>
            <select className="bg-secondary/50 border border-border rounded-lg px-3 py-1 text-sm">
              <option value="public">Public</option>
              <option value="private">Private</option>
              <option value="contacts">Shared Contacts Only</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Production Data Visibility</div>
              <div className="text-sm text-muted-foreground">Control who can see your honey production data</div>
            </div>
            <select className="bg-secondary/50 border border-border rounded-lg px-3 py-1 text-sm">
              <option value="private">Private</option>
              <option value="contacts">Shared Contacts Only</option>
              <option value="public">Public</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Activity Tracking</div>
              <div className="text-sm text-muted-foreground">Allow tracking of app usage for personalization</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <button className="mt-4 w-full flex items-center justify-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 py-2 rounded-lg text-sm font-medium">
            <EyeOff className="h-4 w-4" />
            Request Data Deletion
          </button>
        </div>
      </div>
      
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Shared Apiaries</h3>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">Manage apiaries that have been shared with you or that you have shared with others.</p>
          
          <div className="mt-4 space-y-3">
            <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
              <div>
                <div className="font-medium">Mountain View Apiary</div>
                <div className="text-xs text-muted-foreground">Shared by: John Doe</div>
              </div>
              <select className="bg-secondary/50 border border-border rounded-lg px-2 py-1 text-xs">
                <option>View Only</option>
                <option>View & Edit</option>
                <option>Remove Access</option>
              </select>
            </div>
            
            <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
              <div>
                <div className="font-medium">Valley Hives</div>
                <div className="text-xs text-muted-foreground">Shared with: Sarah Smith</div>
              </div>
              <select className="bg-secondary/50 border border-border rounded-lg px-2 py-1 text-xs">
                <option>View Only</option>
                <option>View & Edit</option>
                <option>Full Access</option>
                <option>Remove Sharing</option>
              </select>
            </div>
          </div>
          
          <button className="mt-2 flex items-center justify-center gap-2 bg-primary/10 hover:bg-primary/20 text-primary py-2 px-4 rounded-lg text-sm font-medium w-full">
            <Share2 className="h-4 w-4" />
            Manage Shared Apiaries
          </button>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  
  return (
    <PageTransition>
      <div className="container px-4 py-4 sm:py-8 mx-auto max-w-7xl">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Settings</h1>
        
        {/* Mobile Tab Selector - Visible only on small screens */}
        <div className="md:hidden mb-4">
          <select 
            className="w-full bg-secondary/50 border border-border rounded-lg px-3 py-2"
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value)}
          >
            <option value="profile">Profile</option>
            <option value="notifications">Notifications</option>
            <option value="appearance">Appearance</option>
            <option value="sharing">Sharing & Privacy</option>
            <option value="security">Security</option>
            <option value="data">Data Management</option>
          </select>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 md:gap-6">
          {/* Sidebar menu - Hidden on small screens */}
          <div className="hidden md:block md:w-1/4">
            <div className="metric-card p-4 sticky top-4">
              <ul className="space-y-1">
                <li>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
                      activeTab === 'profile' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                    }`}
                    onClick={() => setActiveTab('profile')}
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
                      activeTab === 'notifications' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                    }`}
                    onClick={() => setActiveTab('notifications')}
                  >
                    <Bell className="h-4 w-4" />
                    <span>Notifications</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
                      activeTab === 'appearance' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                    }`}
                    onClick={() => setActiveTab('appearance')}
                  >
                    <Sun className="h-4 w-4" />
                    <span>Appearance</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
                      activeTab === 'sharing' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                    }`}
                    onClick={() => setActiveTab('sharing')}
                  >
                    <Share2 className="h-4 w-4" />
                    <span>Sharing & Privacy</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
                      activeTab === 'security' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                    }`}
                    onClick={() => setActiveTab('security')}
                  >
                    <Lock className="h-4 w-4" />
                    <span>Security</span>
                  </button>
                </li>
                <li>
                  <button
                    className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 ${
                      activeTab === 'data' ? 'bg-primary text-primary-foreground' : 'hover:bg-secondary'
                    }`}
                    onClick={() => setActiveTab('data')}
                  >
                    <Database className="h-4 w-4" />
                    <span>Data Management</span>
                  </button>
                </li>
              </ul>
            </div>
          </div>
          
          <div className="w-full md:w-3/4">
            {activeTab === 'profile' && <ProfileSection />}
            {activeTab === 'notifications' && <NotificationsSection />}
            {activeTab === 'appearance' && <AppearanceSection />}
            {activeTab === 'sharing' && <SharingSection />}
            {activeTab === 'security' && <SecuritySection />}
            {activeTab === 'data' && <DataManagementSection />}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Settings;
