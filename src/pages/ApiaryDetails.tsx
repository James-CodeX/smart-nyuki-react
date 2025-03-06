
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, MapPin, Edit, AlertCircle } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import HiveMetricsCard from '@/components/dashboard/HiveMetricsCard';
import { getApiaryById } from '@/utils/mockData';

const ApiaryDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [apiary, setApiary] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      if (id) {
        const foundApiary = getApiaryById(id);
        setApiary(foundApiary);
      }
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [id]);
  
  if (loading) {
    return (
      <div className="container max-w-7xl pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
        <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }
  
  if (!apiary) {
    return (
      <div className="container max-w-7xl pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Apiary Not Found</h2>
        <p className="text-muted-foreground mb-6">The apiary you're looking for doesn't seem to exist.</p>
        <Link 
          to="/" 
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }
  
  // Count hives with alerts
  const alertCount = apiary.hives.filter((hive: any) => hive.alerts && hive.alerts.length > 0).length;
  
  return (
    <PageTransition>
      <div className="container max-w-7xl pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <Link to="/" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Dashboard
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight"
            >
              {apiary.name}
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground mt-1 flex items-center"
            >
              <MapPin className="h-4 w-4 mr-1" /> {apiary.location}
              {alertCount > 0 && (
                <span className="ml-4 text-amber-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {alertCount} {alertCount === 1 ? 'hive needs' : 'hives need'} attention
                </span>
              )}
            </motion.p>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-secondary text-secondary-foreground flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Edit className="h-4 w-4" />
              Edit Apiary
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-primary-foreground flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Hive
            </motion.button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="metric-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Temperature</h3>
            <div className="text-2xl font-bold">
              {apiary.avgTemperature.toFixed(1)} °C
            </div>
            <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-full"
                style={{ width: `${(apiary.avgTemperature / 40) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="metric-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Humidity</h3>
            <div className="text-2xl font-bold">
              {apiary.avgHumidity.toFixed(0)} %
            </div>
            <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${apiary.avgHumidity}%` }}
              />
            </div>
          </div>
          
          <div className="metric-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Sound Level</h3>
            <div className="text-2xl font-bold">
              {apiary.avgSound.toFixed(0)} dB
            </div>
            <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${(apiary.avgSound / 80) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="metric-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Weight</h3>
            <div className="text-2xl font-bold">
              {apiary.avgWeight.toFixed(1)} kg
            </div>
            <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${(apiary.avgWeight / 30) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        <h2 className="text-2xl font-semibold mb-6">Hives in this Apiary</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {apiary.hives.map((hive: any, i: number) => (
            <motion.div
              key={hive.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <HiveMetricsCard
                id={hive.id}
                name={hive.name}
                apiaryId={hive.apiaryId}
                apiaryName={hive.apiaryName}
                metrics={hive.metrics}
                alerts={hive.alerts}
              />
            </motion.div>
          ))}
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: apiary.hives.length * 0.1 }}
            className="flex items-center justify-center bg-secondary/50 border border-dashed border-secondary-foreground/20 rounded-2xl p-5 min-h-[400px] cursor-pointer hover:bg-secondary/80 transition-colors"
          >
            <div className="text-center">
              <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                <Plus className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-lg font-medium">Add New Hive</h3>
              <p className="text-muted-foreground text-sm mt-1">Expand your apiary with a new hive</p>
            </div>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default ApiaryDetails;
