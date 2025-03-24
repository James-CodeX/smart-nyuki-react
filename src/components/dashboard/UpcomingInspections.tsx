import React from 'react';
import { format } from 'date-fns';
import { Calendar, CheckCircle2, ClipboardList, AlertCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Inspection, getHiveById, getApiaryById } from '@/utils/mockData';
import { cn } from '@/lib/utils';

interface UpcomingInspectionsProps {
  inspections: Inspection[];
  maxItems?: number;
  className?: string;
  onViewAll?: () => void;
  onViewInspection?: (inspection: Inspection) => void;
}

const UpcomingInspections: React.FC<UpcomingInspectionsProps> = ({
  inspections,
  maxItems = 5,
  className,
  onViewAll,
  onViewInspection
}) => {
  const statusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case 'overdue':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'scheduled':
      default:
        return <Clock className="h-4 w-4 text-blue-600" />;
    }
  };

  const statusClass = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'overdue':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'scheduled':
      default:
        return 'bg-blue-100 text-blue-700 border-blue-200';
    }
  };

  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-md flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          Upcoming Inspections
        </CardTitle>
        {onViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll} className="text-xs h-7 px-2">
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[290px]">
          {inspections.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-[200px] px-4 py-6 text-center">
              <div className="p-3 bg-muted/40 rounded-full mb-3">
                <ClipboardList className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-sm font-medium">No upcoming inspections</h3>
              <p className="text-xs text-muted-foreground mt-1">
                All inspections are up to date
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {inspections.slice(0, maxItems).map((inspection) => {
                const hive = getHiveById(inspection.apiaryId, inspection.hiveId);
                const apiary = getApiaryById(inspection.apiaryId);
                const formattedDate = format(new Date(inspection.date), 'MMM dd, yyyy');
                
                return (
                  <div 
                    key={inspection.id} 
                    className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors cursor-pointer"
                    onClick={() => onViewInspection?.(inspection)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-full",
                        statusClass(inspection.status).replace('text-', 'bg-').replace('700', '100')
                      )}>
                        {statusIcon(inspection.status)}
                      </div>
                      <div>
                        <h4 className="text-sm font-medium capitalize">
                          {inspection.type.replace('-', ' ')}
                        </h4>
                        <p className="text-xs text-muted-foreground">
                          {hive?.name} in {apiary?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end">
                      <Badge variant="outline" className={cn(
                        "text-xs capitalize",
                        statusClass(inspection.status)
                      )}>
                        {inspection.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground mt-1">{formattedDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default UpcomingInspections; 