import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatisticsCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  change?: {
    value: number;
    trend: 'up' | 'down' | 'neutral';
  };
  description?: string;
  className?: string;
}

const StatisticsCard: React.FC<StatisticsCardProps> = ({
  title,
  value,
  icon,
  change,
  description,
  className
}) => {
  return (
    <Card className={cn("overflow-hidden", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="p-2 bg-muted rounded-full">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        
        {change && (
          <div className="flex items-center space-x-2 mt-1">
            <div className={cn(
              "flex items-center",
              change.trend === 'up' ? 'text-green-600' : 
              change.trend === 'down' ? 'text-red-600' : 
              'text-muted-foreground'
            )}>
              {change.trend === 'up' && <ArrowUpRight className="h-4 w-4 mr-1" />}
              {change.trend === 'down' && <ArrowDownRight className="h-4 w-4 mr-1" />}
              {change.trend === 'neutral' && <Minus className="h-4 w-4 mr-1" />}
              
              <span className="text-sm font-medium">
                {change.value}%
              </span>
            </div>
            {description && (
              <span className="text-xs text-muted-foreground">{description}</span>
            )}
          </div>
        )}
        
        {!change && description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
      </CardContent>
    </Card>
  );
};

export default StatisticsCard; 