import React from 'react';
import { format, isAfter, isBefore, isPast, isToday, isFuture } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  CalendarDays, 
  ClipboardCheck, 
  ClipboardList, 
  Crown, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ChevronRight,
  Bug,
  Flame,
  Users,
  AlertOctagon,
  Calendar,
  Zap,
  Shield,
  Thermometer,
  Search,
  BarChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Inspection, getApiaryById, getHiveById } from '@/utils/mockData';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface InspectionCardProps {
  inspection: Inspection;
  onClick?: (inspection: Inspection) => void;
  compact?: boolean;
  className?: string;
}

const inspectionTypeIcons = {
  'regular': <ClipboardList className="h-4 w-4" />,
  'health-check': <Shield className="h-4 w-4" />,
  'winter-prep': <Thermometer className="h-4 w-4" />,
  'varroa-check': <Search className="h-4 w-4" />,
  'disease-treatment': <Zap className="h-4 w-4" />,
  'harvest-evaluation': <BarChart className="h-4 w-4" />
};

const InspectionCard: React.FC<InspectionCardProps> = ({
  inspection,
  onClick,
  compact = false,
  className
}) => {
  const isCompleted = inspection.status === 'completed';
  const isScheduled = inspection.status === 'scheduled';
  const isOverdue = inspection.status === 'overdue' || 
    (inspection.status === 'scheduled' && isPast(new Date(inspection.date)) && !isToday(new Date(inspection.date)));
  
  const inspectionDate = new Date(inspection.date);
  const hive = getHiveById(inspection.apiaryId, inspection.hiveId);
  const apiary = getApiaryById(inspection.apiaryId);
  
  const getStatusIcon = () => {
    if (isOverdue) return <AlertCircle className="h-5 w-5 text-destructive" />;
    if (isCompleted) return <ClipboardCheck className="h-5 w-5 text-green-600" />;
    if (isScheduled) return <Clock className="h-5 w-5 text-blue-600" />;
    return null;
  };
  
  const getStatusColor = () => {
    if (isOverdue) return "text-destructive bg-destructive/10 hover:bg-destructive/20";
    if (isCompleted) return "text-green-700 bg-green-100 hover:bg-green-200";
    if (isScheduled) return "text-blue-700 bg-blue-100 hover:bg-blue-200";
    return "text-muted-foreground bg-muted hover:bg-muted/80";
  };
  
  const getStatusLabel = () => {
    if (isOverdue) return 'Overdue';
    if (isCompleted) return 'Completed';
    if (isScheduled) {
      if (isToday(inspectionDate)) return 'Today';
      if (isFuture(inspectionDate)) return 'Upcoming';
      return 'Scheduled';
    }
    return inspection.status;
  };
  
  const getTypeIcon = () => {
    return inspectionTypeIcons[inspection.type as keyof typeof inspectionTypeIcons] || 
      <ClipboardList className="h-4 w-4" />;
  };
  
  const handleClick = () => {
    if (onClick) onClick(inspection);
  };
  
  if (compact) {
    return (
      <div
        className={cn(
          "cursor-pointer flex items-center justify-between p-3 border rounded-lg mb-2 transition-colors",
          getStatusColor(),
          className
        )}
        onClick={handleClick}
      >
        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            {getStatusIcon()}
          </div>
          <div>
            <h4 className="font-medium capitalize">{inspection.type.replace('-', ' ')} Inspection</h4>
            <p className="text-sm">{hive?.name} in {apiary?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="text-right">
            <span className="text-sm font-medium">{format(inspectionDate, 'MMM d')}</span>
            <p className="text-xs">{format(inspectionDate, 'h:mm a')}</p>
          </div>
          <ChevronRight className="h-4 w-4 opacity-70" />
        </div>
      </div>
    );
  }
  
  return (
    <Card 
      className={cn(
        "cursor-pointer border transition-all hover:shadow-md",
        {
          "border-destructive/40": isOverdue,
          "border-green-300": isCompleted,
          "border-blue-300": isScheduled && !isOverdue,
        },
        className
      )}
      onClick={handleClick}
    >
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Badge 
            variant="outline" 
            className={cn(
              "mb-2 capitalize",
              {
                "bg-destructive/10 text-destructive border-destructive/20": isOverdue,
                "bg-green-100 text-green-700 border-green-200": isCompleted,
                "bg-blue-100 text-blue-700 border-blue-200": isScheduled && !isOverdue,
              }
            )}
          >
            <span className="flex items-center">
              {getStatusIcon()}
              <span className="ml-1">{getStatusLabel()}</span>
            </span>
          </Badge>
          
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge variant="secondary" className="capitalize">
                  <span className="flex items-center gap-1">
                    {getTypeIcon()}
                    <span>{inspection.type.replace('-', ' ')}</span>
                  </span>
                </Badge>
              </TooltipTrigger>
              <TooltipContent>
                <p>Inspection Type</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        
        <CardTitle className="text-lg">{hive?.name}</CardTitle>
        <CardDescription className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          <span>{format(inspectionDate, 'EEEE, MMMM d, yyyy')}</span>
        </CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="space-y-2">
          <div className="text-sm text-muted-foreground">
            <span className="font-medium">Apiary:</span> {apiary?.name} ({apiary?.location})
          </div>
          
          {inspection.notes && (
            <div className="text-sm border-l-2 border-muted pl-3 py-1 italic">
              {inspection.notes.length > 100 
                ? `${inspection.notes.substring(0, 100)}...` 
                : inspection.notes}
            </div>
          )}
          
          {isCompleted && inspection.findings && (
            <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-1">
                <Shield className="h-3.5 w-3.5 text-blue-600" />
                <span>Queen: {inspection.findings.queenSighted ? "Sighted" : "Not sighted"}</span>
              </div>
              <div className="flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-amber-600" />
                <span>Honey: {inspection.findings.honeyStores}/5</span>
              </div>
              <div className="flex items-center gap-1">
                <BarChart className="h-3.5 w-3.5 text-purple-600" />
                <span>Brood: {inspection.findings.broodPattern}/5</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertOctagon className="h-3.5 w-3.5 text-red-600" />
                <span>Pests: {inspection.findings.diseasesSighted ? "Yes" : "No"}</span>
              </div>
            </div>
          )}
        </div>
      </CardContent>
      
      <CardFooter className="flex justify-between items-center pt-2">
        <span className="text-xs text-muted-foreground">
          {isCompleted 
            ? `Completed on ${format(new Date(inspection.date), 'MMM d')}`
            : (isOverdue 
              ? `Overdue by ${Math.abs(Math.floor((new Date().getTime() - inspectionDate.getTime()) / (1000 * 60 * 60 * 24)))} days`
              : `Scheduled for ${format(inspectionDate, 'MMM d, h:mm a')}`)
          }
        </span>
        
        <Button size="sm" variant="outline" className="h-8 gap-1" onClick={(e) => {
          e.stopPropagation();
          handleClick();
        }}>
          <span>Details</span> 
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InspectionCard; 