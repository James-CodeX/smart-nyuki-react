
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Thermometer, Droplets, Volume2, Weight, AlertTriangle, BellRing, Bell, BellOff } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { getHiveById } from '@/utils/mockData';

// Components for detailed metric view
const DetailedMetricCard = ({ title, value, unit, data, color, icon: Icon, range, status }: any) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="metric-card p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-muted-foreground text-sm">Current Reading</p>
          </div>
        </div>
        <div className="text-3xl font-bold">
          {value} <span className="text-lg font-normal text-muted-foreground">{unit}</span>
        </div>
      </div>
      
      <div className="relative h-2 bg-secondary rounded-full mb-2 overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full ${color} rounded-full`}
          style={{ 
            width: `${((value - range[0]) / (range[1] - range[0])) * 100}%` 
          }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{range[0]} {unit}</span>
        <span>{range[1]} {unit}</span>
      </div>
      
      <div className="mt-4">
        <div className={`text-sm font-medium ${status.color}`}>
          {status.label}
        </div>
        <p className="text-sm text-muted-foreground mt-1">
          {status.description}
        </p>
      </div>
      
      <div className="mt-4 flex gap-2">
        <button className="flex-1 bg-secondary text-foreground py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
          <BellRing className="h-4 w-4 inline-block mr-1" />
          Set Alert
        </button>
        <button className="flex-1 bg-secondary text-foreground py-2 rounded-lg text-sm font-medium hover:bg-secondary/80 transition-colors">
          View History
        </button>
      </div>
    </motion.div>
  );
};

const HiveDetails = () => {
  const { apiaryId, hiveId } = useParams<{ apiaryId: string; hiveId: string }>();
  const [hive, setHive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => {
      if (apiaryId && hiveId) {
        const foundHive = getHiveById(apiaryId, hiveId);
        setHive(foundHive);
      }
      setLoading(false);
    }, 500);
    
    return () => clearTimeout(timer);
  }, [apiaryId, hiveId]);
  
  if (loading) {
    return (
      <div className="container max-w-7xl pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
        <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }
  
  if (!hive) {
    return (
      <div className="container max-w-7xl pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Hive Not Found</h2>
        <p className="text-muted-foreground mb-6">The hive you're looking for doesn't seem to exist.</p>
        <Link 
          to="/" 
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }
  
  // Get current values
  const currentTemp = hive.metrics.temperature[hive.metrics.temperature.length - 1].value;
  const currentHumidity = hive.metrics.humidity[hive.metrics.humidity.length - 1].value;
  const currentSound = hive.metrics.sound[hive.metrics.sound.length - 1].value;
  const currentWeight = hive.metrics.weight[hive.metrics.weight.length - 1].value;
  
  // Determine status for each metric
  const tempStatus = currentTemp > 36 
    ? { label: "Too Hot", color: "text-red-500", description: "The hive temperature is higher than optimal. Consider ventilation measures." }
    : currentTemp < 32
      ? { label: "Too Cold", color: "text-blue-500", description: "The hive temperature is lower than optimal. Check for proper insulation." }
      : { label: "Optimal", color: "text-green-500", description: "The hive temperature is within the optimal range." };
  
  const humidityStatus = currentHumidity > 65
    ? { label: "Too Humid", color: "text-blue-500", description: "The humidity is higher than optimal. Check ventilation." }
    : currentHumidity < 40
      ? { label: "Too Dry", color: "text-yellow-500", description: "The humidity is lower than optimal. Consider adding a water source nearby." }
      : { label: "Optimal", color: "text-green-500", description: "The humidity is within the optimal range." };
  
  const soundStatus = currentSound > 60
    ? { label: "High Activity", color: "text-purple-500", description: "High sound levels may indicate increased activity or potential swarming." }
    : currentSound < 30
      ? { label: "Low Activity", color: "text-yellow-500", description: "Low sound levels may indicate reduced hive activity." }
      : { label: "Normal", color: "text-green-500", description: "Sound levels indicate normal hive activity." };
  
  const weightStatus = currentWeight > 25
    ? { label: "Heavy", color: "text-green-500", description: "The hive is heavy, which could indicate good honey production." }
    : currentWeight < 10
      ? { label: "Light", color: "text-yellow-500", description: "The hive is light, which could indicate low honey stores or a new colony." }
      : { label: "Average", color: "text-green-500", description: "The hive weight is within expected range." };
  
  return (
    <PageTransition>
      <div className="container max-w-7xl pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <Link to={`/apiaries/${apiaryId}`} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to {hive.apiaryName}
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center"
            >
              <h1 className="text-3xl font-bold tracking-tight">{hive.name}</h1>
              {hive.alerts && hive.alerts.length > 0 && (
                <div className="ml-4 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {hive.alerts.length} {hive.alerts.length === 1 ? 'Alert' : 'Alerts'}
                </div>
              )}
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground mt-1"
            >
              Detailed metrics and analytics for this hive
            </motion.p>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-secondary text-foreground flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
            >
              <Bell className="h-4 w-4" />
              Alert Settings
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-primary-foreground flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
            >
              Export Data
            </motion.button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <DetailedMetricCard 
            title="Temperature"
            value={currentTemp.toFixed(1)}
            unit="°C"
            data={hive.metrics.temperature}
            color="bg-red-500"
            icon={Thermometer}
            range={[25, 40]}
            status={tempStatus}
          />
          
          <DetailedMetricCard 
            title="Humidity"
            value={currentHumidity.toFixed(0)}
            unit="%"
            data={hive.metrics.humidity}
            color="bg-blue-500"
            icon={Droplets}
            range={[30, 80]}
            status={humidityStatus}
          />
          
          <DetailedMetricCard 
            title="Sound Level"
            value={currentSound.toFixed(0)}
            unit="dB"
            data={hive.metrics.sound}
            color="bg-purple-500"
            icon={Volume2}
            range={[20, 80]}
            status={soundStatus}
          />
          
          <DetailedMetricCard 
            title="Weight"
            value={currentWeight.toFixed(1)}
            unit="kg"
            data={hive.metrics.weight}
            color="bg-amber-500"
            icon={Weight}
            range={[5, 30]}
            status={weightStatus}
          />
        </div>
        
        {hive.alerts && hive.alerts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-6"
          >
            <h3 className="text-lg font-medium text-amber-800 flex items-center mb-4">
              <AlertTriangle className="h-5 w-5 mr-2" />
              Active Alerts
            </h3>
            
            <div className="space-y-3">
              {hive.alerts.map((alert: any, index: number) => (
                <div key={index} className="flex items-start justify-between bg-white p-3 rounded-lg border border-amber-100">
                  <div>
                    <div className="font-medium">{alert.message}</div>
                    <div className="text-sm text-muted-foreground">Detected just now</div>
                  </div>
                  <button className="text-muted-foreground hover:text-foreground">
                    <BellOff className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="mt-4 text-sm text-amber-700">
              Set up notification preferences in your alert settings to receive real-time updates.
            </div>
          </motion.div>
        )}
      </div>
    </PageTransition>
  );
};

export default HiveDetails;
