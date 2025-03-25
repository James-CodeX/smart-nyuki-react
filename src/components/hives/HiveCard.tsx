import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Thermometer, 
  Droplets, 
  Volume2, 
  Weight, 
  AlertCircle 
} from 'lucide-react';
import { HiveWithDetails } from '@/services/hiveService';
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

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
  const latestTemp = metrics.temperature.length > 0 
    ? metrics.temperature[metrics.temperature.length - 1].value 
    : null;
  
  const latestHumidity = metrics.humidity.length > 0 
    ? metrics.humidity[metrics.humidity.length - 1].value 
    : null;
  
  const latestWeight = metrics.weight.length > 0 
    ? metrics.weight[metrics.weight.length - 1].value 
    : null;
  
  // Get the last 10 temperature readings for graph - handle both time and timestamp formats
  const tempData = metrics.temperature
    .slice(-10)
    .map(item => {
      const timeString = hasTimestamp(item) ? item.timestamp : item.time;
      return {
        time: new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: item.value
      };
    });

  // Get the last 10 weight readings for graph - handle both time and timestamp formats
  const weightData = metrics.weight
    .slice(-10)
    .map(item => {
      const timeString = hasTimestamp(item) ? item.timestamp : item.time;
      return {
        time: new Date(timeString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        value: item.value
      };
    });
  
  const hasAlerts = hive.alerts && hive.alerts.length > 0;

  // Format for tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-2 border border-gray-200 rounded shadow text-xs">
          <p>{`${label}: ${payload[0].value.toFixed(1)}`}</p>
        </div>
      );
    }
    return null;
  };

  // Get latest time for "updated" timestamp
  const getLatestUpdateTime = () => {
    if (metrics.temperature.length === 0) return 'Never';
    
    const latestItem = metrics.temperature[0];
    const timeString = hasTimestamp(latestItem) ? latestItem.timestamp : latestItem.time;
    return new Date(timeString).toLocaleString();
  };

  return (
    <Card 
      className={`overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${hasAlerts ? 'border-red-300' : ''}`}
      onClick={onClick}
    >
      <CardContent className="p-0">
        <div className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className="text-lg font-semibold">{hive.name}</h3>
              <p className="text-sm text-muted-foreground">{hive.apiaryName}</p>
            </div>
            {hasAlerts && (
              <Badge variant="destructive" className="flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                {hive.alerts.length}
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 mb-2">
            <Badge variant="outline">{hive.type}</Badge>
            <Badge variant="secondary">{hive.status}</Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-2">
            <div className="flex flex-col">
              <div className="flex items-center mb-1">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 mr-2">
                  <Thermometer className="h-3 w-3 text-red-600" />
                </div>
                <span className="text-sm font-medium">
                  {latestTemp !== null ? `${latestTemp.toFixed(1)}°C` : 'N/A'}
                </span>
              </div>
              <div className="h-16 w-full">
                {tempData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={tempData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 3 }}
                        isAnimationActive={false}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                    No data
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex flex-col">
              <div className="flex items-center mb-1">
                <div className="flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 mr-2">
                  <Weight className="h-3 w-3 text-amber-600" />
                </div>
                <span className="text-sm font-medium">
                  {latestWeight !== null ? `${latestWeight.toFixed(1)} kg` : 'N/A'}
                </span>
              </div>
              <div className="h-16 w-full">
                {weightData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={weightData} margin={{ top: 5, right: 5, bottom: 5, left: 5 }}>
                      <XAxis dataKey="time" hide />
                      <YAxis hide domain={['auto', 'auto']} />
                      <Tooltip content={<CustomTooltip />} />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="#d97706"
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 3 }}
                        isAnimationActive={false}
                        connectNulls
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-xs text-muted-foreground">
                    No data
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className="text-xs text-muted-foreground text-right">
            Updated: {getLatestUpdateTime()}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default HiveCard; 