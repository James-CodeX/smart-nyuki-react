import React from 'react';
import { BarChart3, Activity, ArrowUpRight, ArrowDownRight, Dot } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { 
  AreaChart, 
  Area, 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from 'recharts';

interface DashboardChartProps {
  title: string;
  description?: string;
  data: any[];
  type?: 'line' | 'bar' | 'area';
  dataKey: string;
  categories?: string[];
  colors?: string[];
  className?: string;
  height?: number;
  showGrid?: boolean;
  yAxisFormatter?: (value: number) => string;
  tooltipFormatter?: (value: number) => string;
  valueChange?: {
    value: number;
    percentage: number;
    trend: 'up' | 'down' | 'neutral';
  };
}

const DashboardChart: React.FC<DashboardChartProps> = ({
  title,
  description,
  data,
  type = 'line',
  dataKey,
  categories = ['value'],
  colors = ['#2563eb'],
  className,
  height = 300,
  showGrid = true,
  yAxisFormatter = (value) => `${value}`,
  tooltipFormatter = (value) => `${value}`,
  valueChange
}) => {
  // Check if data is empty or invalid
  const hasValidData = Array.isArray(data) && data.length > 0;

  const renderChart = () => {
    // If no valid data, show a placeholder message
    if (!hasValidData) {
      return (
        <div 
          className="flex items-center justify-center text-muted-foreground text-sm"
          style={{ height: height }}
        >
          No data available
        </div>
      );
    }
    
    // Calculate domain for Y axis
    const calculateDomain = () => {
      // Extract all values from all data series
      const allValues = [];
      for (const category of categories) {
        const categoryValues = data.map(item => Number(item[category])).filter(val => !isNaN(val));
        allValues.push(...categoryValues);
      }
      
      if (allValues.length === 0) return [0, 1];
      
      // Find min and max
      const minValue = Math.min(...allValues);
      const maxValue = Math.max(...allValues);
      
      // Calculate range and buffer
      const range = maxValue - minValue;
      const bufferPercentage = 0.15; // 15% buffer
      const minBufferAmount = 0.5; // Minimum buffer amount
      
      let buffer = range * bufferPercentage;
      if (buffer < minBufferAmount || range === 0) {
        buffer = minBufferAmount;
      }
      
      // Set minimum to 0 if all values are positive
      const yMin = minValue >= 0 ? 0 : Math.floor(minValue - buffer);
      const yMax = Math.ceil(maxValue + buffer);
      
      return [yMin, yMax];
    };
    
    const domain = calculateDomain();
    
    const commonProps = {
      data,
      margin: { top: 10, right: 10, left: 10, bottom: 10 }
    };

    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <BarChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />}
              <XAxis 
                dataKey={dataKey} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }}
                tickMargin={8}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }} 
                tickFormatter={yAxisFormatter}
                tickMargin={8}
                domain={domain}
                tickCount={5}
              />
              <Tooltip 
                formatter={tooltipFormatter}
                contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
              />
              {categories.map((category, index) => (
                <Bar 
                  key={category}
                  dataKey={category} 
                  fill={colors[index % colors.length]} 
                  radius={[4, 4, 0, 0]}
                  barSize={16}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );
      case 'area':
        return (
          <ResponsiveContainer width="100%" height={height}>
            <AreaChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />}
              <XAxis 
                dataKey={dataKey} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }}
                tickMargin={8}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }} 
                tickFormatter={yAxisFormatter}
                tickMargin={8}
                domain={domain}
                tickCount={5}
              />
              <Tooltip 
                formatter={tooltipFormatter}
                contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
              />
              {categories.map((category, index) => (
                <Area
                  key={category}
                  type="monotone"
                  dataKey={category}
                  fill={colors[index % colors.length]}
                  fillOpacity={0.2}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        );
      case 'line':
      default:
        return (
          <ResponsiveContainer width="100%" height={height}>
            <LineChart {...commonProps}>
              {showGrid && <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />}
              <XAxis 
                dataKey={dataKey} 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }}
                tickMargin={8}
              />
              <YAxis 
                axisLine={false} 
                tickLine={false} 
                tick={{ fontSize: 12 }} 
                tickFormatter={yAxisFormatter}
                tickMargin={8}
                domain={domain}
                tickCount={5}
              />
              <Tooltip 
                formatter={tooltipFormatter}
                contentStyle={{ border: 'none', borderRadius: '8px', boxShadow: '0 2px 10px rgba(0,0,0,0.1)' }}
              />
              {categories.map((category, index) => (
                <Line
                  key={category}
                  type="monotone"
                  dataKey={category}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ r: 0 }}
                  activeDot={{ r: 4, strokeWidth: 0 }}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );
    }
  };

  return (
    <Card className={cn("overflow-visible", className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base font-medium">{title}</CardTitle>
          {description && (
            <CardDescription>{description}</CardDescription>
          )}
        </div>
        
        {valueChange && (
          <div className="flex items-center gap-2">
            <div className={cn(
              "text-sm flex items-center gap-1 py-0.5 px-2 rounded-full",
              valueChange.trend === 'up' ? 'bg-green-100 text-green-700' : 
              valueChange.trend === 'down' ? 'bg-red-100 text-red-700' : 
              'bg-gray-100 text-gray-700'
            )}>
              {valueChange.trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
              {valueChange.trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
              <span>{Math.abs(valueChange.percentage)}%</span>
            </div>
          </div>
        )}
      </CardHeader>
      <CardContent className="overflow-visible">
        {renderChart()}
      </CardContent>
    </Card>
  );
};

export default DashboardChart; 