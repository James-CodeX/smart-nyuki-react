import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Thermometer, Droplets, Volume2, Weight, 
  AlertTriangle, BellRing, BellOff, Tag, Box, 
  Crown, CalendarClock, StickyNote, Info,
  MoreHorizontal, Pencil, Trash2
} from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { getHiveById } from '@/utils/mockData';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import EditHiveModal from '@/components/dashboard/EditHiveModal';

// Components for detailed metric view
const DetailedMetricCard = ({ title, value, unit, data, color, icon: Icon, range, status }: any) => {
  // Create a unique, safe ID for the gradient that doesn't contain spaces
  const gradientId = `grad-${title.toLowerCase().replace(/\s+/g, '-')}`;
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="metric-card p-6"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${color}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium">{title}</h3>
            <p className="text-muted-foreground text-sm">Current Reading</p>
          </div>
        </div>
        <div className="text-3xl font-bold">
          {value} <span className="text-lg font-normal text-muted-foreground">{unit}</span>
        </div>
      </div>
      
      <div className="relative h-2 bg-secondary rounded-full mb-2 overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full ${color} rounded-full`}
          style={{ 
            width: `${((parseFloat(value) - range[0]) / (range[1] - range[0])) * 100}%` 
          }}
        />
      </div>
      
      <div className="flex justify-between text-xs text-muted-foreground">
        <span>{range[0]} {unit}</span>
        <span>{range[1]} {unit}</span>
      </div>
      
      <div className="mt-4">
        <div className={`text-sm font-medium ${status.color}`}>
          {status.label}
        </div>
        <p className="text-xs text-muted-foreground mt-1">{status.description}</p>
      </div>
      
      <div className="mt-4">
        <h4 className="text-sm font-medium mb-2">Last 24 Hours</h4>
        <div className="h-28 w-full">
          <svg viewBox="0 0 100 40" className="w-full h-full" preserveAspectRatio="none">
            {/* Background grid lines */}
            <line x1="0" y1="0" x2="100" y2="0" stroke="currentColor" strokeWidth="0.1" strokeOpacity="0.2" />
            <line x1="0" y1="13" x2="100" y2="13" stroke="currentColor" strokeWidth="0.1" strokeOpacity="0.2" />
            <line x1="0" y1="26" x2="100" y2="26" stroke="currentColor" strokeWidth="0.1" strokeOpacity="0.2" />
            <line x1="0" y1="39" x2="100" y2="39" stroke="currentColor" strokeWidth="0.1" strokeOpacity="0.2" />
            
            {/* Create a gradient for the area under the line */}
            <defs>
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={color.includes('bg-') ? 
                  color.replace('bg-', '').includes('-') ? 
                    `var(--${color.replace('bg-', '')})` : 
                    color 
                  : color} 
                  stopOpacity="0.3" 
                />
                <stop offset="100%" stopColor={color.includes('bg-') ? 
                  color.replace('bg-', '').includes('-') ? 
                    `var(--${color.replace('bg-', '')})` : 
                    color 
                  : color} 
                  stopOpacity="0.05" 
                />
              </linearGradient>
            </defs>
            
            {/* Area under the line */}
            <path
              d={`
                M0,${40 - ((data[0].value - range[0]) / (range[1] - range[0])) * 40}
                ${data.map((point: any, index: number) => {
                  const x = (index / (data.length - 1)) * 100;
                  const y = 40 - ((point.value - range[0]) / (range[1] - range[0])) * 40;
                  return `L${x},${y}`;
                }).join(' ')}
                L100,40 L0,40 Z
              `}
              fill={`url(#${gradientId})`}
              strokeWidth="0"
            />
            
            {/* Data line */}
            <path
              d={`
                M0,${40 - ((data[0].value - range[0]) / (range[1] - range[0])) * 40}
                ${data.map((point: any, index: number) => {
                  const x = (index / (data.length - 1)) * 100;
                  const y = 40 - ((point.value - range[0]) / (range[1] - range[0])) * 40;
                  return `L${x},${y}`;
                }).join(' ')}
              `}
              fill="none"
              className={color.replace('bg-', 'stroke-')}
              strokeWidth="1.5"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            
            {/* Data points - only show a few key points */}
            {data.map((point: any, index: number) => {
              // Only show first, last and some points in between to avoid overcrowding
              if (index === 0 || index === data.length - 1 || index % 8 === 4) {
                const x = (index / (data.length - 1)) * 100;
                const y = 40 - ((point.value - range[0]) / (range[1] - range[0])) * 40;
                
                return (
                  <g key={index}>
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="2.5" 
                      fill="white"
                    />
                    <circle 
                      cx={x} 
                      cy={y} 
                      r="1.5" 
                      className={color.replace('bg-', 'fill-')}
                    />
                  </g>
                );
              }
              return null;
            })}
          </svg>
        </div>
        
        {/* Time indicators */}
        <div className="flex justify-between mt-1 text-xs text-muted-foreground">
          <span>24h ago</span>
          <span>12h ago</span>
          <span>Now</span>
        </div>
      </div>
    </motion.div>
  );
};

const HiveDetails = () => {
  const { apiaryId, hiveId } = useParams<{ apiaryId: string; hiveId: string }>();
  const [hive, setHive] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [alertsEnabled, setAlertsEnabled] = useState(true);
  const [editHiveModalOpen, setEditHiveModalOpen] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    if (apiaryId && hiveId) {
      const hiveData = getHiveById(apiaryId, hiveId);
      setHive(hiveData);
      setLoading(false);
    }
  }, [apiaryId, hiveId]);
  
  const toggleAlerts = () => {
    setAlertsEnabled(!alertsEnabled);
    toast({
      title: alertsEnabled ? 'Alerts Disabled' : 'Alerts Enabled',
      description: alertsEnabled 
        ? 'You will no longer receive notifications for this hive.' 
        : 'You will now receive notifications for this hive.',
    });
  };

  const handleEditHive = async (data: any) => {
    if (!apiaryId || !hiveId || !hive) return;
    
    // In a real application, you would update the hive with an API call here
    // For now, we'll just update the local state
    try {
      // Simulating API call
      // await updateHive(apiaryId, hiveId, data);
      
      // Update local state
      setHive({
        ...hive,
        name: data.name,
        hiveType: data.hiveType,
        queenAge: data.queenAge,
        installationDate: data.installationDate.toISOString(),
        notes: data.notes,
      });
      
      toast({
        title: 'Success',
        description: 'Hive updated successfully',
      });
    } catch (error) {
      console.error('Error updating hive:', error);
      toast({
        title: 'Error',
        description: 'Failed to update hive',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteHive = () => {
    // This would be implemented with a confirmation dialog and API call
    toast({
      title: 'Not Implemented',
      description: 'Delete functionality is not yet implemented',
    });
  };
  
  if (loading) {
    return (
      <div className="container max-w-7xl pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[60vh]">
        <div className="h-16 w-16 rounded-full border-4 border-primary/30 border-t-primary animate-spin" />
      </div>
    );
  }
  
  if (!hive) {
    return (
      <div className="container max-w-7xl pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Hive Not Found</h2>
        <p className="text-muted-foreground mb-6">The hive you're looking for doesn't seem to exist.</p>
        <Link 
          to="/" 
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
        >
          Return to Dashboard
        </Link>
      </div>
    );
  }
  
  // Get current values
  const currentTemp = hive.metrics.temperature[hive.metrics.temperature.length - 1].value;
  const currentHumidity = hive.metrics.humidity[hive.metrics.humidity.length - 1].value;
  const currentSound = hive.metrics.sound[hive.metrics.sound.length - 1].value;
  const currentWeight = hive.metrics.weight[hive.metrics.weight.length - 1].value;
  
  // Determine status for each metric
  const tempStatus = currentTemp > 36 
    ? { label: "Too Hot", color: "text-red-500", description: "The hive temperature is higher than optimal. Consider ventilation measures." }
    : currentTemp < 32
      ? { label: "Too Cold", color: "text-blue-500", description: "The hive temperature is lower than optimal. Check for proper insulation." }
      : { label: "Optimal", color: "text-green-500", description: "The hive temperature is within optimal range." };
  
  const humidityStatus = currentHumidity > 65
    ? { label: "Too Humid", color: "text-blue-500", description: "Humidity is higher than optimal. Monitor for potential mold growth." }
    : currentHumidity < 40
      ? { label: "Too Dry", color: "text-yellow-500", description: "Humidity is lower than optimal. Nectar curing may be too rapid." }
      : { label: "Optimal", color: "text-green-500", description: "The humidity level is within optimal range." };
  
  const soundStatus = currentSound > 60
    ? { label: "Elevated Activity", color: "text-orange-500", description: "Sound levels indicate higher than normal activity. Check for swarming preparations." }
    : currentSound < 25
      ? { label: "Low Activity", color: "text-blue-500", description: "Sound levels are lower than normal. This could indicate low colony strength." }
      : { label: "Normal Activity", color: "text-green-500", description: "Sound levels indicate normal colony activity." };
  
  const weightStatus = currentWeight < 40
    ? { label: "Low Resources", color: "text-red-500", description: "Hive weight is low. Check honey stores and consider feeding." }
    : { label: "Sufficient Resources", color: "text-green-500", description: "Hive weight indicates sufficient resources." };
  
  // Format installation date if it exists
  const formattedInstallationDate = hive.installationDate 
    ? format(new Date(hive.installationDate), 'PPP') 
    : 'Not recorded';
  
  return (
    <PageTransition>
      <div className="container max-w-7xl pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <Link to={`/apiaries/${apiaryId}`} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to {hive.apiaryName}
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex items-center gap-2"
            >
              <h1 className="text-3xl font-bold tracking-tight">{hive.name}</h1>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditHiveModalOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Hive
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={handleDeleteHive} 
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Hive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              {hive.alerts && hive.alerts.length > 0 && (
                <div className="bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium flex items-center">
                  <AlertTriangle className="h-4 w-4 mr-1" />
                  {hive.alerts.length} {hive.alerts.length === 1 ? 'Alert' : 'Alerts'}
                </div>
              )}
            </motion.div>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground mt-1"
            >
              Monitoring data and analytics
            </motion.p>
          </div>
          
          <Button
            variant={alertsEnabled ? "default" : "outline"}
            size="sm"
            onClick={toggleAlerts}
            className="gap-2"
          >
            {alertsEnabled ? (
              <>
                <BellRing className="h-4 w-4" />
                Alerts On
              </>
            ) : (
              <>
                <BellOff className="h-4 w-4" />
                Alerts Off
              </>
            )}
          </Button>
        </div>
        
        <Tabs defaultValue="metrics" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8">
            <TabsTrigger value="metrics">Metrics & Analytics</TabsTrigger>
            <TabsTrigger value="details">Hive Details</TabsTrigger>
          </TabsList>
          
          <TabsContent value="metrics">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
              <DetailedMetricCard
                title="Temperature"
                value={currentTemp.toFixed(1)}
                unit="°C"
                data={hive.metrics.temperature}
                color="bg-orange-500"
                icon={Thermometer}
                range={[28, 40]}
                status={tempStatus}
              />
              
              <DetailedMetricCard
                title="Humidity"
                value={currentHumidity.toFixed(1)}
                unit="%"
                data={hive.metrics.humidity}
                color="bg-blue-500"
                icon={Droplets}
                range={[30, 80]}
                status={humidityStatus}
              />
              
              <DetailedMetricCard
                title="Sound Level"
                value={currentSound.toFixed(1)}
                unit="dB"
                data={hive.metrics.sound}
                color="bg-purple-500"
                icon={Volume2}
                range={[20, 80]}
                status={soundStatus}
              />
              
              <DetailedMetricCard
                title="Weight"
                value={currentWeight.toFixed(1)}
                unit="kg"
                data={hive.metrics.weight}
                color="bg-green-500"
                icon={Weight}
                range={[30, 80]}
                status={weightStatus}
              />
            </div>

            {hive.alerts && hive.alerts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h2 className="text-xl font-bold mb-4 flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                  Active Alerts
                </h2>
                
                <div className="space-y-3">
                  {hive.alerts.map((alert: any, index: number) => (
                    <div key={index} className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <div className="font-medium text-amber-800">{alert.type}</div>
                      <div className="text-amber-700 text-sm mt-1">{alert.message}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </TabsContent>
          
          <TabsContent value="details">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Info className="h-5 w-5 mr-2 text-primary" />
                    General Information
                  </CardTitle>
                  <CardDescription>Basic details about this hive</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <Tag className="h-5 w-5 mr-3 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Node ID</div>
                      <div className="text-sm text-muted-foreground">
                        {hive.node_id || 'Not assigned'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <Box className="h-5 w-5 mr-3 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Hive Type</div>
                      <div className="text-sm text-muted-foreground">
                        {hive.hiveType || 'Not specified'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <CalendarClock className="h-5 w-5 mr-3 text-muted-foreground shrink-0 mt-0.5" />
                    <div>
                      <div className="font-medium">Installation Date</div>
                      <div className="text-sm text-muted-foreground">
                        {formattedInstallationDate}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Crown className="h-5 w-5 mr-2 text-primary" />
                    Queen Information
                  </CardTitle>
                  <CardDescription>Details about the queen bee</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start">
                    <div className="h-5 w-5 mr-3 shrink-0" />
                    <div>
                      <div className="font-medium">Queen Age</div>
                      <div className="text-sm text-muted-foreground">
                        {hive.queenAge ? `${hive.queenAge} ${parseInt(hive.queenAge) === 1 ? 'year' : 'years'}` : 'Not recorded'}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-start">
                    <div className="h-5 w-5 mr-3 shrink-0" />
                    <div>
                      <div className="font-medium">Expected Replacement</div>
                      <div className="text-sm text-muted-foreground">
                        {hive.queenAge && parseInt(hive.queenAge) > 2 
                          ? 'Recommended within this season'
                          : 'Not needed soon'}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              {hive.notes && (
                <Card className="md:col-span-2">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <StickyNote className="h-5 w-5 mr-2 text-primary" />
                      Notes
                    </CardTitle>
                    <CardDescription>Additional information about this hive</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm whitespace-pre-wrap">
                      {hive.notes}
                    </div>
                  </CardContent>
                </Card>
              )}
            </motion.div>
          </TabsContent>
        </Tabs>
        
        <EditHiveModal
          isOpen={editHiveModalOpen}
          onClose={() => setEditHiveModalOpen(false)}
          onEdit={handleEditHive}
          hive={{
            id: hive.id,
            name: hive.name,
            hiveType: hive.hiveType || '',
            queenAge: hive.queenAge || 0,
            installationDate: hive.installationDate || new Date().toISOString(),
            notes: hive.notes || '',
          }}
        />
      </div>
    </PageTransition>
  );
};

export default HiveDetails;
