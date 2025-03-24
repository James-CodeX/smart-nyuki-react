import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, isAfter, isBefore, isPast, addDays } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  CalendarDays, 
  Calendar, 
  ClipboardCheck, 
  ClipboardList, 
  Clock, 
  Plus, 
  Search, 
  SlidersHorizontal, 
  CheckCircle2,
  AlertCircle,
  X,
  Filter,
  ArrowUpDown,
  Crown
} from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { 
  getAllInspections, 
  getScheduledInspections,
  getCompletedInspections,
  getOverdueInspections,
  getUpcomingInspections,
  getAllApiaries,
  getAllHives,
  Inspection
} from '@/utils/mockData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';

import { cn } from '@/lib/utils';
import InspectionCard from '@/components/inspections/InspectionCard';
import NewInspectionForm from '@/components/inspections/NewInspectionForm';
import InspectionCalendar from '@/components/inspections/InspectionCalendar';
import InspectionDetailDrawer from '@/components/inspections/InspectionDetailDrawer';
import { toast } from '@/components/ui/use-toast';
import InspectionStatCard from '@/components/inspections/InspectionStatCard';
import { EmptyState } from '@/components/ui/empty-state';
import emptyInspectionSVG from '@/assets/illustrations/empty-inspection.svg';

const Inspections = () => {
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedApiaryId, setSelectedApiaryId] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [timeframe, setTimeframe] = useState('all');
  const [isNewInspectionOpen, setIsNewInspectionOpen] = useState(false);
  const [inspectionDetailOpen, setInspectionDetailOpen] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const [inspections, setInspections] = useState<Inspection[]>([]);
  
  const navigate = useNavigate();
  const apiaries = getAllApiaries();
  const hives = getAllHives();
  
  const [selectedInspection, setSelectedInspection] = useState<Inspection | null>(null);
  const [isDetailDrawerOpen, setIsDetailDrawerOpen] = useState<boolean>(false);
  
  // Load inspection data
  useEffect(() => {
    const loadData = () => {
      let data: Inspection[] = [];
      
      // Get different inspection categories based on active tab
      switch (activeTab) {
        case 'upcoming':
          data = [...getUpcomingInspections(30), ...getOverdueInspections()];
          break;
        case 'completed':
          data = getCompletedInspections();
          break;
        case 'all':
          data = getAllInspections();
          break;
        default:
          data = getAllInspections();
      }
      
      // Apply apiary filter
      if (selectedApiaryId !== 'all') {
        data = data.filter(inspection => inspection.apiaryId === selectedApiaryId);
      }
      
      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        data = data.filter(inspection => {
          const hive = hives.find(h => h.id === inspection.hiveId);
          const apiary = apiaries.find(a => a.id === inspection.apiaryId);
          
          return (
            hive?.name.toLowerCase().includes(query) ||
            apiary?.name.toLowerCase().includes(query) ||
            inspection.type.toLowerCase().includes(query) ||
            inspection.notes?.toLowerCase().includes(query)
          );
        });
      }
      
      // Apply time filter
      if (timeframe !== 'all') {
        const now = new Date();
        let dateLimit;
        
        switch (timeframe) {
          case 'week':
            dateLimit = addDays(now, 7);
            break;
          case 'month':
            dateLimit = addDays(now, 30);
            break;
          case 'past':
            data = data.filter(insp => {
              const inspDate = new Date(insp.date);
              return inspDate < now;
            });
            break;
          default:
            // No limit for 'all'
            break;
        }
        
        if (dateLimit && timeframe !== 'past') {
          data = data.filter(insp => {
            const inspDate = new Date(insp.date);
            return inspDate >= now && inspDate <= dateLimit;
          });
        }
      }
      
      // Sort by date
      data.sort((a, b) => {
        const dateA = new Date(a.date);
        const dateB = new Date(b.date);
        
        // Show overdue first, then upcoming by date
        if (a.status === 'overdue' && b.status !== 'overdue') return -1;
        if (a.status !== 'overdue' && b.status === 'overdue') return 1;
        
        // Next prioritize completed vs scheduled
        if (a.status === 'completed' && b.status !== 'completed') return 1;
        if (a.status !== 'completed' && b.status === 'completed') return -1;
        
        // Then sort by date
        return dateA.getTime() - dateB.getTime();
      });
      
      setInspections(data);
      setLoading(false);
    };
    
    // Simulate API call
    const timer = setTimeout(() => {
      loadData();
    }, 500);
    
    return () => clearTimeout(timer);
  }, [activeTab, selectedApiaryId, searchQuery, timeframe]);
  
  // Handler for when a new inspection is added
  const handleInspectionAdded = () => {
    // Reload the data
    setLoading(true);
  };
  
  // Calculate stats
  const scheduled = getScheduledInspections().length;
  const overdue = getOverdueInspections().length;
  const completed = getCompletedInspections().length;
  const upcoming = getUpcomingInspections(7).length;
  
  const openInspectionDetail = (inspection: Inspection) => {
    setSelectedInspection(inspection);
    setIsDetailDrawerOpen(true);
  };
  
  const handleStatusChange = (inspection: Inspection, newStatus: 'scheduled' | 'completed' | 'cancelled') => {
    // Mock implementation - in a real app this would update the database
    console.log(`Changing inspection ${inspection.id} status to ${newStatus}`);
    
    // Create a copy of inspections with the updated status
    const updatedInspections = inspections.map(insp => 
      insp.id === inspection.id ? {...insp, status: newStatus} : insp
    );
    
    setInspections(updatedInspections);
    
    // If it's a detail view, update the selected inspection too
    if (selectedInspection && selectedInspection.id === inspection.id) {
      setSelectedInspection({...selectedInspection, status: newStatus});
    }
    
    toast({
      title: "Inspection updated",
      description: `The inspection has been marked as ${newStatus}.`,
      variant: "default",
    });
  };
  
  const handleDeleteInspection = (inspection: Inspection) => {
    // Mock implementation - in a real app this would delete from the database
    console.log(`Deleting inspection ${inspection.id}`);
    
    // Filter out the deleted inspection
    const remainingInspections = inspections.filter(insp => insp.id !== inspection.id);
    setInspections(remainingInspections);
    
    // Close the detail drawer if open
    if (isDetailDrawerOpen) {
      setIsDetailDrawerOpen(false);
    }
    
    toast({
      title: "Inspection deleted",
      description: "The inspection has been deleted successfully.",
      variant: "default",
    });
  };
  
  if (loading) {
    return (
      <PageTransition>
        <div className="container max-w-7xl pt-16 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
            <div className="space-y-2">
              <div className="h-8 w-64 bg-muted animate-pulse rounded-md"></div>
              <div className="h-4 w-80 bg-muted animate-pulse rounded-md"></div>
            </div>
            <div className="flex gap-3">
              <div className="h-9 w-40 bg-muted animate-pulse rounded-md"></div>
              <div className="h-9 w-40 bg-muted animate-pulse rounded-md"></div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted animate-pulse rounded-md"></div>
            ))}
          </div>
          
          <div className="space-y-4">
            <div className="h-10 w-full bg-muted animate-pulse rounded-md"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-48 bg-muted animate-pulse rounded-md"></div>
              ))}
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }
  
  return (
    <PageTransition>
      <div className="container max-w-7xl pt-16 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight text-foreground"
            >
              Hive Inspections
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground mt-1"
            >
              Schedule, record, and track all your hive inspections
            </motion.p>
          </div>
          
          <div className="flex flex-col sm:flex-row flex-wrap w-full md:w-auto items-start sm:items-center gap-3">
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search inspections..."
                className="pl-8 w-full md:w-[200px] bg-background"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <div className="flex gap-3 w-full sm:w-auto">
              <Select 
                value={selectedApiaryId} 
                onValueChange={setSelectedApiaryId}
              >
                <SelectTrigger className="w-full sm:w-[180px] border-border">
                  <SelectValue placeholder="Select Apiary" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Apiaries</SelectItem>
                  {apiaries.map(apiary => (
                    <SelectItem key={apiary.id} value={apiary.id}>
                      {apiary.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Button onClick={() => setIsNewInspectionOpen(true)} className="flex-1 sm:flex-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="sm:inline">New Inspection</span>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <InspectionStatCard
            title="Scheduled"
            value={scheduled}
            icon={<Clock className="h-4 w-4" />}
            description="Upcoming inspections"
            colorClass="bg-blue-100 text-blue-700"
          />
          <InspectionStatCard
            title="Overdue"
            value={overdue}
            icon={<AlertCircle className="h-4 w-4" />}
            description="Past due inspections"
            colorClass="bg-destructive/10 text-destructive"
          />
          <InspectionStatCard
            title="Completed"
            value={completed}
            icon={<CheckCircle2 className="h-4 w-4" />}
            description="Finished inspections"
            colorClass="bg-green-100 text-green-700"
          />
          <InspectionStatCard
            title="Next 7 Days"
            value={upcoming}
            icon={<CalendarDays className="h-4 w-4" />}
            description="Coming this week"
            colorClass="bg-purple-100 text-purple-700"
          />
        </div>
        
        {/* Main content */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            <Tabs 
              defaultValue={activeTab}
              className="w-full"
              onValueChange={setActiveTab}
            >
              <TabsList className="grid w-full sm:w-auto grid-cols-3">
                <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-1 w-full sm:w-auto">
                  <Filter className="h-4 w-4" />
                  Filter
                  {timeframe !== 'all' && (
                    <Badge variant="secondary" className="ml-1 px-1">1</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Time Range</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem 
                    onClick={() => setTimeframe('all')}
                    className={cn(timeframe === 'all' && "bg-muted")}
                  >
                    <span className="h-4 w-4 mr-2"></span>
                    All Time
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setTimeframe('week')}
                    className={cn(timeframe === 'week' && "bg-muted")}
                  >
                    <span className="h-4 w-4 mr-2"></span>
                    Next 7 Days
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setTimeframe('month')}
                    className={cn(timeframe === 'month' && "bg-muted")}
                  >
                    <span className="h-4 w-4 mr-2"></span>
                    Next 30 Days
                  </DropdownMenuItem>
                  <DropdownMenuItem 
                    onClick={() => setTimeframe('past')}
                    className={cn(timeframe === 'past' && "bg-muted")}
                  >
                    <span className="h-4 w-4 mr-2"></span>
                    Past Inspections
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setTimeframe('all')}>
                  <X className="h-4 w-4 mr-2" />
                  Clear Filters
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          {inspections.length === 0 ? (
            <EmptyState
              title="No inspections found"
              description={
                activeTab === 'upcoming' 
                  ? "You don't have any upcoming inspections scheduled. Create a new inspection to get started." 
                  : activeTab === 'completed'
                  ? "You haven't completed any inspections yet. Record your first inspection."
                  : "No inspections match your filter criteria. Try adjusting your filters."
              }
              action={{
                label: activeTab === 'completed' ? 'Record Inspection' : 'Schedule Inspection',
                onClick: () => setIsNewInspectionOpen(true),
                icon: <Plus className="h-4 w-4" />
              }}
              image={<img src={emptyInspectionSVG} alt="No inspections" className="w-64 h-64 mb-4" />}
            />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {inspections.map((inspection) => (
                <InspectionCard 
                  key={inspection.id}
                  inspection={inspection}
                  onClick={() => openInspectionDetail(inspection)}
                />
              ))}
            </div>
          )}
        </div>
        
        {/* Calendar View Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <CalendarDays className="h-5 w-5 mr-2 text-primary" />
              Inspection Calendar
            </CardTitle>
            <CardDescription>
              View your upcoming and past inspections in a calendar format
            </CardDescription>
          </CardHeader>
          <CardContent>
            <InspectionCalendar 
              inspections={getAllInspections()}
              onDayClick={(date, inspections) => {
                if (inspections.length > 0) {
                  openInspectionDetail(inspections[0]);
                } else {
                  // Open new inspection form with the selected date
                  setIsNewInspectionOpen(true);
                }
              }}
            />
          </CardContent>
        </Card>
      </div>
      
      {/* New Inspection Form Dialog */}
      <NewInspectionForm
        isOpen={isNewInspectionOpen}
        onClose={() => setIsNewInspectionOpen(false)}
        onSuccess={handleInspectionAdded}
        preSelectedApiaryId={selectedApiaryId !== 'all' ? selectedApiaryId : undefined}
      />
      
      {/* Inspection Details Drawer */}
      <InspectionDetailDrawer
        inspection={selectedInspection}
        isOpen={isDetailDrawerOpen}
        onClose={() => setIsDetailDrawerOpen(false)}
        onEdit={(inspection) => {
          setSelectedInspection(inspection);
          setIsNewInspectionOpen(true);
        }}
        onChangeStatus={handleStatusChange}
        onDelete={handleDeleteInspection}
      />
    </PageTransition>
  );
};

export default Inspections; 