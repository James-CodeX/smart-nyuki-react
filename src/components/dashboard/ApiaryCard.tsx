
import React from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { ChevronRight, Thermometer, Droplets, Volume2, Weight } from 'lucide-react';
import { cn } from '@/lib/utils';
import AnimatedNumber from '../common/AnimatedNumber';

interface ApiaryCardProps {
  id: string;
  name: string;
  location: string;
  hiveCount: number;
  avgTemperature: number;
  avgHumidity: number;
  avgSound: number;
  avgWeight: number;
  className?: string;
}

const ApiaryCard: React.FC<ApiaryCardProps> = ({
  id,
  name,
  location,
  hiveCount,
  avgTemperature,
  avgHumidity,
  avgSound,
  avgWeight,
  className,
}) => {
  const temperatureStatus = avgTemperature > 36 ? 'text-red-500' : avgTemperature < 32 ? 'text-blue-500' : 'text-green-500';
  const humidityStatus = avgHumidity > 65 ? 'text-blue-500' : avgHumidity < 40 ? 'text-yellow-500' : 'text-green-500';
  
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ type: 'spring', stiffness: 200, damping: 15 }}
      className={cn(
        "metric-card p-5 cursor-pointer",
        className
      )}
    >
      <Link to={`/apiaries/${id}`} className="block h-full">
        <div className="flex justify-between items-start mb-3">
          <div>
            <h3 className="text-lg font-medium">{name}</h3>
            <p className="text-muted-foreground text-sm">{location}</p>
          </div>
          <div className="bg-primary/10 text-primary px-2 py-1 rounded-full text-xs font-medium">
            {hiveCount} {hiveCount === 1 ? 'Hive' : 'Hives'}
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-3 mt-4">
          <div className="flex items-center">
            <Thermometer className={cn("h-4 w-4 mr-2", temperatureStatus)} />
            <span className="text-sm mr-1">Temp:</span>
            <span className={cn("font-medium", temperatureStatus)}>
              <AnimatedNumber value={avgTemperature} decimals={1} /> °C
            </span>
          </div>
          
          <div className="flex items-center">
            <Droplets className={cn("h-4 w-4 mr-2", humidityStatus)} />
            <span className="text-sm mr-1">Humidity:</span>
            <span className="font-medium">
              <AnimatedNumber value={avgHumidity} decimals={0} /> %
            </span>
          </div>
          
          <div className="flex items-center">
            <Volume2 className="h-4 w-4 mr-2 text-purple-500" />
            <span className="text-sm mr-1">Sound:</span>
            <span className="font-medium">
              <AnimatedNumber value={avgSound} decimals={0} /> dB
            </span>
          </div>
          
          <div className="flex items-center">
            <Weight className="h-4 w-4 mr-2 text-amber-600" />
            <span className="text-sm mr-1">Weight:</span>
            <span className="font-medium">
              <AnimatedNumber value={avgWeight} decimals={1} /> kg
            </span>
          </div>
        </div>
        
        <div className="mt-4 flex justify-end">
          <span className="text-primary flex items-center text-sm font-medium">
            View Details
            <ChevronRight className="h-4 w-4 ml-1" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
};

export default ApiaryCard;
