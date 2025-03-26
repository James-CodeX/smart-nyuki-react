import React from 'react';
import { format, formatDistance, isPast, parseISO } from 'date-fns';
import { 
  Calendar, 
  CalendarDays, 
  ChevronRight, 
  Clock, 
  MoreVertical, 
  AlertCircle, 
  CheckCircle2, 
  Edit, 
  Trash2, 
  AlertTriangle,
  Clipboard,
  BugPlay,
  ThermometerSun,
  Weight,
  Ruler
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { InspectionWithHiveDetails } from '@/services/inspectionService';

interface InspectionCardProps {
  inspection: InspectionWithHiveDetails;
  onClick: () => void;
  onDelete: () => void;
}

const InspectionCard: React.FC<InspectionCardProps> = ({
  inspection,
  onClick,
  onDelete,
}) => {
  const inspectionDate = parseISO(inspection.inspection_date);
  const isCompleted = isPast(inspectionDate);
  
  // Determine status for badge
  let status: 'completed' | 'scheduled' | 'overdue' = 'scheduled';
  if (isPast(inspectionDate)) {
    status = 'completed';
  }
  
  // Function to get the badge variant based on inspection status
  const getBadgeVariant = () => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'overdue':
        return 'destructive';
      default:
        return 'outline';
    }
  };
  
  // Function to get the appropriate icon based on inspection status
  const getStatusIcon = () => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };
  
  // Generate insights based on inspection data
  const getInsights = () => {
    const insights = [];
    
    if (inspection.disease_signs) {
      insights.push({
        icon: <BugPlay className="h-4 w-4 text-destructive" />,
        text: 'Disease signs present',
        variant: 'destructive' as const
      });
    }
    
    if (inspection.queen_seen) {
      insights.push({
        icon: <CheckCircle2 className="h-4 w-4 text-success" />,
        text: 'Queen sighted',
        variant: 'success' as const
      });
    }
    
    if (inspection.temperature) {
      insights.push({
        icon: <ThermometerSun className="h-4 w-4" />,
        text: `${inspection.temperature}°C`,
        variant: 'secondary' as const
      });
    }
    
    if (inspection.weight) {
      insights.push({
        icon: <Weight className="h-4 w-4" />,
        text: `${inspection.weight} kg`,
        variant: 'secondary' as const
      });
    }
    
    if (inspection.hive_strength) {
      insights.push({
        icon: <Ruler className="h-4 w-4" />,
        text: `Strength: ${inspection.hive_strength}/10`,
        variant: 'secondary' as const
      });
    }
    
    return insights;
  };
  
  const insights = getInsights();
  
  return (
    <Card className="h-full overflow-hidden flex flex-col hover:border-primary/50 transition-colors">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-start">
          <Badge variant={getBadgeVariant()} className="flex gap-1 items-center mb-2">
            {getStatusIcon()}
            <span>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
          </Badge>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
                <span className="sr-only">Open menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Actions</DropdownMenuLabel>
              <DropdownMenuItem onClick={(e) => {
                e.stopPropagation();
                onClick();
              }}>
                <Clipboard className="h-4 w-4 mr-2" />
                View details
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <CardTitle className="line-clamp-1 text-lg">
          {inspection.hive_name}
        </CardTitle>
        <CardDescription className="flex items-center gap-1">
          <Calendar className="h-3.5 w-3.5" />
          {format(inspectionDate, 'MMM d, yyyy')}
        </CardDescription>
      </CardHeader>
      
      <CardContent className="pb-0 flex-grow">
        <div className="flex flex-wrap gap-2 mb-2">
          {insights.map((insight, i) => (
            <Badge key={i} variant={insight.variant} className="flex gap-1 items-center">
              {insight.icon}
              <span>{insight.text}</span>
            </Badge>
          ))}
        </div>
        
        {inspection.notes && (
          <p className="text-sm text-muted-foreground line-clamp-3 mt-2">
            {inspection.notes}
          </p>
        )}
      </CardContent>
      
      <CardFooter className="pt-4">
        <Button variant="ghost" className="w-full justify-between" onClick={onClick}>
          <span>View Details</span>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
};

export default InspectionCard; 