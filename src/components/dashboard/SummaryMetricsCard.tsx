import React from 'react';
import { motion } from 'framer-motion';
import { Thermometer, Droplets, Volume2, Weight, AlertTriangle, TrendingUp, TrendingDown, Check } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface SummaryMetricProps {
  title: string;
  value: number | string;
  unit?: string;
  icon: React.ReactNode;
  description?: string;
  changeValue?: number;
  trend?: 'up' | 'down' | 'neutral';
  status?: 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

export const SummaryMetric: React.FC<SummaryMetricProps> = ({
  title,
  value,
  unit,
  icon,
  description,
  changeValue,
  trend,
  status = 'info',
  className
}) => {
  const statusColors = {
    success: 'bg-green-100 text-green-700',
    warning: 'bg-yellow-100 text-yellow-700',
    danger: 'bg-red-100 text-red-700',
    info: 'bg-blue-100 text-blue-700'
  };

  const trendIcon = trend === 'up' ? 
    <TrendingUp className="h-3 w-3" /> : 
    trend === 'down' ? 
    <TrendingDown className="h-3 w-3" /> : 
    <Check className="h-3 w-3" />;

  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={cn("p-1.5 rounded-full", statusColors[status])}>
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value}{unit && <span className="text-sm font-normal text-muted-foreground ml-1">{unit}</span>}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {changeValue !== undefined && (
          <div className="flex items-center mt-2">
            <div className={cn(
              "text-xs flex items-center gap-0.5 rounded px-1 py-0.5",
              trend === 'up' ? 'bg-green-100 text-green-700' : 
              trend === 'down' ? 'bg-red-100 text-red-700' : 
              'bg-gray-100 text-gray-700'
            )}>
              {trendIcon}
              <span>{Math.abs(changeValue)}%</span>
            </div>
            <span className="text-xs text-muted-foreground ml-1.5">vs. last week</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface MetricsRowProps {
  metrics: {
    title: string;
    value: number;
    max: number;
    icon: React.ReactNode;
    color: string;
  }[];
}

export const MetricsProgressRow: React.FC<MetricsRowProps> = ({ metrics }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
      {metrics.map((metric, i) => (
        <div 
          key={metric.title} 
          className="bg-card p-3 rounded-lg border shadow-sm"
        >
          <div className="flex justify-between items-center mb-1.5">
            <div className="flex items-center gap-1.5">
              <div className={cn("p-1.5 rounded-full", metric.color)}>
                {metric.icon}
              </div>
              <span className="text-sm font-medium">{metric.title}</span>
            </div>
            <span className="text-xl font-semibold">{metric.value}</span>
          </div>
          <Progress 
            value={(metric.value / metric.max) * 100} 
            className="h-2"
            indicatorClassName={metric.color.replace('bg-', 'bg-').replace('/10', '')}
          />
        </div>
      ))}
    </div>
  );
};

interface MetricSummaryCardProps {
  title: string;
  metrics: {
    label: string;
    value: number;
    prevValue?: number;
    icon: React.ReactNode;
    status?: 'success' | 'warning' | 'danger' | 'info';
  }[];
  className?: string;
}

export const MetricSummaryCard: React.FC<MetricSummaryCardProps> = ({
  title,
  metrics,
  className
}) => {
  const statusColors = {
    success: 'text-green-500',
    warning: 'text-yellow-500',
    danger: 'text-red-500',
    info: 'text-blue-500'
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-2">
        <CardTitle className="text-md">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {metrics.map((metric) => {
          const percentChange = metric.prevValue 
            ? ((metric.value - metric.prevValue) / metric.prevValue) * 100
            : 0;
          
          const trend = percentChange > 0 ? 'up' : percentChange < 0 ? 'down' : 'neutral';
          
          return (
            <div key={metric.label} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={cn(
                  "p-1.5 rounded-full",
                  metric.status ? `bg-${metric.status.replace('info', 'blue').replace('success', 'green').replace('warning', 'yellow').replace('danger', 'red')}-100` : 'bg-gray-100'
                )}>
                  {metric.icon}
                </div>
                <span className="text-sm">{metric.label}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold">{metric.value}</span>
                {metric.prevValue && (
                  <div className={cn(
                    "text-xs flex items-center gap-0.5",
                    trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
                  )}>
                    {trend === 'up' && <TrendingUp className="h-3 w-3" />}
                    {trend === 'down' && <TrendingDown className="h-3 w-3" />}
                    {trend === 'neutral' && <Check className="h-3 w-3" />}
                    <span>{Math.abs(percentChange).toFixed(1)}%</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}; 