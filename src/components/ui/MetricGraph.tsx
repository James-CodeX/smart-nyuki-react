
import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { cn } from '@/lib/utils';

interface MetricGraphProps {
  data: Array<{ time: string; value: number }>;
  color: string;
  gradientId: string;
  unit: string;
  min?: number;
  max?: number;
  className?: string;
}

const MetricGraph: React.FC<MetricGraphProps> = ({
  data,
  color,
  gradientId,
  unit,
  min,
  max,
  className,
}) => {
  const [hoveredValue, setHoveredValue] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  
  useEffect(() => {
    // Simulate data loading
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);

  const calculateDomain = () => {
    if (min !== undefined && max !== undefined) {
      return [min, max];
    }
    
    const values = data.map(item => item.value);
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    const buffer = (maxValue - minValue) * 0.1;
    
    return [Math.max(0, minValue - buffer), maxValue + buffer];
  };
  
  const domain = calculateDomain();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded-lg shadow-md border border-border text-sm">
          <p className="font-medium">{payload[0].payload.time}</p>
          <p className="text-primary">
            {payload[0].value.toFixed(1)} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={cn("w-full h-[140px] relative", className)}>
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stopColor={color} stopOpacity={0.8} />
          <stop offset="95%" stopColor={color} stopOpacity={0.2} />
        </linearGradient>
      </defs>
      
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
        </div>
      )}
      
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: isLoaded ? 1 : 0 }}
        transition={{ duration: 0.5 }}
        className="w-full h-full"
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={data}
            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
            onMouseMove={(e) => {
              if (e.activePayload) {
                setHoveredValue(e.activePayload[0].value);
              }
            }}
            onMouseLeave={() => {
              setHoveredValue(null);
            }}
          >
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              minTickGap={30}
            />
            <YAxis 
              domain={domain} 
              tick={{ fontSize: 10, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              width={25}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 1, stroke: 'white' }}
              animationDuration={1500}
              isAnimationActive={true}
            />
          </LineChart>
        </ResponsiveContainer>
      </motion.div>
      
      {hoveredValue !== null && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-2 right-2 bg-white/90 backdrop-blur-sm px-2 py-1 rounded-full text-xs font-medium border border-border"
        >
          {hoveredValue.toFixed(1)} {unit}
        </motion.div>
      )}
    </div>
  );
};

export default MetricGraph;
