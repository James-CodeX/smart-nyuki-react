
import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import MetricGraph from '../ui/MetricGraph';

interface HiveMetricsCardProps {
  id: string;
  name: string;
  apiaryId: string;
  apiaryName: string;
  metrics: {
    temperature: Array<{ time: string; value: number }>;
    humidity: Array<{ time: string; value: number }>;
    sound: Array<{ time: string; value: number }>;
    weight: Array<{ time: string; value: number }>;
  };
  alerts?: Array<{ type: string; message: string }>;
  className?: string;
}

const HiveMetricsCard: React.FC<HiveMetricsCardProps> = ({
  id,
  name,
  apiaryId,
  apiaryName,
  metrics,
  alerts = [],
  className,
}) => {
  // Get current values (last item in each metric array)
  const currentTemp = metrics.temperature.length ? metrics.temperature[metrics.temperature.length - 1].value : 0;
  const currentHumidity = metrics.humidity.length ? metrics.humidity[metrics.humidity.length - 1].value : 0;
  const currentSound = metrics.sound.length ? metrics.sound[metrics.sound.length - 1].value : 0;
  const currentWeight = metrics.weight.length ? metrics.weight[metrics.weight.length - 1].value : 0;
  
  // Determine status colors
  const tempColor = currentTemp > 36 ? 'text-red-500' : currentTemp < 32 ? 'text-blue-500' : 'text-green-500';
  const humidityColor = currentHumidity > 65 ? 'text-blue-500' : currentHumidity < 40 ? 'text-yellow-500' : 'text-green-500';
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={cn(
        "metric-card p-5",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-medium">{name}</h3>
          <p className="text-muted-foreground text-sm">{apiaryName}</p>
        </div>
        {alerts.length > 0 && (
          <motion.div
            initial={{ scale: 0.8 }}
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ repeat: Infinity, repeatType: 'reverse', duration: 2 }}
            className="bg-amber-100 text-amber-800 px-2 py-1 rounded-full text-xs font-medium flex items-center"
          >
            <AlertTriangle className="h-3 w-3 mr-1" />
            {alerts.length} {alerts.length === 1 ? 'Alert' : 'Alerts'}
          </motion.div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-6">
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Temperature</span>
            <span className={cn("text-sm font-bold", tempColor)}>
              {currentTemp.toFixed(1)} °C
            </span>
          </div>
          <MetricGraph 
            data={metrics.temperature} 
            color="#ef4444" 
            gradientId="tempGradient" 
            unit="°C"
            min={25}
            max={40}
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
            data={metrics.humidity} 
            color="#0ea5e9" 
            gradientId="humidityGradient" 
            unit="%"
            min={30}
            max={80}
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
            data={metrics.sound} 
            color="#8b5cf6" 
            gradientId="soundGradient" 
            unit="dB"
            min={20}
            max={80}
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
            data={metrics.weight} 
            color="#d97706" 
            gradientId="weightGradient" 
            unit="kg"
            min={5}
            max={30}
          />
        </div>
      </div>
      
      <div className="mt-4 flex justify-end">
        <Link 
          to={`/apiaries/${apiaryId}/hives/${id}`}
          className="text-primary flex items-center text-sm font-medium hover:underline"
        >
          View Details
          <ChevronRight className="h-4 w-4 ml-1" />
        </Link>
      </div>
    </motion.div>
  );
};

export default HiveMetricsCard;
