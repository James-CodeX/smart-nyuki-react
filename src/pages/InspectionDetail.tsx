import logger from '@/utils/logger';

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistance, parseISO, isPast, addDays } from 'date-fns';
import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Calendar,
  Crown,
  Bug,
  ThermometerSun,
  Droplets,
  CloudSun,
  Egg,
  Activity,
  HeartPulse,
  Weight,
  LayoutGrid,
  Users,
  Pill,
  StickyNote,
  Trash2,
  PenSquare,
  ExternalLink,
  ChevronLeft,
  Loader2,
  AlertTriangle,
  X,
  CheckCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from "@/components/ui/use-toast";
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { InspectionWithHiveDetails, getInspectionById, getInspectionFindings, InspectionFindings, updateInspection, deleteInspection } from '@/services/inspectionService';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';
import NewInspectionForm from '@/components/inspections/NewInspectionForm';

type InspectionStatus = 'completed' | 'scheduled' | 'overdue';

// Define the form validation schema for completing an inspection
const completeInspectionSchema = z.object({
  queen_seen: z.boolean().default(false),
  eggs_seen: z.boolean().default(false),
  larvae_seen: z.boolean().default(false),
  queen_cells_seen: z.boolean().default(false),
  disease_signs: z.boolean().default(false),
  disease_details: z.string().optional().nullable(),
  varroa_check: z.boolean().default(false),
  varroa_count: z.number().optional().nullable(),
  hive_strength: z.number().min(0).max(10).default(5),
  honey_stores: z.number().min(0).max(5).default(3),
  pollen_stores: z.number().min(0).max(5).default(3),
  notes: z.string().optional().nullable(),
});

type CompleteInspectionValues = z.infer<typeof completeInspectionSchema>;

const InspectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<InspectionWithHiveDetails | null>(null);
  const [findings, setFindings] = useState<InspectionFindings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingFindings, setLoadingFindings] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNewInspectionDialogOpen, setIsNewInspectionDialogOpen] = useState(false);

  // Initialize the form for completing inspections
  const completeForm = useForm<CompleteInspectionValues>({
    resolver: zodResolver(completeInspectionSchema),
    defaultValues: {
      queen_seen: false,
      eggs_seen: false,
      larvae_seen: false,
      queen_cells_seen: false,
      disease_signs: false,
      varroa_check: false,
      hive_strength: 5,
      honey_stores: 3,
      pollen_stores: 3,
    }
  });

  useEffect(() => {
    const fetchInspection = async () => {
      try {
        setLoading(true);
        if (!id) return;
        const data = await getInspectionById(id);
        setInspection(data);
        
        // Fetch findings after getting inspection
        setLoadingFindings(true);
        const findingsData = await getInspectionFindings(id);
        setFindings(findingsData);

        // If inspection has data filled in, pre-populate the form
        if (data) {
          completeForm.reset({
            queen_seen: data.queen_seen,
            eggs_seen: data.eggs_seen,
            larvae_seen: data.larvae_seen,
            queen_cells_seen: data.queen_cells_seen,
            disease_signs: data.disease_signs,
            disease_details: data.disease_details || '',
            varroa_check: data.varroa_check,
            varroa_count: data.varroa_count,
            hive_strength: data.hive_strength || 5,
            honey_stores: data.honey_stores || 3,
            pollen_stores: data.pollen_stores || 3,
            notes: data.notes || '',
          });
        }
      } catch (error) {
        logger.error('Error fetching inspection:', error);
        toast({
          title: "Error",
          description: "Failed to load inspection details",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
        setLoadingFindings(false);
      }
    };

    fetchInspection();
  }, [id]);

  useEffect(() => {
    if (isEditDialogOpen && inspection) {
      // Reset form when dialog is opened
      completeForm.reset({
        queen_seen: inspection.queen_seen,
        eggs_seen: inspection.eggs_seen,
        larvae_seen: inspection.larvae_seen,
        queen_cells_seen: inspection.queen_cells_seen,
        disease_signs: inspection.disease_signs,
        disease_details: inspection.disease_details || '',
        varroa_check: inspection.varroa_check,
        varroa_count: inspection.varroa_count,
        hive_strength: inspection.hive_strength || 5,
        honey_stores: inspection.honey_stores || 3,
        pollen_stores: inspection.pollen_stores || 3,
        notes: inspection.notes || '',
      });
    }
  }, [isEditDialogOpen, inspection]);

  const getStatusLabel = (inspection: InspectionWithHiveDetails): InspectionStatus => {
    const inspectionDate = parseISO(inspection.inspection_date);
    const now = new Date();

    // Consider an inspection completed if certain fields are filled
    if (inspection.notes || inspection.queen_seen || inspection.eggs_seen || inspection.larvae_seen) {
      return 'completed';
    }
    
    // If it's in the past but not completed, it's overdue
    if (isPast(inspectionDate) && inspectionDate < now) {
      return 'overdue';
    }
    
    return 'scheduled';
  };

  const getStatusColor = (status: InspectionStatus) => {
    switch (status) {
      case 'completed':
        return 'text-emerald-500 border-emerald-500';
      case 'overdue':
        return 'text-destructive border-destructive';
      default:
        return '';
    }
  };

  const getStatusIcon = (status: InspectionStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const renderHealthStatus = (value: boolean, label: string, icon: React.ReactNode) => (
    <Badge variant={value ? "default" : "outline"} className="flex gap-1 items-center">
      {value ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      <span>{label}</span>
    </Badge>
  );

  const renderScale = (value: number | undefined, max: number, label: string) => {
    if (value === undefined) return null;
    
    const dots = [];
    for (let i = 1; i <= max; i++) {
      dots.push(
        <div 
          key={i}
          className={`w-2 h-2 rounded-full ${i <= value ? 'bg-primary' : 'bg-muted'}`}
        />
      );
    }
    
    return (
      <div className="flex flex-col gap-1">
        <span className="text-xs text-muted-foreground">{label}</span>
        <div className="flex gap-1">
          {dots}
        </div>
        <span className="text-xs">{value}/{max}</span>
      </div>
    );
  };

  const handleDelete = async () => {
    try {
      if (!id) return;
      
      // Delete the inspection using the service
      await deleteInspection(id);
      
      toast({
        title: "Success",
        description: "Inspection deleted successfully",
      });
      navigate('/inspections');
    } catch (error) {
      logger.error('Error deleting inspection:', error);
      toast({
        title: "Error",
        description: "Failed to delete inspection",
        variant: "destructive",
      });
    }
  };

  const handleCompleteInspection = async (data: CompleteInspectionValues) => {
    if (!inspection || !id) return;
    
    try {
      setIsSubmitting(true);
      
      // Prepare the inspection data for update - remove fields not in the database schema
      const { hive_name, apiary_id, apiary_name, ...baseInspection } = inspection;
      
      const updateData = {
        ...baseInspection,
        queen_seen: data.queen_seen,
        eggs_seen: data.eggs_seen,
        larvae_seen: data.larvae_seen,
        queen_cells_seen: data.queen_cells_seen,
        disease_signs: data.disease_signs,
        disease_details: data.disease_details || null,
        varroa_check: data.varroa_check,
        varroa_count: data.varroa_count !== undefined ? data.varroa_count : null,
        hive_strength: data.hive_strength,
        honey_stores: data.honey_stores,
        pollen_stores: data.pollen_stores,
        notes: data.notes || null,
      };
      
      // Prepare findings data with all required fields
      const findingsData = {
        queen_sighted: data.queen_seen,
        brood_pattern: data.larvae_seen ? 3 : 1,
        honey_stores: data.honey_stores,
        population_strength: data.hive_strength,
        temperament: 3, // Default value
        diseases_sighted: data.disease_signs,
        varroa_count: data.varroa_count !== undefined ? data.varroa_count : null,
        notes: data.notes || null,
        user_id: inspection.user_id
      };
      
      logger.log('Updating inspection with:', updateData);
      logger.log('Adding findings:', findingsData);
      
      try {
        // Update the inspection
        await updateInspection(id, updateData, findingsData);
        logger.log('Inspection update successful');
      } catch (updateError) {
        logger.error('Error in updateInspection call:', updateError);
        throw updateError;
      }
      
      try {
        // Update local state - need to preserve the UI fields that aren't in the database
        setInspection({
          ...updateData,
          hive_name,
          apiary_id,
          apiary_name
        });
        logger.log('Local state update successful');
      } catch (stateError) {
        logger.error('Error updating local state:', stateError);
        // Don't throw - we want to continue even if state update fails
      }
      
      toast({
        title: "Success",
        description: "Inspection completed successfully",
      });
      
      setIsEditDialogOpen(false);
      
      try {
        // Refresh the data
        logger.log('Refreshing inspection data');
        const updatedInspection = await getInspectionById(id);
        logger.log('Retrieved updated inspection:', updatedInspection);
        setInspection(updatedInspection);
        
        logger.log('Refreshing findings data');
        const updatedFindings = await getInspectionFindings(id);
        logger.log('Retrieved updated findings:', updatedFindings);
        setFindings(updatedFindings);
      } catch (refreshError) {
        logger.error('Error refreshing data after update:', refreshError);
        // Don't throw - we want the user to see success even if refresh fails
      }
    } catch (error) {
      logger.error('Error completing inspection:', error);
      toast({
        title: "Error",
        description: "Failed to update inspection",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const scheduleFollowUp = () => {
    // Set default follow-up date to 7 days from the current inspection date
    const nextInspectionDate = addDays(parseISO(inspection.inspection_date), 7);
    setIsNewInspectionDialogOpen(true);
  };

  if (loading || !inspection) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const status = getStatusLabel(inspection);
  const formattedDate = format(parseISO(inspection.inspection_date), 'PPPP');
  const timeAgo = formatDistance(parseISO(inspection.inspection_date), new Date(), { addSuffix: true });

  return (
    <PageTransition>
      <div className="container max-w-4xl mx-auto py-6 px-4 sm:px-6 space-y-8">
        {/* Header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Button
            variant="ghost"
            className="w-fit"
            onClick={() => navigate('/inspections')}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to Inspections
          </Button>

          <div className="flex items-center gap-2">
            {status !== 'completed' && (
              <Button 
                variant="default" 
                className="gap-2"
                onClick={() => setIsEditDialogOpen(true)}
              >
                <CheckCheck className="h-4 w-4" />
                Complete Inspection
              </Button>
            )}
            <Button 
              variant="outline" 
              className="gap-2"
              onClick={() => setIsEditDialogOpen(true)}
            >
              <PenSquare className="h-4 w-4" />
              {status === 'completed' ? 'Edit' : 'Fill Details'}
            </Button>
            <Button
              variant="outline"
              className="gap-2"
              onClick={scheduleFollowUp}
            >
              <Calendar className="h-4 w-4" />
              Schedule Follow-up
            </Button>
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="destructive" className="gap-2">
                  <Trash2 className="h-4 w-4" />
                  Delete
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete Inspection</DialogTitle>
                  <DialogDescription>
                    Are you sure you want to delete this inspection? This action cannot be undone.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button variant="destructive" onClick={handleDelete}>
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {status !== 'completed' && (
          <div className="bg-muted rounded-lg p-4 flex items-start gap-3 mb-4">
            {status === 'overdue' ? (
              <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
            ) : (
              <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
            )}
            <div>
              <h3 className="font-medium mb-1">
                {status === 'overdue' ? 'Inspection Overdue' : 'Scheduled Inspection'}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                {status === 'overdue' 
                  ? `This inspection was scheduled for ${formattedDate} and is now overdue.` 
                  : `This inspection is scheduled for ${formattedDate}.`}
              </p>
              <Button 
                size="sm" 
                onClick={() => setIsEditDialogOpen(true)}
                className="gap-2"
              >
                <CheckCheck className="h-4 w-4" />
                Complete Inspection
              </Button>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6 bg-card p-6 rounded-lg border">
          {/* Status and Title */}
          <div className="space-y-4">
            <Badge 
              variant="outline" 
              className={cn(getStatusColor(status))}
            >
              <span className="flex items-center">
                {getStatusIcon(status)}
                <span className="ml-1 capitalize">{status}</span>
              </span>
            </Badge>

            <div>
              <h1 className="text-2xl font-semibold">{inspection.hive_name} Inspection</h1>
              <div className="flex items-center gap-2 text-muted-foreground mt-1">
                <Calendar className="h-4 w-4" />
                <span>{formattedDate}</span>
                <span>•</span>
                <Clock className="h-4 w-4" />
                <span>{timeAgo}</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Location Information */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Location</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Apiary</p>
                <p>{inspection.apiary_name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm text-muted-foreground">Hive</p>
                <p>{inspection.hive_name}</p>
              </div>
            </div>
          </div>

          <Separator />
          
          {/* Environmental Conditions */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Environmental Conditions</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {inspection.temperature && (
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <ThermometerSun className="h-8 w-8 text-amber-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Temperature</p>
                      <p className="text-lg font-medium">{inspection.temperature}°C</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {inspection.humidity && (
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <Droplets className="h-8 w-8 text-blue-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Humidity</p>
                      <p className="text-lg font-medium">{inspection.humidity}%</p>
                    </div>
                  </CardContent>
                </Card>
              )}
              
              {inspection.weather_conditions && (
                <Card>
                  <CardContent className="p-4 flex items-center gap-3">
                    <CloudSun className="h-8 w-8 text-sky-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Weather</p>
                      <p className="text-lg font-medium">{inspection.weather_conditions}</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Separator />
          
          {/* Colony Status */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Colony Status</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-md font-medium">Health</h3>
                <div className="flex flex-wrap gap-2">
                  {renderHealthStatus(inspection.queen_seen, "Queen Sighted", <Crown />)}
                  {renderHealthStatus(inspection.eggs_seen, "Eggs Present", <Egg />)}
                  {renderHealthStatus(inspection.larvae_seen, "Larvae Present", <Activity />)}
                  {renderHealthStatus(inspection.queen_cells_seen, "Queen Cells", <HeartPulse />)}
                  {renderHealthStatus(inspection.disease_signs, "Disease Signs", <Bug />)}
                </div>
                
                {inspection.disease_signs && inspection.disease_details && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">Disease Details</p>
                    <p className="text-sm">{inspection.disease_details}</p>
                  </div>
                )}
                
                {inspection.varroa_check && (
                  <div className="mt-2">
                    <p className="text-sm text-muted-foreground">Varroa Check</p>
                    <p className="text-sm">
                      {inspection.varroa_count 
                        ? `Count: ${inspection.varroa_count}`
                        : "Checked, no count recorded"}
                    </p>
                  </div>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-md font-medium">Metrics</h3>
                <div className="flex flex-wrap gap-4">
                  {inspection.weight && (
                    <div className="flex items-center gap-2">
                      <Weight className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <p className="text-sm text-muted-foreground">Weight</p>
                        <p className="text-sm font-medium">{inspection.weight} kg</p>
                      </div>
                    </div>
                  )}
                  
                  {inspection.hive_strength !== undefined && renderScale(inspection.hive_strength, 10, "Hive Strength")}
                  {inspection.honey_stores !== undefined && renderScale(inspection.honey_stores, 5, "Honey Stores")}
                  {inspection.pollen_stores !== undefined && renderScale(inspection.pollen_stores, 5, "Pollen Stores")}
                </div>
              </div>
            </div>
          </div>

          <Separator />
          
          {/* Management Actions */}
          <div>
            <h2 className="text-lg font-semibold mb-2">Management Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h3 className="text-md font-medium">Hive Management</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {inspection.added_supers !== undefined && inspection.added_supers > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Added Supers</p>
                      <p className="text-sm font-medium">{inspection.added_supers}</p>
                    </div>
                  )}
                  
                  {inspection.removed_supers !== undefined && inspection.removed_supers > 0 && (
                    <div>
                      <p className="text-sm text-muted-foreground">Removed Supers</p>
                      <p className="text-sm font-medium">{inspection.removed_supers}</p>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="space-y-2">
                <h3 className="text-md font-medium">Treatments</h3>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {inspection.feed_added && (
                    <div>
                      <p className="text-sm text-muted-foreground">Feed Added</p>
                      <p className="text-sm font-medium">
                        {inspection.feed_type && `${inspection.feed_type}${inspection.feed_amount ? ` (${inspection.feed_amount})` : ''}`}
                      </p>
                    </div>
                  )}
                  
                  {inspection.medications_added && (
                    <div>
                      <p className="text-sm text-muted-foreground">Medications</p>
                      <p className="text-sm font-medium">
                        {inspection.medication_details || "Added"}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Additional Findings Section */}
          {findings && (
            <>
              <Separator />
              <div>
                <h2 className="text-lg font-semibold mb-2">Additional Findings</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-md font-medium">Brood Pattern</h3>
                    {renderScale(findings.brood_pattern, 5, "Rating")}
                  </div>
                  
                  <div className="space-y-2">
                    <h3 className="text-md font-medium">Temperament</h3>
                    {renderScale(findings.temperament, 5, "Rating")}
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Notes Section */}
          {inspection.notes && (
            <>
              <Separator />
              <div>
                <h2 className="text-lg font-semibold mb-2">Notes</h2>
                <div className="bg-muted/50 p-4 rounded-md">
                  <p className="whitespace-pre-line">{inspection.notes}</p>
                </div>
              </div>
            </>
          )}
          
          {/* Images (Placeholder) */}
          {inspection.images && inspection.images.length > 0 && (
            <>
              <Separator />
              <div>
                <h2 className="text-lg font-semibold mb-2">Images</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2">
                  {inspection.images.map((image, i) => (
                    <div key={i} className="aspect-square bg-muted rounded-md overflow-hidden">
                      <img 
                        src={image} 
                        alt={`Inspection ${i+1}`} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
          
          {/* Metadata */}
          <Separator />
          <div className="text-xs text-muted-foreground">
            <p>Created: {format(parseISO(inspection.created_at), 'PPP')}</p>
            <p>Last updated: {format(parseISO(inspection.updated_at), 'PPP')}</p>
          </div>
        </div>

        {/* Schedule Follow-up Dialog */}
        <Dialog open={isNewInspectionDialogOpen} onOpenChange={setIsNewInspectionDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Schedule Follow-up Inspection</DialogTitle>
              <DialogDescription>
                Schedule a follow-up inspection for {inspection.hive_name}
              </DialogDescription>
            </DialogHeader>
            <NewInspectionForm 
              onSuccess={() => {
                setIsNewInspectionDialogOpen(false);
                toast({
                  title: "Success",
                  description: "Follow-up inspection scheduled",
                });
              }}
              onCancel={() => setIsNewInspectionDialogOpen(false)}
              initialDate={addDays(parseISO(inspection.inspection_date), 7)}
              preselectedHiveId={inspection.hive_id}
              preselectedApiaryId={inspection.apiary_id}
            />
          </DialogContent>
        </Dialog>

        {/* Complete Inspection Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {status === 'completed' ? 'Edit Inspection Details' : 'Complete Inspection'}
              </DialogTitle>
              <DialogDescription>
                Record your findings for the inspection of {inspection.hive_name} on {formattedDate}
              </DialogDescription>
            </DialogHeader>
            
            <Form {...completeForm}>
              <form onSubmit={completeForm.handleSubmit(handleCompleteInspection)} className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-md font-medium">Colony Health</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={completeForm.control}
                      name="queen_seen"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Queen Sighted</FormLabel>
                            <FormDescription>
                              Did you see the queen during inspection?
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={completeForm.control}
                      name="eggs_seen"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Eggs Present</FormLabel>
                            <FormDescription>
                              Were there eggs in the cells?
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={completeForm.control}
                      name="larvae_seen"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Larvae Present</FormLabel>
                            <FormDescription>
                              Did you observe larvae?
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={completeForm.control}
                      name="queen_cells_seen"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>Queen Cells</FormLabel>
                            <FormDescription>
                              Are there any queen cells?
                            </FormDescription>
                          </div>
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <FormField
                    control={completeForm.control}
                    name="disease_signs"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Disease Signs</FormLabel>
                          <FormDescription>
                            Did you notice any signs of disease?
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {completeForm.watch('disease_signs') && (
                    <FormField
                      control={completeForm.control}
                      name="disease_details"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Disease Details</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Describe the disease signs you observed"
                              className="resize-none"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <FormField
                    control={completeForm.control}
                    name="varroa_check"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Varroa Check</FormLabel>
                          <FormDescription>
                            Did you perform a varroa mite check?
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  {completeForm.watch('varroa_check') && (
                    <FormField
                      control={completeForm.control}
                      name="varroa_count"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Varroa Count</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="Enter the number of mites counted"
                              value={field.value === null || field.value === undefined ? '' : field.value}
                              onChange={(e) => {
                                const value = e.target.value === '' ? undefined : Number(e.target.value);
                                field.onChange(value);
                              }}
                            />
                          </FormControl>
                          <FormDescription>
                            Record the number of varroa mites found during your check
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                  
                  <Separator />
                  
                  <h3 className="text-md font-medium">Colony Metrics</h3>
                  
                  <FormField
                    control={completeForm.control}
                    name="hive_strength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Hive Strength (1-10)</FormLabel>
                        <FormControl>
                          <div className="space-y-3">
                            <Slider
                              min={1}
                              max={10}
                              step={1}
                              defaultValue={[field.value || 5]}
                              onValueChange={(vals) => field.onChange(vals[0])}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                              <span>Weak</span>
                              <span>Average</span>
                              <span>Strong</span>
                            </div>
                          </div>
                        </FormControl>
                        <FormDescription>
                          Rate the overall strength and population of the hive
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={completeForm.control}
                      name="honey_stores"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Honey Stores (1-5)</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                defaultValue={[field.value || 3]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Low</span>
                                <span>High</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={completeForm.control}
                      name="pollen_stores"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pollen Stores (1-5)</FormLabel>
                          <FormControl>
                            <div className="space-y-3">
                              <Slider
                                min={1}
                                max={5}
                                step={1}
                                defaultValue={[field.value || 3]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                              />
                              <div className="flex justify-between text-xs text-muted-foreground">
                                <span>Low</span>
                                <span>High</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  
                  <Separator />
                  
                  <FormField
                    control={completeForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Add your observations and notes about this inspection"
                            className="resize-none h-[100px]"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                
                <DialogFooter>
                  <Button variant="outline" type="button" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      <>
                        {status === 'completed' ? 'Update Inspection' : 'Complete Inspection'}
                      </>
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default InspectionDetail; 