import React, { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  AlertCircle, 
  CheckCircle, 
  Shield, 
  Thermometer, 
  Droplets, 
  Volume2, 
  Weight,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { resolveAlert, getAllAlerts, Alert } from '@/services/alertService';
import { useToast } from '@/components/ui/use-toast';

interface AlertsManagementProps {
  className?: string;
  onResolve?: () => void;
}

const getAlertIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'temperature':
      return <Thermometer className="h-4 w-4" />;
    case 'humidity':
      return <Droplets className="h-4 w-4" />;
    case 'sound':
      return <Volume2 className="h-4 w-4" />;
    case 'weight':
      return <Weight className="h-4 w-4" />;
    default:
      return <AlertCircle className="h-4 w-4" />;
  }
};

const getSeverityColor = (severity: string) => {
  switch (severity.toLowerCase()) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200';
    case 'warning':
      return 'bg-amber-100 text-amber-800 border-amber-200';
    case 'info':
      return 'bg-blue-100 text-blue-800 border-blue-200';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

const AlertsManagement: React.FC<AlertsManagementProps> = ({ className, onResolve }) => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [resolving, setResolving] = useState<Record<string, boolean>>({});
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchAlerts();

    // Set up an interval to refresh alerts every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      fetchAlerts(false); // Don't set loading to true for periodic refresh
    }, 30 * 1000);

    // Clean up interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  const fetchAlerts = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const data = await getAllAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      if (showLoading) { // Only show error toast for manual refreshes or initial load
        toast({
          variant: 'destructive',
          title: 'Error loading alerts',
          description: 'There was a problem loading your alerts. Please try again.',
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      setResolving(prev => ({ ...prev, [alertId]: true }));
      await resolveAlert(alertId);
      
      // Remove the alert from the list
      setAlerts(alerts.filter(alert => alert.id !== alertId));
      
      toast({
        title: 'Alert resolved',
        description: 'The alert has been marked as resolved.',
      });

      // Call the onResolve callback if provided
      if (onResolve) {
        onResolve();
      }
    } catch (error) {
      console.error('Error resolving alert:', error);
      toast({
        variant: 'destructive',
        title: 'Error resolving alert',
        description: 'There was a problem resolving this alert. Please try again.',
      });
    } finally {
      setResolving(prev => ({ ...prev, [alertId]: false }));
    }
  };

  const toggleExpand = (alertId: string) => {
    setExpanded(prev => ({ ...prev, [alertId]: !prev[alertId] }));
  };

  const handleRefresh = () => {
    fetchAlerts(true);
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5" />
            <span>Alerts</span>
          </CardTitle>
          <CardDescription>Manage your apiary and hive alerts</CardDescription>
        </CardHeader>
        <CardContent>
          {[1, 2, 3].map((i) => (
            <div key={i} className="mb-3 space-y-2">
              <div className="flex justify-between items-center">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-24" />
              </div>
              <Skeleton className="h-16 w-full" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5" />
          <span>Alerts</span>
          {alerts.length > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alerts.length}
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Manage your apiary and hive alerts</CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {alerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <Shield className="h-12 w-12 text-green-500 mb-2" />
            <h3 className="text-lg font-medium">All Clear</h3>
            <p className="text-muted-foreground">There are no active alerts that require your attention.</p>
          </div>
        ) : (
          <div className="divide-y">
            {alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      {getAlertIcon(alert.type)}
                      <span className="font-medium text-sm">
                        {alert.hive_name} • {format(new Date(alert.created_at), 'MMM d, h:mm a')}
                      </span>
                    </div>
                    <Badge className={`${getSeverityColor(alert.severity)} mb-2`}>
                      {alert.severity}
                    </Badge>
                    <p className="text-sm">{alert.message}</p>
                  </div>
                  <div className="flex items-center">
                    <Button
                      size="sm"
                      variant="outline"
                      className="mr-2"
                      onClick={() => toggleExpand(alert.id)}
                    >
                      {expanded[alert.id] ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </Button>
                    <Button
                      size="sm"
                      variant="default"
                      onClick={() => handleResolve(alert.id)}
                      disabled={resolving[alert.id]}
                    >
                      {resolving[alert.id] ? 'Resolving...' : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Resolve
                        </>
                      )}
                    </Button>
                  </div>
                </div>
                
                {expanded[alert.id] && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-3 pt-3 border-t text-sm"
                  >
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-muted-foreground">Apiary</p>
                        <p>{alert.apiary_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Hive</p>
                        <p>{alert.hive_name}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Type</p>
                        <p className="capitalize">{alert.type}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Created</p>
                        <p>{format(new Date(alert.created_at), 'PPP p')}</p>
                      </div>
                    </div>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="mt-3"
                      onClick={() => window.location.href = `/hives/${alert.hive_id}`}
                    >
                      View Hive Details
                    </Button>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleRefresh}
          disabled={loading}
        >
          Refresh
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = '/settings#alerts'}
        >
          Alert Settings
        </Button>
      </CardFooter>
    </Card>
  );
};

export default AlertsManagement; 