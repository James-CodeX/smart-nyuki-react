import React from 'react';
import { format } from 'date-fns';
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
  X
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

interface InspectionDetailDrawerProps {
  inspection: Inspection | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (inspection: Inspection) => void;
  onChangeStatus?: (inspection: Inspection, status: 'scheduled' | 'completed' | 'cancelled') => void;
  onDelete?: (inspection: Inspection) => void;
}

const InspectionDetailDrawer: React.FC<InspectionDetailDrawerProps> = ({
  inspection,
  isOpen,
  onClose,
  onEdit,
  onChangeStatus,
  onDelete
}) => {
  if (!inspection) return null;
  
  const isCompleted = inspection.status === 'completed';
  const isScheduled = inspection.status === 'scheduled';
  const isOverdue = inspection.status === 'overdue' || 
    (inspection.status === 'scheduled' && new Date(inspection.date) < new Date());
  
  const hive = getHiveById(inspection.apiaryId, inspection.hiveId);
  const apiary = getApiaryById(inspection.apiaryId);
  
  const getStatusIcon = () => {
    if (isOverdue) return <AlertCircle className="h-5 w-5 text-destructive" />;
    if (isCompleted) return <CheckCircle2 className="h-5 w-5 text-green-600" />;
    if (isScheduled) return <Clock className="h-5 w-5 text-blue-600" />;
    return null;
  };
  
  const getStatusLabel = () => {
    if (isOverdue) return 'Overdue';
    if (isCompleted) return 'Completed';
    if (isScheduled) return 'Scheduled';
    return inspection.status;
  };
  
  const getStatusColor = () => {
    if (isOverdue) return "bg-destructive/10 text-destructive border-destructive/20";
    if (isCompleted) return "bg-green-100 text-green-700 border-green-200";
    if (isScheduled) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-muted text-muted-foreground border-muted";
  };
  
  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="max-h-[90vh]">
        <DrawerHeader className="border-b pb-4">
          <div className="flex items-center justify-between">
            <Badge 
              variant="outline" 
              className={cn("capitalize", getStatusColor())}
            >
              <span className="flex items-center">
                {getStatusIcon()}
                <span className="ml-1">{getStatusLabel()}</span>
              </span>
            </Badge>
            
            <div className="flex items-center gap-2">
              {onEdit && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onEdit(inspection)}
                >
                  <Edit className="h-4 w-4 md:mr-1" />
                  <span className="hidden md:inline">Edit</span>
                </Button>
              )}
              
              {onDelete && (
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-destructive"
                  onClick={() => onDelete(inspection)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
          
          <DrawerTitle className="text-xl mt-3 flex items-center capitalize">
            {inspection.type.replace('-', ' ')} Inspection
          </DrawerTitle>
          
          <DrawerDescription className="flex items-center text-base">
            <Calendar className="h-4 w-4 mr-2" />
            {format(new Date(inspection.date), 'EEEE, MMMM d, yyyy')}
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
                      {hive?.name} in {apiary?.name}
                    </p>
                    <p className="text-sm text-muted-foreground">{apiary?.location}</p>
                  </div>
                </div>
                
                <Button variant="outline" size="sm" className="gap-1 w-full sm:w-auto mt-2 sm:mt-0">
                  <ExternalLink className="h-4 w-4" />
                  <span>View Hive</span>
                </Button>
              </div>
            </div>
            
            <Separator />
            
            {isCompleted && inspection.findings && (
              <>
                <div className="space-y-3">
                  <h3 className="text-sm font-medium text-primary">Inspection Findings</h3>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Crown className="h-5 w-5 text-purple-500" />
                        <h4 className="font-medium">Queen Status</h4>
                      </div>
                      <p className="mt-1 text-sm">
                        {inspection.findings.queenSighted 
                          ? "Queen sighted and appears healthy"
                          : "Queen not sighted during inspection"}
                      </p>
                    </div>
                    
                    <div className="border rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Bug className="h-5 w-5 text-red-500" />
                        <h4 className="font-medium">Pests & Diseases</h4>
                      </div>
                      <p className="mt-1 text-sm">
                        {inspection.findings.diseasesSighted 
                          ? "Signs of disease or pests detected"
                          : "No signs of disease or pests"}
                      </p>
                      {inspection.findings.varroaCount !== undefined && (
                        <p className="text-sm text-muted-foreground mt-1">
                          Varroa count: {inspection.findings.varroaCount}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <h4 className="text-sm font-medium">Brood Pattern</h4>
                          <span className="text-sm">{inspection.findings.broodPattern}/5</span>
                        </div>
                        <Progress value={inspection.findings.broodPattern * 20} className="h-2" />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <h4 className="text-sm font-medium">Honey Stores</h4>
                          <span className="text-sm">{inspection.findings.honeyStores}/5</span>
                        </div>
                        <Progress 
                          value={inspection.findings.honeyStores * 20} 
                          className="h-2 bg-muted"
                          indicatorClassName="bg-amber-500"
                        />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between mb-1">
                          <h4 className="text-sm font-medium">Temperament</h4>
                          <span className="text-sm">{inspection.findings.temperament}/5</span>
                        </div>
                        <Progress 
                          value={inspection.findings.temperament * 20} 
                          className="h-2"
                        />
                      </div>
                      
                      <div>
                        <div className="flex justify-between mb-1">
                          <h4 className="text-sm font-medium">Population</h4>
                          <span className="text-sm">{inspection.findings.populationStrength}/5</span>
                        </div>
                        <Progress value={inspection.findings.populationStrength * 20} className="h-2" />
                      </div>
                    </div>
                  </div>
                </div>
                
                <Separator />
              </>
            )}
            
            {inspection.notes && (
              <div className="space-y-1.5">
                <h3 className="text-sm font-medium text-muted-foreground">Notes</h3>
                <div className="border rounded-lg p-4 bg-muted/10">
                  <p className="text-sm whitespace-pre-line">{inspection.notes}</p>
                </div>
              </div>
            )}
            
            <div className="space-y-1.5">
              <h3 className="text-sm font-medium text-muted-foreground">Actions</h3>
              
              <div className="flex flex-wrap gap-2">
                {isScheduled && onChangeStatus && (
                  <Button 
                    onClick={() => onChangeStatus(inspection, 'completed')}
                    className="gap-1 flex-grow sm:flex-grow-0"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="sm:inline">Mark Completed</span>
                  </Button>
                )}
                
                {(isScheduled || isOverdue) && onChangeStatus && (
                  <Button 
                    variant="outline"
                    onClick={() => onChangeStatus(inspection, 'cancelled')}
                    className="gap-1 border-destructive/20 text-destructive flex-grow sm:flex-grow-0"
                  >
                    <X className="h-4 w-4" />
                    <span className="sm:inline">Cancel</span>
                  </Button>
                )}
                
                {isOverdue && onChangeStatus && (
                  <Button 
                    onClick={() => onChangeStatus(inspection, 'completed')}
                    className="gap-1 flex-grow sm:flex-grow-0"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span className="sm:inline">Mark Completed</span>
                  </Button>
                )}
                
                {isScheduled && (
                  <Button variant="outline" className="gap-1 flex-grow sm:flex-grow-0">
                    <CalendarDays className="h-4 w-4" />
                    <span className="sm:inline">Reschedule</span>
                  </Button>
                )}
              </div>
            </div>
            
            <div className="text-xs text-muted-foreground pt-2 flex flex-col space-y-1">
              <p>Created by: {inspection.createdBy}</p>
              <p>Inspection ID: {inspection.id}</p>
              <p>Created: {format(new Date(inspection.createdAt), 'MMM d, yyyy')}</p>
            </div>
          </div>
        </ScrollArea>
        
        <DrawerFooter className="border-t pt-4 gap-2">
          <div className="flex flex-col sm:flex-row justify-between gap-2">
            <Button variant="outline" onClick={onClose} className="order-2 sm:order-1">
              Close Details
            </Button>
            
            <div className="flex gap-2 flex-col sm:flex-row order-1 sm:order-2">
              {onEdit && (
                <Button variant="outline" onClick={() => onEdit(inspection)}>
                  <PenSquare className="h-4 w-4 mr-1" />
                  Edit Inspection
                </Button>
              )}
              
              <Button className="gap-1">
                <CheckCircle2 className="h-4 w-4" />
                {isCompleted ? 'Edit Findings' : 'Record Findings'}
              </Button>
            </div>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default InspectionDetailDrawer; 