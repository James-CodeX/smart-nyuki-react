import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { format, formatDistance, parseISO, isPast } from 'date-fns';
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
  X
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
import { toast } from "@/components/ui/use-toast";
import { InspectionWithHiveDetails, getInspectionById, getInspectionFindings, InspectionFindings } from '@/services/inspectionService';
import { cn } from '@/lib/utils';
import PageTransition from '@/components/PageTransition';

type InspectionStatus = 'completed' | 'scheduled' | 'overdue';

const InspectionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [inspection, setInspection] = useState<InspectionWithHiveDetails | null>(null);
  const [findings, setFindings] = useState<InspectionFindings | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingFindings, setLoadingFindings] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

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
      } catch (error) {
        console.error('Error fetching inspection:', error);
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

  const getStatusLabel = (inspection: InspectionWithHiveDetails): InspectionStatus => {
    const inspectionDate = parseISO(inspection.inspection_date);
    const now = new Date();
    if (isPast(inspectionDate)) {
      return 'completed';
    }
    if (inspectionDate < now) {
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
      // Add delete logic here
      toast({
        title: "Success",
        description: "Inspection deleted successfully",
      });
      navigate('/inspections');
    } catch (error) {
      console.error('Error deleting inspection:', error);
      toast({
        title: "Error",
        description: "Failed to delete inspection",
        variant: "destructive",
      });
    }
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
            <Button variant="outline" className="gap-2">
              <PenSquare className="h-4 w-4" />
              Edit
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

          {/* Location */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Location</h2>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium">
                    {inspection.hive_name} in {inspection.apiary_name}
                  </p>
                </div>
              </div>
              
              <Button variant="outline" size="sm" className="gap-1 w-full sm:w-auto">
                <ExternalLink className="h-4 w-4" />
                <span>View Hive</span>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Environmental Conditions */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Environmental Conditions</h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {inspection.temperature && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                    <ThermometerSun className="h-5 w-5 text-amber-500 mb-1" />
                    <span className="text-lg font-medium">{inspection.temperature}°C</span>
                    <span className="text-xs text-muted-foreground">Temperature</span>
                  </CardContent>
                </Card>
              )}
              
              {inspection.humidity && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                    <Droplets className="h-5 w-5 text-blue-500 mb-1" />
                    <span className="text-lg font-medium">{inspection.humidity}%</span>
                    <span className="text-xs text-muted-foreground">Humidity</span>
                  </CardContent>
                </Card>
              )}
              
              {inspection.weight && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                    <Weight className="h-5 w-5 text-emerald-500 mb-1" />
                    <span className="text-lg font-medium">{inspection.weight} kg</span>
                    <span className="text-xs text-muted-foreground">Weight</span>
                  </CardContent>
                </Card>
              )}
              
              {inspection.weather_conditions && (
                <Card className="bg-muted/50">
                  <CardContent className="p-3 flex flex-col items-center justify-center text-center">
                    <CloudSun className="h-5 w-5 text-sky-500 mb-1" />
                    <span className="text-sm font-medium line-clamp-1">{inspection.weather_conditions}</span>
                    <span className="text-xs text-muted-foreground">Weather</span>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          <Separator />

          {/* Colony Status */}
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">Colony Status</h2>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                {renderHealthStatus(inspection.queen_seen, "Queen Sighted", <Crown />)}
                {renderHealthStatus(inspection.eggs_seen, "Eggs Present", <Egg />)}
                {renderHealthStatus(inspection.larvae_seen, "Larvae Present", <Activity />)}
                {renderHealthStatus(inspection.queen_cells_seen, "Queen Cells", <AlertTriangle />)}
                {renderHealthStatus(inspection.disease_signs, "Disease Signs", <Bug />)}
              </div>
              
              {inspection.disease_signs && inspection.disease_details && (
                <div className="mt-2 bg-destructive/10 p-3 rounded-md text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <Bug className="h-4 w-4 text-destructive" />
                    <span className="font-medium">Disease Details</span>
                  </div>
                  <p>{inspection.disease_details}</p>
                </div>
              )}
            </div>
          </div>

          {/* Management Actions */}
          {(inspection.added_supers || inspection.removed_supers || inspection.feed_added || inspection.medications_added) && (
            <>
              <Separator />
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Management Actions</h2>
                <div className="space-y-3">
                  {(inspection.added_supers || inspection.removed_supers) && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <LayoutGrid className="h-4 w-4" />
                        <span>Supers</span>
                      </div>
                      <div className="flex gap-2">
                        {inspection.added_supers > 0 && (
                          <Badge variant="outline" className="bg-emerald-50">
                            +{inspection.added_supers} Added
                          </Badge>
                        )}
                        {inspection.removed_supers > 0 && (
                          <Badge variant="outline" className="bg-red-50">
                            -{inspection.removed_supers} Removed
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {inspection.feed_added && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4" />
                        <span>Feed Added</span>
                      </div>
                      <div className="text-sm">
                        {inspection.feed_type && <span className="font-medium">{inspection.feed_type}</span>}
                        {inspection.feed_amount && <span> - {inspection.feed_amount}</span>}
                      </div>
                    </div>
                  )}
                  
                  {inspection.medications_added && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Pill className="h-4 w-4" />
                        <span>Medications</span>
                      </div>
                      {inspection.medication_details && (
                        <span className="text-sm">{inspection.medication_details}</span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}

          {/* Findings */}
          {loadingFindings ? (
            <div className="flex justify-center items-center py-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : findings ? (
            <>
              <Separator />
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Additional Findings</h2>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-6">
                  {renderScale(findings.brood_pattern, 5, "Brood Pattern")}
                  {renderScale(findings.honey_stores, 5, "Honey Stores")}
                  {renderScale(findings.population_strength, 5, "Population")}
                  {renderScale(findings.temperament, 5, "Temperament")}
                </div>
                
                {findings.notes && (
                  <div className="mt-4 text-sm p-3 bg-muted/50 rounded-md">
                    <div className="flex items-center gap-2 mb-1">
                      <StickyNote className="h-4 w-4" />
                      <span className="font-medium">Finding Notes</span>
                    </div>
                    <p>{findings.notes}</p>
                  </div>
                )}
              </div>
            </>
          ) : null}

          {/* Notes */}
          {inspection.notes && (
            <>
              <Separator />
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Notes</h2>
                <div className="p-3 bg-muted/50 rounded-md">
                  <p className="text-sm">{inspection.notes}</p>
                </div>
              </div>
            </>
          )}

          {/* Images */}
          {inspection.images && inspection.images.length > 0 && (
            <>
              <Separator />
              <div className="space-y-4">
                <h2 className="text-lg font-semibold">Images</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {inspection.images.map((image, index) => (
                    <div key={index} className="aspect-square bg-muted rounded-md overflow-hidden">
                      <img src={image} alt={`Inspection ${index + 1}`} className="w-full h-full object-cover" />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* Metadata */}
          <Separator />
          <div className="flex flex-col gap-1 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Created: {format(parseISO(inspection.created_at), 'PPp')}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>Last Updated: {format(parseISO(inspection.updated_at), 'PPp')}</span>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default InspectionDetail; 