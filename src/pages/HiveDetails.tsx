import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, Thermometer, Droplets, Volume2, Weight, 
  AlertTriangle, BellRing, BellOff, Tag, Box, 
  Crown, CalendarClock, StickyNote, Info,
  MoreHorizontal, Pencil, Trash2, AlertCircle, ClipboardList, ChevronRight, Loader2
} from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { getHiveById, updateHive, deleteHive } from '@/services/hiveService';
import EditHiveModal from '@/components/dashboard/EditHiveModal';

// Components for detailed metric view
const DetailedMetricCard = ({ title, value, unit, gradient, status, className = '' }: {
  title: string;
  value: number | any;
  unit: string;
  gradient: string;
  status: 'normal' | 'warning' | 'critical' | null;
  className?: string;
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return 'bg-destructive text-destructive-foreground';
      case 'warning':
        return 'bg-amber-500 text-white';
      default:
        return 'bg-green-500 text-white';
    }
  };
  
  // Ensure value is a number before using toFixed
  const displayValue = typeof value === 'number' ? value : 0;
  
  return (
    <motion.div 
      className={`rounded-xl overflow-hidden ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="relative">
        <div className={`absolute top-0 left-0 w-full h-1 ${gradient}`} />
        <div className="px-6 pt-6 pb-8">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">{title}</h3>
          <div className="flex items-end justify-between">
            <div className="text-3xl font-bold">
              {displayValue.toFixed(1)}<span className="text-lg ml-1">{unit}</span>
            </div>
            {status && (
              <div className={`py-1 px-2 rounded-md text-xs font-medium ${getStatusColor()}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </div>
            )}
          </div>
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
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadHive = async () => {
      try {
        setLoading(true);
        if (hiveId) {
          const hiveData = await getHiveById(hiveId);
          if (hiveData) {
            setHive(hiveData);
            // Set initial alerts state based on hive data
            setAlertsEnabled(hiveData.alerts_enabled ?? true);
          }
        }
      } catch (error) {
        console.error('Error loading hive details:', error);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "There was a problem loading the hive details. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadHive();
  }, [hiveId, toast]);
  
  const toggleAlerts = async () => {
    if (!hive) return;
    
    const newAlertsState = !alertsEnabled;
    
    try {
      setLoading(true);
      // Update the hive alerts state in the database
      await updateHive(hive.id, { alerts_enabled: newAlertsState });
      
      // Update local state
      setAlertsEnabled(newAlertsState);
      setHive({ ...hive, alerts_enabled: newAlertsState });
      
      toast({
        title: newAlertsState ? 'Alerts Enabled' : 'Alerts Disabled',
        description: newAlertsState 
          ? 'You will now receive notifications for this hive.' 
          : 'You will no longer receive notifications for this hive.',
      });
    } catch (error) {
      console.error('Error toggling alerts:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update alert settings.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleEditHive = async (data: any) => {
    if (!hive) return;
    
    try {
      setLoading(true);
      // Update the hive in the database
      await updateHive(hive.id, data);
      
      // Get updated hive data
      const updatedHive = await getHiveById(hive.id);
      setHive(updatedHive);
      
      toast({
        title: 'Success',
        description: 'Hive updated successfully',
      });
      
      setEditModalOpen(false);
    } catch (error) {
      console.error('Error updating hive:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update hive details.",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleDeleteHive = async () => {
    if (!hive || !apiaryId) return;
    
    try {
      setLoading(true);
      // Delete the hive from the database
      await deleteHive(hive.id);
      
      toast({
        title: 'Success',
        description: 'Hive deleted successfully',
      });
      
      // Navigate back to apiary details page
      navigate(`/apiaries/${apiaryId}`);
    } catch (error) {
      console.error('Error deleting hive:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete hive.",
      });
      setLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="container max-w-7xl pt-16 md:pt-8 pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading hive details...</p>
        </div>
      </div>
    );
  }
  
  if (!hive) {
    return (
      <div className="container max-w-7xl pt-16 md:pt-8 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Hive Not Found</h2>
        <p className="text-muted-foreground mb-6">The hive you're looking for doesn't seem to exist.</p>
        {apiaryId ? (
          <Link 
            to={`/apiaries/${apiaryId}`} 
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
          >
            Return to Apiary
          </Link>
        ) : (
          <Link 
            to="/apiaries" 
            className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
          >
            Return to Apiaries
          </Link>
        )}
      </div>
    );
  }
  
  return (
    <PageTransition>
      <div className="container max-w-7xl pt-16 md:pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <Link to={`/apiaries/${apiaryId}`} className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Apiary
        </Link>
        
        <div className="flex justify-between items-start mb-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight flex items-center gap-2"
            >
              {hive.name}
              {hive.status === 'needs_attention' && (
                <AlertCircle className="h-5 w-5 text-amber-500" />
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditModalOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Hive
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={toggleAlerts}>
                    {alertsEnabled ? (
                      <>
                        <BellOff className="mr-2 h-4 w-4" />
                        Disable Alerts
                      </>
                    ) : (
                      <>
                        <BellRing className="mr-2 h-4 w-4" />
                        Enable Alerts
                      </>
                    )}
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setDeleteDialogOpen(true)} 
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Hive
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground mt-1"
            >
              Status: <span className="font-medium">{hive.status ? hive.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Unknown'}</span>
              {hive.queen_type && (
                <> • Queen: <span className="font-medium">{hive.queen_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}</span></>
              )}
              {hive.installation_date && (
                <> • Installed: <span className="font-medium">{new Date(hive.installation_date).toLocaleDateString()}</span></>
              )}
            </motion.p>
          </div>
          
          <div className="flex gap-3">
            <Link to={`/apiaries/${apiaryId}/hives/${hiveId}/inspections`} className="inline-flex items-center justify-center gap-1 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 bg-secondary text-secondary-foreground hover:bg-secondary/80 h-10 px-4 py-2 rounded-md">
              <ClipboardList className="h-4 w-4 mr-1" />
              Inspections
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <DetailedMetricCard
            title="Temperature"
            value={typeof hive.metrics?.temperature === 'number' ? hive.metrics.temperature : 
                  Array.isArray(hive.metrics?.temperature) && hive.metrics.temperature.length > 0 ? 
                  hive.metrics.temperature[hive.metrics.temperature.length - 1].value : 0}
            unit="°C"
            gradient="bg-gradient-to-r from-blue-500 via-green-500 to-red-500"
            status={hive.metrics?.temperatureStatus || null}
          />
          
          <DetailedMetricCard
            title="Humidity"
            value={typeof hive.metrics?.humidity === 'number' ? hive.metrics.humidity : 
                  Array.isArray(hive.metrics?.humidity) && hive.metrics.humidity.length > 0 ? 
                  hive.metrics.humidity[hive.metrics.humidity.length - 1].value : 0}
            unit="%"
            gradient="bg-blue-500"
            status={hive.metrics?.humidityStatus || null}
          />
          
          <DetailedMetricCard
            title="Sound Level"
            value={typeof hive.metrics?.sound === 'number' ? hive.metrics.sound : 
                  Array.isArray(hive.metrics?.sound) && hive.metrics.sound.length > 0 ? 
                  hive.metrics.sound[hive.metrics.sound.length - 1].value : 0}
            unit="dB"
            gradient="bg-purple-500"
            status={hive.metrics?.soundStatus || null}
          />
          
          <DetailedMetricCard
            title="Weight"
            value={typeof hive.metrics?.weight === 'number' ? hive.metrics.weight : 
                  Array.isArray(hive.metrics?.weight) && hive.metrics.weight.length > 0 ? 
                  hive.metrics.weight[hive.metrics.weight.length - 1].value : 0}
            unit="kg"
            gradient="bg-amber-500"
            status={hive.metrics?.weightStatus || null}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Hive Information</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Type</p>
                <p className="text-md">{hive.type ? hive.type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Installation Date</p>
                <p className="text-md">{hive.installation_date ? new Date(hive.installation_date).toLocaleDateString() : 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Status</p>
                <p className="text-md">{hive.status ? hive.status.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Notes</p>
                <p className="text-md">{hive.notes || 'No notes'}</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">Queen Information</h2>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Queen Type</p>
                <p className="text-md">{hive.queen_type ? hive.queen_type.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()) : 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Queen Introduced</p>
                <p className="text-md">{hive.queen_introduced_date ? new Date(hive.queen_introduced_date).toLocaleDateString() : 'Not specified'}</p>
              </div>
              
              <div>
                <p className="text-sm font-medium text-muted-foreground">Queen Marked</p>
                <p className="text-md">{hive.queen_marked ? 'Yes' : 'No'}</p>
              </div>
              
              {hive.queen_marked && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Marking Color</p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-4 h-4 rounded-full" 
                      style={{ 
                        backgroundColor: hive.queen_marking_color === 'white' ? '#FFFFFF' :
                                        hive.queen_marking_color === 'yellow' ? '#F9E076' :
                                        hive.queen_marking_color === 'red' ? '#E54B4B' :
                                        hive.queen_marking_color === 'green' ? '#4CAF50' :
                                        hive.queen_marking_color === 'blue' ? '#2196F3' : '#CCCCCC',
                        border: hive.queen_marking_color === 'white' ? '1px solid #CCCCCC' : 'none'
                      }}
                    />
                    <span className="text-md capitalize">{hive.queen_marking_color || 'Not specified'}</span>
                  </div>
                </div>
              )}
            </div>
          </Card>
        </div>
        
        {hive.alerts && hive.alerts.length > 0 && (
          <div className="mb-10">
            <h2 className="text-xl font-semibold mb-4">Alerts</h2>
            
            <div className="space-y-3">
              {hive.alerts.map((alert: any, index: number) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className="flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-lg p-4"
                >
                  <AlertCircle className="h-5 w-5 text-amber-500 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="font-medium text-amber-800">{alert.title}</p>
                    <p className="text-sm text-amber-700">{alert.message}</p>
                  </div>
                  <div className="text-xs text-amber-600">
                    {alert.date ? new Date(alert.date).toLocaleDateString() : 'Today'}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </div>
      
      <EditHiveModal
        isOpen={editModalOpen}
        onClose={() => setEditModalOpen(false)}
        onEdit={handleEditHive}
        hive={hive}
      />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the hive
              "{hive.name}" and all of its data, including all inspections, alerts, 
              and measurements associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteHive}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Hive
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default HiveDetails;
