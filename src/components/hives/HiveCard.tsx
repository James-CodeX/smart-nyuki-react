import React from 'react';
import { motion } from 'framer-motion';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { HiveWithDetails } from '@/services/hiveService';
import MetricGraph from '../ui/MetricGraph';

interface HiveCardProps {
  hive: HiveWithDetails;
  onClick?: () => void;
}

// Define both possible metric formats
interface TimeMetric {
  time: string;
  value: number;
}

interface TimestampMetric {
  timestamp: string;
  value: number;
}

type MetricItem = TimeMetric | TimestampMetric;

// Type guard to check for timestamp property
function hasTimestamp(item: MetricItem): item is TimestampMetric {
  return 'timestamp' in item;
}

const HiveCard: React.FC<HiveCardProps> = ({ hive, onClick }) => {
  // Ensure the hive metrics exist
  const metrics = hive.metrics || { temperature: [], humidity: [], weight: [], sound: [] };
  
  // Calculate the latest metrics
  const currentTemp = metrics.temperature.length > 0 
    ? metrics.temperature[metrics.temperature.length - 1].value 
    : 0;
  
  const currentHumidity = metrics.humidity.length > 0 
    ? metrics.humidity[metrics.humidity.length - 1].value 
    : 0;
  
  const currentSound = metrics.sound.length > 0 
    ? metrics.sound[metrics.sound.length - 1].value 
    : 0;
  
  const currentWeight = metrics.weight.length > 0 
    ? metrics.weight[metrics.weight.length - 1].value 
    : 0;
  
  // Determine status colors
  const tempColor = currentTemp > 36 ? 'text-red-500' : currentTemp < 32 ? 'text-blue-500' : 'text-green-500';
  const humidityColor = currentHumidity > 65 ? 'text-blue-500' : currentHumidity < 40 ? 'text-yellow-500' : 'text-green-500';
  
  // Convert metrics to the format expected by MetricGraph
  const normalizeMetrics = (metricsArray: MetricItem[]): TimeMetric[] => {
    // First, sort the array by timestamp in ascending order
    const sortedArray = [...metricsArray].sort((a, b) => {
      const timeA = hasTimestamp(a) ? a.timestamp : a.time;
      const timeB = hasTimestamp(b) ? b.timestamp : b.time;
      return new Date(timeA).getTime() - new Date(timeB).getTime();
    });
    
    // Take only the last 24 points for better visibility
    const limitedArray = sortedArray.slice(-24);
    
    return limitedArray.map(item => {
      // Get the appropriate time string (either time or timestamp)
      const timeString = hasTimestamp(item) ? item.timestamp : item.time;
      
      // Format the date string into a readable time format (HH:MM)
      let formattedTime = '';
      try {
        const date = new Date(timeString);
        formattedTime = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      } catch (err) {
        console.error('Error formatting time:', err);
        formattedTime = timeString; // Fallback to original string if parsing fails
      }
      
      return {
        time: formattedTime,
        value: item.value
      };
    });
  };
  
  const temperatureData = normalizeMetrics(metrics.temperature);
  const humidityData = normalizeMetrics(metrics.humidity);
  const soundData = normalizeMetrics(metrics.sound);
  const weightData = normalizeMetrics(metrics.weight);
  
  // Create unique gradient IDs for this hive
  const tempGradientId = `tempGradient-${hive.hive_id}`;
  const humidityGradientId = `humidityGradient-${hive.hive_id}`;
  const soundGradientId = `soundGradient-${hive.hive_id}`;
  const weightGradientId = `weightGradient-${hive.hive_id}`;
  
  const hasAlerts = hive.alerts && hive.alerts.length > 0;

  return (
    <div className="w-full overflow-hidden">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={cn(
          "metric-card p-4 sm:p-5 cursor-pointer w-full",
          hasAlerts ? 'border-amber-200' : ''
        )}
        onClick={onClick}
      >
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium">{hive.name}</h3>
            <p className="text-muted-foreground text-sm">{hive.apiaryName}</p>
          </div>
          {hasAlerts && (
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
              className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium flex items-center"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              {hive.alerts.length} {hive.alerts.length === 1 ? 'Alert' : 'Alerts'}
            </motion.div>
          )}
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Temperature</span>
              <span className={cn("text-sm font-bold", tempColor)}>
                {currentTemp.toFixed(1)} °C
              </span>
            </div>
            <MetricGraph 
              data={temperatureData} 
              color="#ef4444" 
              gradientId={tempGradientId} 
              unit="°C"
              min={25}
              max={40}
              className="h-[100px] sm:h-[120px]"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Humidity</span>
              <span className={cn("text-sm font-bold", humidityColor)}>
                {currentHumidity.toFixed(0)} %
              </span>
            </div>
            <MetricGraph 
              data={humidityData} 
              color="#0ea5e9" 
              gradientId={humidityGradientId} 
              unit="%"
              min={30}
              max={80}
              className="h-[100px] sm:h-[120px]"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Sound Level</span>
              <span className="text-sm font-bold text-purple-600">
                {currentSound.toFixed(0)} dB
              </span>
            </div>
            <MetricGraph 
              data={soundData} 
              color="#8b5cf6" 
              gradientId={soundGradientId} 
              unit="dB"
              min={20}
              max={80}
              className="h-[100px] sm:h-[120px]"
            />
          </div>
          
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Weight</span>
              <span className="text-sm font-bold text-amber-600">
                {currentWeight.toFixed(1)} kg
              </span>
            </div>
            <MetricGraph 
              data={weightData} 
              color="#d97706" 
              gradientId={weightGradientId} 
              unit="kg"
              min={5}
              max={30}
              className="h-[100px] sm:h-[120px]"
            />
          </div>
        </div>
        
        <div className="mt-4 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-0">
          <div className="flex flex-wrap gap-2">
            <span className="bg-secondary text-xs px-2 py-1 rounded-full">{hive.type}</span>
            <span className="bg-secondary text-xs px-2 py-1 rounded-full">{hive.status}</span>
          </div>
          <div className="text-primary flex items-center text-sm font-medium hover:underline">
            Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default HiveCard; 