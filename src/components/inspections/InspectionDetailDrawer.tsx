import React, { useState, useEffect } from 'react';
import { format, formatDistance, parseISO, isPast } from 'date-fns';
import { 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ClipboardList, 
  Crown, 
  Calendar, 
  CalendarDays,
  Edit,
  Trash2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  PenSquare,
  Bug,
  Ruler,
  Thermometer,
  Users,
  X,
  ThermometerSun, 
  Droplets, 
  CloudSun,
  Egg, 
  Activity, 
  HeartPulse,
  Weight, 
  LayoutGrid, 
  MapPin,
  Sparkles,
  Utensils,
  Pill,
  StickyNote,
  AlarmClock,
  BellRing,
  AlertTriangle,
  ImageIcon,
  Loader2
} from 'lucide-react';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Inspection, getApiaryById, getHiveById } from '@/utils/mockData';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
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
import { InspectionWithHiveDetails } from '@/services/inspectionService';
import { getInspectionFindings, InspectionFindings } from '@/services/inspectionService';

interface InspectionDetailDrawerProps {
  inspection: InspectionWithHiveDetails;
  onDelete: () => void;
}

type InspectionStatus = 'completed' | 'scheduled' | 'overdue';

const InspectionDetailDrawer: React.FC<InspectionDetailDrawerProps> = ({
  inspection,
  onDelete,
}) => {
  const [findings, setFindings] = useState<InspectionFindings | null>(null);
  const [loadingFindings, setLoadingFindings] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  // Helper functions for status
  const getStatusLabel = (): InspectionStatus => {
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

  const getStatusColor = () => {
    const status = getStatusLabel();
    switch (status) {
      case 'completed':
        return 'text-emerald-500 border-emerald-500';
      case 'overdue':
        return 'text-destructive border-destructive';
      default:
        return '';
    }
  };

  const getStatusIcon = () => {
    const status = getStatusLabel();
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  
  // Format the inspection date
  const formattedDate = format(parseISO(inspection.inspection_date), 'PPPP');
  const timeAgo = formatDistance(parseISO(inspection.inspection_date), new Date(), { addSuffix: true });
  
  useEffect(() => {
    const fetchFindings = async () => {
      try {
        setLoadingFindings(true);
        const data = await getInspectionFindings(inspection.id);
        setFindings(data);
      } catch (error) {
        console.error('Error fetching inspection findings:', error);
      } finally {
        setLoadingFindings(false);
      }
    };
    
    fetchFindings();
  }, [inspection.id]);
  
  // Helper function to render health status badges
  const renderHealthStatus = (value: boolean, label: string, icon: React.ReactNode) => (
    <Badge variant={value ? "default" : "outline"} className="flex gap-1 items-center">
      {value ? <CheckCircle2 className="h-3.5 w-3.5" /> : <X className="h-3.5 w-3.5" />}
      <span>{label}</span>
    </Badge>
  );
  
  // Helper function to render the scale
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
  
  const handleDelete = () => {
    onDelete();
    setIsDeleteDialogOpen(false);
  };
  
  return (
    <Drawer open={true} onOpenChange={() => {}}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={cn(getStatusColor())}
            >
              <span className="flex items-center">
                {getStatusIcon()}
                <span className="ml-1">{getStatusLabel()}</span>
              </span>
            </Badge>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="gap-1 w-full sm:w-auto mt-2 sm:mt-0">
                <ExternalLink className="h-4 w-4" />
                <span>View Hive</span>
              </Button>
            </div>
          </div>
          
          <DrawerTitle className="text-xl mt-3 flex items-center capitalize">
            {inspection.hive_name} Inspection
          </DrawerTitle>
          
          <DrawerDescription className="flex items-center text-base">
            <Calendar className="h-4 w-4 mr-2" />
            {formattedDate}
            <span className="mx-1">•</span>
            <Clock className="mr-1 h-4 w-4" />
            {timeAgo}
          </DrawerDescription>
        </DrawerHeader>
        
        <ScrollArea className="p-6 pb-20 h-full">
          <div className="space-y-6">
            <div className="flex flex-col space-y-1.5">
              <h3 className="text-sm font-medium text-muted-foreground">Location</h3>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary" />
                  <div>
                    <p className="font-medium">
                      {inspection.hive_name} in {inspection.apiary_name}
                    </p>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="gap-1 w-full sm:w-auto mt-2 sm:mt-0">
                  <ExternalLink className="h-4 w-4" />
                  <span>View Hive</span>
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {/* Environmental Conditions */}
            <div>
              <h4 className="font-medium mb-3">Environmental Conditions</h4>
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
            
            {/* Colony Status */}
            <div>
              <h4 className="font-medium mb-3">Colony Status</h4>
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
                
                {inspection.hive_strength !== undefined && (
                  <div className="mt-3">
                    <span className="text-sm text-muted-foreground mb-1 block">Hive Strength</span>
                    <div className="flex items-center gap-2">
                      <HeartPulse className="h-4 w-4 text-primary" />
                      <div className="w-full bg-muted rounded-full h-2.5">
                        <div 
                          className="bg-primary h-2.5 rounded-full" 
                          style={{ width: `${(inspection.hive_strength / 10) * 100}%` }}
                        ></div>
                      </div>
                      <span className="text-sm font-medium min-w-[28px]">{inspection.hive_strength}/10</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Resources */}
            <div>
              <h4 className="font-medium mb-3">Resources</h4>
              <div className="grid grid-cols-2 gap-4">
                {inspection.honey_stores !== undefined && (
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <Sparkles className="h-5 w-5 text-amber-500" />
                          <span className="font-medium">Honey Stores</span>
                        </div>
                        <Badge variant="outline">{inspection.honey_stores}/5</Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div 
                          className="bg-amber-500 h-2 rounded-full" 
                          style={{ width: `${(inspection.honey_stores / 5) * 100}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                )}
                
                {inspection.pollen_stores !== undefined && (
                  <Card>
                    <CardContent className="p-3">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <LayoutGrid className="h-5 w-5 text-yellow-500" />
                          <span className="font-medium">Pollen Stores</span>
                        </div>
                        <Badge variant="outline">{inspection.pollen_stores}/5</Badge>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2 mt-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${(inspection.pollen_stores / 5) * 100}%` }}
                        ></div>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
            
            {/* Management Actions */}
            {(inspection.added_supers || inspection.removed_supers || inspection.feed_added || inspection.medications_added) && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Management Actions</h4>
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
                          <Utensils className="h-4 w-4" />
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
            
            {/* Varroa Check */}
            {inspection.varroa_check && (
              <>
                <Separator />
                <div>
                  <h4 className="font-medium mb-3">Varroa Check</h4>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bug className="h-4 w-4" />
                      <span>Varroa Count</span>
                    </div>
                    {inspection.varroa_count !== undefined ? (
                      <Badge 
                        variant={inspection.varroa_count > 5 ? "destructive" : "outline"}
                        className="flex gap-1 items-center"
                      >
                        {inspection.varroa_count > 5 ? 
                          <AlertTriangle className="h-3.5 w-3.5" /> : 
                          <CheckCircle2 className="h-3.5 w-3.5" />
                        }
                        <span>{inspection.varroa_count}</span>
                      </Badge>
                    ) : (
                      <Badge variant="outline">Not recorded</Badge>
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
                <div>
                  <h4 className="font-medium mb-3">Additional Findings</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
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
                <div>
                  <h4 className="font-medium mb-2">Notes</h4>
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
                <div>
                  <h4 className="font-medium mb-3">Images</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
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
            
            {/* Actions */}
            <div className="flex justify-between">
              <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="destructive" size="sm">
                    <Trash2 className="h-4 w-4 mr-2" />
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
        </ScrollArea>
        
        <DrawerFooter className="border-t pt-4 gap-2">
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <Button variant="outline" onClick={() => {}} className="order-2 sm:order-1">
              Close Details
            </Button>
            
            <div className="flex gap-2 flex-col sm:flex-row order-1 sm:order-2">
              <Button variant="outline" onClick={() => {}}>
                <PenSquare className="h-4 w-4 mr-1" />
                Edit Inspection
              </Button>
              
              <Button className="gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Record Findings
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default InspectionDetailDrawer; 