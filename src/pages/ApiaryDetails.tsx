import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Plus, MapPin, MoreHorizontal, Pencil, Trash2, AlertCircle, Loader2 } from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import HiveMetricsCard from '@/components/dashboard/HiveMetricsCard';
import { getApiaryById, updateApiary, deleteApiary } from '@/services/apiaryService';
import { getHivesByApiary, addHive as addHiveService } from '@/services/hiveService';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from '@/components/ui/use-toast';
import AddHiveModal from '@/components/dashboard/AddHiveModal';
import EditApiaryModal from '@/components/dashboard/EditApiaryModal';
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

const ApiaryDetails = () => {
  const { id } = useParams<{ id: string }>();
  const [apiary, setApiary] = useState<any>(null);
  const [hives, setHives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [addHiveModalOpen, setAddHiveModalOpen] = useState(false);
  const [editApiaryModalOpen, setEditApiaryModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();
  
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        if (id) {
          // Load apiary details
          const apiaryData = await getApiaryById(id);
          if (apiaryData) {
            setApiary(apiaryData);
            
            // Load hives for this apiary
            const hivesData = await getHivesByApiary(id);
            setHives(hivesData);
          }
        }
      } catch (error) {
        console.error('Error loading apiary details:', error);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "There was a problem loading the apiary details. Please try again.",
        });
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [id, toast]);
  
  if (loading) {
    return (
      <div className="container max-w-7xl pt-16 md:pt-8 pb-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading apiary details...</p>
        </div>
      </div>
    );
  }
  
  if (!apiary) {
    return (
      <div className="container max-w-7xl pt-16 md:pt-8 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center min-h-[60vh]">
        <h2 className="text-2xl font-bold mb-4">Apiary Not Found</h2>
        <p className="text-muted-foreground mb-6">The apiary you're looking for doesn't seem to exist.</p>
        <Link 
          to="/apiaries" 
          className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
        >
          Return to Apiaries
        </Link>
      </div>
    );
  }
  
  // Count hives with alerts
  const alertCount = hives.filter(hive => hive.alerts && hive.alerts.length > 0).length;
  
  const handleAddHive = async (hiveData: {
    name: string;
    hive_id: string;
    apiaryId: string;
    type: string;
    status: string;
    installation_date?: string;
    queen_type?: string;
    queen_introduced_date?: string;
    queen_marked?: boolean;
    queen_marking_color?: string;
    notes?: string;
  }) => {
    if (!id) return;

    try {
      setLoading(true);
      // Add the hive with the service
      await addHiveService(hiveData);
      
      // Reload hives for this apiary
      const updatedHives = await getHivesByApiary(id);
      setHives(updatedHives);
      
      toast({
        title: 'Success',
        description: 'Hive added successfully',
      });
      
      setAddHiveModalOpen(false);
    } catch (error) {
      console.error('Error adding hive:', error);
      // Get the error message if it exists
      const errorMessage = error instanceof Error ? error.message : 'Failed to add hive';
      
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEditApiary = async (data: { name: string; location: string }) => {
    if (!id || !apiary) return;
    
    try {
      setLoading(true);
      // Update apiary using service
      await updateApiary(id, data);
      
      // Update local state
      setApiary({
        ...apiary,
        name: data.name,
        location: data.location,
      });
      
      toast({
        title: 'Success',
        description: 'Apiary updated successfully',
      });
      
      setEditApiaryModalOpen(false);
    } catch (error) {
      console.error('Error updating apiary:', error);
      toast({
        title: 'Error',
        description: 'Failed to update apiary',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteApiary = async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      // Delete apiary using service
      await deleteApiary(id);
      
      toast({
        title: 'Success',
        description: 'Apiary deleted successfully',
      });
      
      // Navigate back to apiaries list
      navigate('/apiaries');
    } catch (error) {
      console.error('Error deleting apiary:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete apiary',
        variant: 'destructive',
      });
      setLoading(false);
    }
  };
  
  return (
    <PageTransition>
      <div className="container max-w-7xl pt-16 md:pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <Link to="/apiaries" className="inline-flex items-center text-muted-foreground hover:text-foreground mb-6">
          <ChevronLeft className="h-4 w-4 mr-1" />
          Back to Apiaries
        </Link>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight flex items-center gap-2"
            >
              {apiary.name}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8">
                    <MoreHorizontal className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setEditApiaryModalOpen(true)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit Apiary
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setDeleteDialogOpen(true)} 
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Apiary
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground mt-1 flex items-center"
            >
              <MapPin className="h-4 w-4 mr-1" /> {apiary.location}
              {alertCount > 0 && (
                <span className="ml-4 text-amber-600 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  {alertCount} {alertCount === 1 ? 'hive needs' : 'hives need'} attention
                </span>
              )}
            </motion.p>
          </div>
          
          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setAddHiveModalOpen(true)}
              className="bg-primary text-primary-foreground flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
              disabled={loading}
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Plus className="h-4 w-4" />
              )}
              Add Hive
            </motion.button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="metric-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Temperature</h3>
            <div className="text-2xl font-bold">
              {apiary.avgTemperature.toFixed(1)} °C
            </div>
            <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-blue-500 via-green-500 to-red-500 rounded-full"
                style={{ width: `${(apiary.avgTemperature / 40) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="metric-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Humidity</h3>
            <div className="text-2xl font-bold">
              {apiary.avgHumidity.toFixed(0)} %
            </div>
            <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${apiary.avgHumidity}%` }}
              />
            </div>
          </div>
          
          <div className="metric-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Sound Level</h3>
            <div className="text-2xl font-bold">
              {apiary.avgSound.toFixed(0)} dB
            </div>
            <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-purple-500 rounded-full"
                style={{ width: `${(apiary.avgSound / 80) * 100}%` }}
              />
            </div>
          </div>
          
          <div className="metric-card p-5">
            <h3 className="text-sm font-medium text-muted-foreground mb-1">Average Weight</h3>
            <div className="text-2xl font-bold">
              {apiary.avgWeight.toFixed(1)} kg
            </div>
            <div className="mt-2 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${(apiary.avgWeight / 60) * 100}%` }}
              />
            </div>
          </div>
        </div>
        
        {hives.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="bg-muted/30 p-4 rounded-full mb-4">
              <Plus className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-medium mb-2">No Hives Yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              This apiary doesn't have any hives yet. Add your first hive to start monitoring.
            </p>
            <Button onClick={() => setAddHiveModalOpen(true)}>
              Add Your First Hive
            </Button>
          </div>
        ) : (
          <div>
            <h2 className="text-xl font-semibold mb-6">Hives in {apiary.name}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {hives.map((hive) => (
                <HiveMetricsCard
                  key={hive.hive_id}
                  id={hive.hive_id}
                  name={hive.name}
                  apiaryId={hive.apiary_id}
                  apiaryName={apiary.name}
                  metrics={hive.metrics}
                  alerts={hive.alerts}
                />
              ))}
            </div>
          </div>
        )}
      </div>
      
      <AddHiveModal 
        isOpen={addHiveModalOpen} 
        onClose={() => setAddHiveModalOpen(false)} 
        onAdd={handleAddHive} 
      />
      
      <EditApiaryModal
        isOpen={editApiaryModalOpen}
        onClose={() => setEditApiaryModalOpen(false)}
        onEdit={handleEditApiary}
        apiary={apiary}
      />
      
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the apiary
              "{apiary.name}" and all of its data, including all hives, inspections, 
              and measurements associated with it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteApiary}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Apiary
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PageTransition>
  );
};

export default ApiaryDetails;
