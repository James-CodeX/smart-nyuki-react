import React, { useState, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, MoreHorizontal, Plus } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useMediaQuery } from '@/hooks/useMediaQuery';

// Define a calendar-friendly inspection type that's used within the calendar component
export interface CalendarInspection {
  id: string;
  date: string;
  apiaryId: string;
  apiaryName: string;
  hiveId: string;
  hiveName: string;
  status: 'completed' | 'scheduled' | 'overdue';
  type: string;
}

interface CalendarDayProps {
  day: Date;
  inspectionsForDay: CalendarInspection[];
  onClick?: () => void;
  currentMonth: Date;
  onAddClick?: (date: Date) => void;
  isMobile: boolean;
}

const CalendarDay: React.FC<CalendarDayProps> = ({ 
  day, 
  inspectionsForDay, 
  onClick, 
  currentMonth,
  onAddClick,
  isMobile
}) => {
  const isCurrentMonth = isSameMonth(day, currentMonth);
  const isToday_ = isToday(day);
  
  return (
    <div 
      className={cn(
        "border p-1 relative",
        isMobile ? "h-16" : "h-28",
        !isCurrentMonth && "bg-muted/50 text-muted-foreground",
        isToday_ && "border-primary",
        "hover:bg-muted/20 cursor-pointer transition-colors"
      )}
      onClick={onClick}
    >
      <div className="flex justify-between items-start">
        <span 
          className={cn(
            "text-sm font-medium h-6 w-6 flex items-center justify-center rounded-full",
            isToday_ && "bg-primary text-primary-foreground"
          )}
        >
          {format(day, 'd')}
        </span>
        
        {inspectionsForDay.length > 0 && !isMobile && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-5 w-5">
                <MoreHorizontal className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {inspectionsForDay.slice(0, 5).map((inspection) => (
                <DropdownMenuItem key={inspection.id} className="py-2">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold capitalize">
                      {inspection.type}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {inspection.hiveName || 'Unknown Hive'}
                    </span>
                  </div>
                </DropdownMenuItem>
              ))}
              {inspectionsForDay.length > 5 && (
                <DropdownMenuItem disabled>
                  + {inspectionsForDay.length - 5} more
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
      
      <div className={cn(
        "absolute bottom-1 left-1 right-1",
        isMobile && inspectionsForDay.length > 0 && "mt-1"
      )}>
        {inspectionsForDay.length > 0 ? (
          <div className="flex flex-col gap-0.5">
            {isMobile ? (
              <div className={cn(
                "rounded-full w-3 h-3 mx-auto mt-1",
                inspectionsForDay.some(i => i.status === 'overdue') 
                  ? "bg-destructive/80" 
                  : inspectionsForDay.some(i => i.status === 'scheduled')
                    ? "bg-blue-500"
                    : "bg-green-500"
              )}></div>
            ) : (
              <>
                {inspectionsForDay.slice(0, 3).map((inspection) => {
                  const statusColor = inspection.status === 'completed' 
                    ? "bg-green-100 text-green-700 border-green-200"
                    : inspection.status === 'overdue'
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : "bg-blue-100 text-blue-700 border-blue-200";
                      
                  return (
                    <TooltipProvider key={inspection.id} delayDuration={300}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div 
                            className={cn(
                              "text-xs px-1.5 py-0.5 rounded truncate border", 
                              statusColor
                            )}
                          >
                            {inspection.hiveName || 'Unknown'}
                          </div>
                        </TooltipTrigger>
                        <TooltipContent side="right">
                          <div className="text-xs">
                            <p className="font-medium capitalize">{inspection.type}</p>
                            <p>{inspection.hiveName}, {inspection.apiaryName}</p>
                            <p className="text-muted-foreground mt-1">{format(new Date(inspection.date), 'h:mm a')}</p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
                {inspectionsForDay.length > 3 && (
                  <div className="text-xs text-center text-muted-foreground">
                    + {inspectionsForDay.length - 3} more
                  </div>
                )}
              </>
            )}
          </div>
        ) : isCurrentMonth && !isMobile && (
          <div className="flex items-center justify-center h-full mt-4">
            <Button 
              variant="ghost" 
              size="sm" 
              className="text-xs text-muted-foreground h-6 hover:text-primary"
              onClick={(e) => {
                e.stopPropagation();
                if (onAddClick) onAddClick(day);
              }}
            >
              <Plus className="h-3 w-3 mr-1" />
              Add
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

interface InspectionCalendarProps {
  inspections: CalendarInspection[];
  onDayClick?: (date: Date, inspections: CalendarInspection[]) => void;
  onAddClick?: (date: Date) => void;
}

const InspectionCalendar: React.FC<InspectionCalendarProps> = ({ 
  inspections,
  onDayClick,
  onAddClick
}) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const isMobile = useMediaQuery('(max-width: 640px)');
  
  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth)
  });
  
  const firstDayOfMonth = startOfMonth(currentMonth).getDay();
  const dayNames = isMobile 
    ? ['S', 'M', 'T', 'W', 'T', 'F', 'S']
    : ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  
  // Get previous month's days to fill the first week
  const prevMonthDays = eachDayOfInterval({
    start: subMonths(startOfMonth(currentMonth), 1),
    end: subMonths(endOfMonth(currentMonth), 1)
  }).slice(-firstDayOfMonth);
  
  // Get next month's days to fill the last week
  const lastDay = days[days.length - 1].getDay();
  const nextMonthDays = eachDayOfInterval({
    start: addMonths(startOfMonth(currentMonth), 1),
    end: addMonths(endOfMonth(currentMonth), 1)
  }).slice(0, 6 - lastDay);
  
  // Combine all days
  const allDays = [...prevMonthDays, ...days, ...nextMonthDays];
  
  // Group inspections by day
  const inspectionsByDay = allDays.map(day => {
    const dayInspections = inspections.filter(inspection => 
      isSameDay(new Date(inspection.date), day)
    );
    return { day, inspections: dayInspections };
  });
  
  const handlePrevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };
  
  const handleNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };
  
  const handleDayClick = (day: Date, dayInspections: CalendarInspection[]) => {
    if (onDayClick) {
      onDayClick(day, dayInspections);
    }
  };

  const handleAddButtonClick = (day: Date) => {
    if (onAddClick) {
      onAddClick(day);
    }
  };
  
  return (
    <Card className="p-2 sm:p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-3 mb-4">
        <h2 className="text-lg font-semibold text-center sm:text-left">
          {format(currentMonth, 'MMMM yyyy')}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={handlePrevMonth} className="h-8 w-8 sm:h-9 sm:w-9">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setCurrentMonth(new Date())}
            className="text-xs sm:text-sm"
          >
            Today
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth} className="h-8 w-8 sm:h-9 sm:w-9">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-7 gap-px border-b mb-1">
        {dayNames.map(day => (
          <div key={day} className="text-center p-1 sm:p-2 text-xs sm:text-sm font-medium">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-px">
        {inspectionsByDay.map(({ day, inspections: dayInspections }) => (
          <CalendarDay 
            key={day.toISOString()} 
            day={day} 
            inspectionsForDay={dayInspections}
            currentMonth={currentMonth}
            onClick={() => handleDayClick(day, dayInspections)}
            onAddClick={handleAddButtonClick}
            isMobile={isMobile}
          />
        ))}
      </div>
      
      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-blue-100 border border-blue-200"></div>
          <span className="text-muted-foreground">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-green-100 border border-green-200"></div>
          <span className="text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-3 w-3 rounded-full bg-destructive/10 border border-destructive/20"></div>
          <span className="text-muted-foreground">Overdue</span>
        </div>
      </div>

      {isMobile && (
        <div className="mt-4 p-2 bg-muted/30 rounded-md text-xs text-center text-muted-foreground">
          Tip: Tap on a day with inspections to view details
        </div>
      )}
    </Card>
  );
};

export default InspectionCalendar; 