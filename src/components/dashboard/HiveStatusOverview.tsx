import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CircleCheck, AlertCircle, HelpCircle, Thermometer, Droplets, Volume2, Weight } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

interface HiveStatusProps {
  hives: {
    id: string;
    name: string;
    apiaryName: string;
    alerts: {
      type: string;
      message: string;
    }[];
    metrics: {
      temperature: { time: string; value: number }[];
      humidity: { time: string; value: number }[];
      sound: { time: string; value: number }[];
      weight: { time: string; value: number }[];
    };
  }[];
  className?: string;
  onViewHive?: (hiveId: string) => void;
}

const HiveStatusOverview: React.FC<HiveStatusProps> = ({
  hives,
  className,
  onViewHive
}) => {
  const getStatusIcon = (alertCount: number) => {
    if (alertCount > 0) return <AlertCircle className="h-4 w-4 text-red-500" />;
    return <CircleCheck className="h-4 w-4 text-green-500" />;
  };

  const getMetricStatus = (type: string, value: number) => {
    switch (type) {
      case 'temperature':
        if (value > 37) return 'bg-red-500';
        if (value < 32) return 'bg-blue-500';
        return 'bg-green-500';
      case 'humidity':
        if (value > 70) return 'bg-blue-500';
        if (value < 35) return 'bg-yellow-500';
        return 'bg-green-500';
      case 'sound':
        if (value > 65) return 'bg-red-500';
        if (value < 30) return 'bg-yellow-500';
        return 'bg-green-500';
      case 'weight':
        // Weight doesn't typically have critical values
        return 'bg-blue-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Get the latest metric value
  const getLatestMetric = (metrics: { time: string; value: number }[]) => {
    return metrics.length > 0 ? metrics[metrics.length - 1].value : 0;
  };

  // Calculate percentage for temperature (assuming normal range is 32-37°C)
  const getTempPercentage = (value: number) => {
    const min = 25;
    const max = 40;
    const percentage = ((value - min) / (max - min)) * 100;
    return Math.min(100, Math.max(0, percentage));
  };

  // Calculate percentage for humidity (assuming normal range is 35-70%)
  const getHumidityPercentage = (value: number) => {
    const min = 0;
    const max = 100;
    const percentage = ((value - min) / (max - min)) * 100;
    return Math.min(100, Math.max(0, percentage));
  };

  // Calculate percentage for sound (assuming normal range is 30-65 dB)
  const getSoundPercentage = (value: number) => {
    const min = 0;
    const max = 80;
    const percentage = ((value - min) / (max - min)) * 100;
    return Math.min(100, Math.max(0, percentage));
  };

  return (
    <Card className={className}>
      <CardHeader className="pb-3">
        <CardTitle className="text-md">Hive Status Overview</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[290px]">
          <div className="divide-y">
            {hives.map((hive) => {
              const temperature = getLatestMetric(hive.metrics.temperature);
              const humidity = getLatestMetric(hive.metrics.humidity);
              const sound = getLatestMetric(hive.metrics.sound);
              
              return (
                <div 
                  key={hive.id} 
                  className="p-4 hover:bg-muted/20 transition-colors cursor-pointer"
                  onClick={() => onViewHive?.(hive.id)}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <h4 className="text-sm font-medium flex items-center gap-1.5">
                        {getStatusIcon(hive.alerts.length)}
                        {hive.name}
                      </h4>
                      <p className="text-xs text-muted-foreground">
                        {hive.apiaryName}
                      </p>
                    </div>
                    <div className="text-xs">
                      {hive.alerts.length > 0 ? (
                        <span className="text-red-500 font-medium">
                          {hive.alerts.length} Alert{hive.alerts.length !== 1 ? 's' : ''}
                        </span>
                      ) : (
                        <span className="text-green-500 font-medium">Healthy</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-1">
                      <div className="flex items-center gap-1">
                        <Thermometer className="h-3 w-3 text-red-500" />
                        <span className="text-xs">{temperature.toFixed(1)}°C</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Droplets className="h-3 w-3 text-blue-500" />
                        <span className="text-xs">{humidity.toFixed(1)}%</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Volume2 className="h-3 w-3 text-purple-500" />
                        <span className="text-xs">{sound.toFixed(1)} dB</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium">Temperature</span>
                        </div>
                        <Progress 
                          value={getTempPercentage(temperature)}
                          className="h-1"
                          indicatorClassName={getMetricStatus('temperature', temperature)}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium">Humidity</span>
                        </div>
                        <Progress 
                          value={getHumidityPercentage(humidity)}
                          className="h-1"
                          indicatorClassName={getMetricStatus('humidity', humidity)}
                        />
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-medium">Sound Level</span>
                        </div>
                        <Progress 
                          value={getSoundPercentage(sound)}
                          className="h-1"
                          indicatorClassName={getMetricStatus('sound', sound)}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default HiveStatusOverview; 