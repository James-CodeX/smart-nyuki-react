import logger from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import { Thermometer, Droplets, Volume2, Weight, ArrowRight, Settings } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { useToast } from '@/components/ui/use-toast';
import { getAlertThresholds, AlertThresholds } from '@/services/settingsService';

interface AlertThresholdsCardProps {
  className?: string;
}

const AlertThresholdsCard: React.FC<AlertThresholdsCardProps> = ({ className }) => {
  const [thresholds, setThresholds] = useState<AlertThresholds | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const { toast } = useToast();

  useEffect(() => {
    const fetchThresholds = async () => {
      try {
        setLoading(true);
        const data = await getAlertThresholds();
        setThresholds(data);
      } catch (error) {
        logger.error('Error fetching alert thresholds:', error);
        toast({
          variant: 'destructive',
          title: 'Error loading thresholds',
          description: 'Failed to load your alert thresholds.',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchThresholds();
  }, [toast]);

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <span>Alert Thresholds</span>
          </CardTitle>
          <CardDescription>Current alert threshold settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex justify-between items-center">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </CardContent>
        <CardFooter>
          <Skeleton className="h-9 w-full" />
        </CardFooter>
      </Card>
    );
  }

  if (!thresholds) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            <span>Alert Thresholds</span>
          </CardTitle>
          <CardDescription>No thresholds configured</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            You haven't set any alert thresholds yet. Configure them in settings.
          </p>
        </CardContent>
        <CardFooter>
          <Button asChild className="w-full">
            <Link to="/settings">Configure Thresholds</Link>
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          <span>Alert Thresholds</span>
        </CardTitle>
        <CardDescription>Alerts trigger when metrics exceed these values</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Thermometer className="h-4 w-4 text-orange-500" />
            <span className="text-sm font-medium">Temperature</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{thresholds.temperature_min}°C</span>
            <ArrowRight className="h-3 w-3" />
            <span>{thresholds.temperature_max}°C</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Droplets className="h-4 w-4 text-blue-500" />
            <span className="text-sm font-medium">Humidity</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{thresholds.humidity_min}%</span>
            <ArrowRight className="h-3 w-3" />
            <span>{thresholds.humidity_max}%</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-purple-500" />
            <span className="text-sm font-medium">Sound</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{thresholds.sound_min} dB</span>
            <ArrowRight className="h-3 w-3" />
            <span>{thresholds.sound_max} dB</span>
          </div>
        </div>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Weight className="h-4 w-4 text-green-500" />
            <span className="text-sm font-medium">Weight</span>
          </div>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <span>{thresholds.weight_min} kg</span>
            <ArrowRight className="h-3 w-3" />
            <span>{thresholds.weight_max} kg</span>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" asChild className="w-full">
          <Link to="/settings">Adjust Thresholds</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AlertThresholdsCard; 