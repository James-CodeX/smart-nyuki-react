
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, User, Lock, Thermometer, Droplets, Volume2, Weight, Save } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';

// Profile Section
const ProfileSection = () => {
  return (
    <div className="space-y-4">
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Personal Information</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-foreground mb-1">
              Name
            </label>
            <input
              type="text"
              id="name"
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg"
              defaultValue="John Beekeeper"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg"
              defaultValue="john@example.com"
            />
          </div>
          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-foreground mb-1">
              Phone
            </label>
            <input
              type="tel"
              id="phone"
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg"
              defaultValue="+1 (555) 123-4567"
            />
          </div>
        </div>
        <button className="mt-6 bg-primary text-primary-foreground w-full py-2 rounded-lg text-sm font-medium">
          Update Profile
        </button>
      </div>
    </div>
  );
};

// Notifications Section
const NotificationsSection = () => {
  return (
    <div className="space-y-4">
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Notification Preferences</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Email Notifications</div>
              <div className="text-sm text-muted-foreground">Receive important alerts via email</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">SMS Notifications</div>
              <div className="text-sm text-muted-foreground">Receive urgent alerts via SMS</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer" />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <div className="font-medium">Push Notifications</div>
              <div className="text-sm text-muted-foreground">Receive app notifications</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" value="" className="sr-only peer" defaultChecked />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
            </label>
          </div>
        </div>
      </div>
      
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Alert Thresholds</h3>
        <div className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Thermometer className="h-4 w-4 text-red-500 mr-2" />
                <span>Temperature Range (°C)</span>
              </div>
              <span className="text-sm text-muted-foreground">32°C - 36°C</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="20"
                max="45"
                step="0.5"
                defaultValue="32"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="range"
                min="20"
                max="45"
                step="0.5"
                defaultValue="36"
                className="absolute top-0 w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Droplets className="h-4 w-4 text-blue-500 mr-2" />
                <span>Humidity Range (%)</span>
              </div>
              <span className="text-sm text-muted-foreground">40% - 65%</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="20"
                max="80"
                step="1"
                defaultValue="40"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="range"
                min="20"
                max="80"
                step="1"
                defaultValue="65"
                className="absolute top-0 w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Volume2 className="h-4 w-4 text-purple-500 mr-2" />
                <span>Sound Level Range (dB)</span>
              </div>
              <span className="text-sm text-muted-foreground">30dB - 60dB</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="20"
                max="80"
                step="1"
                defaultValue="30"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="range"
                min="20"
                max="80"
                step="1"
                defaultValue="60"
                className="absolute top-0 w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center">
                <Weight className="h-4 w-4 text-amber-500 mr-2" />
                <span>Weight Range (kg)</span>
              </div>
              <span className="text-sm text-muted-foreground">10kg - 25kg</span>
            </div>
            <div className="relative">
              <input
                type="range"
                min="5"
                max="30"
                step="0.5"
                defaultValue="10"
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
              />
              <input
                type="range"
                min="5"
                max="30"
                step="0.5"
                defaultValue="25"
                className="absolute top-0 w-full h-2 bg-transparent rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </div>
        </div>
        
        <button className="mt-6 bg-primary text-primary-foreground flex items-center justify-center gap-2 w-full py-2 rounded-lg text-sm font-medium">
          <Save className="h-4 w-4" />
          Save Thresholds
        </button>
      </div>
    </div>
  );
};

// Security Section
const SecuritySection = () => {
  return (
    <div className="space-y-4">
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Change Password</h3>
        <div className="space-y-4">
          <div>
            <label htmlFor="current-password" className="block text-sm font-medium text-foreground mb-1">
              Current Password
            </label>
            <input
              type="password"
              id="current-password"
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-medium text-foreground mb-1">
              New Password
            </label>
            <input
              type="password"
              id="new-password"
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg"
              placeholder="••••••••"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-medium text-foreground mb-1">
              Confirm New Password
            </label>
            <input
              type="password"
              id="confirm-password"
              className="w-full px-3 py-2 bg-secondary/50 border border-border rounded-lg"
              placeholder="••••••••"
            />
          </div>
        </div>
        <button className="mt-6 bg-primary text-primary-foreground w-full py-2 rounded-lg text-sm font-medium">
          Update Password
        </button>
      </div>
      
      <div className="metric-card p-6">
        <h3 className="text-lg font-medium mb-4">Two-Factor Authentication</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Add an extra layer of security to your account by enabling two-factor authentication.
        </p>
        <div className="flex items-center justify-between">
          <div>
            <div className="font-medium">Enable 2FA</div>
            <div className="text-sm text-muted-foreground">Use an authenticator app</div>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" value="" className="sr-only peer" />
            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>
      </div>
    </div>
  );
};

const Settings = () => {
  const [activeTab, setActiveTab] = useState('profile');
  
  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Lock },
  ];
  
  return (
    <PageTransition>
      <div className="container max-w-7xl pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <motion.h1 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-3xl font-bold tracking-tight mb-8"
        >
          Settings
        </motion.h1>
        
        <div className="flex flex-col md:flex-row gap-6">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="md:w-64 flex md:flex-col bg-white rounded-xl shadow-sm p-2 md:p-4 flex-wrap"
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium w-full ${
                  activeTab === tab.id
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:bg-secondary/50'
                }`}
              >
                <tab.icon className="h-5 w-5" />
                {tab.label}
              </button>
            ))}
          </motion.div>
          
          <div className="flex-1">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="w-full"
            >
              {activeTab === 'profile' && <ProfileSection />}
              {activeTab === 'notifications' && <NotificationsSection />}
              {activeTab === 'security' && <SecuritySection />}
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Settings;
