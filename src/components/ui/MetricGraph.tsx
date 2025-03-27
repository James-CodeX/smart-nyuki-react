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
    if (values.length === 0) return [0, 1]; // Default domain when no data
    
    // Find actual min and max
    const minValue = Math.min(...values);
    const maxValue = Math.max(...values);
    
    // Calculate a more appropriate buffer based on the data range
    const range = maxValue - minValue;
    
    // Use a percentage buffer, but ensure minimum buffer for small ranges
    // and handle cases where min and max are the same
    const bufferPercentage = 0.15; // 15% buffer
    const minBufferAmount = 0.5; // Minimum buffer amount
    
    let buffer = range * bufferPercentage;
    if (buffer < minBufferAmount || range === 0) {
      buffer = minBufferAmount;
    }
    
    // Calculate the domain with buffer, ensuring y-axis never goes below 0 for weight data
    const yMin = Math.max(0, minValue - buffer);
    const yMax = maxValue + buffer;
    
    // Round domain values to make them more readable
    // Round down for min and up for max to ensure all data is visible
    return [Math.floor(yMin), Math.ceil(yMax)];
  };
  
  const domain = calculateDomain();

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 rounded-lg shadow-md border border-border text-sm" style={{ maxWidth: '150px', touchAction: 'none' }}>
          <p className="font-medium text-xs sm:text-sm">{payload[0].payload.time}</p>
          <p className="text-primary text-xs sm:text-sm">
            {payload[0].value.toFixed(1)} {unit}
          </p>
        </div>
      );
    }
    return null;
  };

  // Handle empty data case
  if (data.length === 0) {
    return (
      <div className={cn("w-full h-[140px] relative flex items-center justify-center", className)}>
        <p className="text-muted-foreground text-sm">No data available</p>
      </div>
    );
  }

  return (
    <div className={cn("w-full h-[140px] relative overflow-hidden", className)}>
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
        <ResponsiveContainer width="99%" height="100%">
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
            {/* SVG definitions should be inside the SVG element created by the LineChart */}
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                <stop offset="95%" stopColor={color} stopOpacity={0.2} />
              </linearGradient>
            </defs>
            
            <XAxis 
              dataKey="time" 
              tick={{ fontSize: 9, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              minTickGap={15}
              height={20}
            />
            <YAxis 
              domain={domain} 
              tick={{ fontSize: 9, fill: '#9CA3AF' }}
              tickLine={false}
              axisLine={false}
              width={20}
              // Add more ticks for better readability
              tickCount={4}
              // Format ticks to have at most 1 decimal place
              tickFormatter={(value) => 
                typeof value === 'number' ? value.toFixed(value % 1 === 0 ? 0 : 1) : value
              }
            />
            <Tooltip 
              content={<CustomTooltip />}
              wrapperStyle={{ zIndex: 10 }} // Ensure tooltip is above other elements
            />
            <Line
              type="monotone"
              dataKey="value"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, strokeWidth: 1, stroke: 'white' }}
              animationDuration={1500}
              isAnimationActive={true}
              // Use the gradient for the stroke
              stroke={`url(#${gradientId})`}
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
