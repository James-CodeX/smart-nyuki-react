import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isPast, addDays } from 'date-fns';
import { 
  Plus, 
  Search, 
  ClipboardCheck, 
  CalendarDays, 
  Calendar,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/components/ui/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import PageTransition from '@/components/PageTransition';
import InspectionCard from '@/components/inspections/InspectionCard';
import InspectionCalendar, { CalendarInspection } from '@/components/inspections/InspectionCalendar';
import NewInspectionForm from '@/components/inspections/NewInspectionForm';
import * as inspectionService from '@/services/inspectionService';
import * as apiaryService from '@/services/apiaryService';
import * as hiveService from '@/services/hiveService';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const Inspections = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<inspectionService.InspectionWithHiveDetails[]>([]);
  const [apiaries, setApiaries] = useState<any[]>([]);
  const [hives, setHives] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<string | null>(null);
  const [isNewInspectionOpen, setIsNewInspectionOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isCompleteInspectionOpen, setIsCompleteInspectionOpen] = useState(false);
  const [inspectionToComplete, setInspectionToComplete] = useState<inspectionService.InspectionWithHiveDetails | null>(null);
  const isMobile = useMediaQuery('(max-width: 640px)');

  useEffect(() => {
    fetchData();
  }, []);
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const [inspectionsData, apiariesData, hivesData] = await Promise.all([
        inspectionService.getAllInspections(),
        apiaryService.getAllApiaries(),
        hiveService.getAllHives()
      ]);
      
      setInspections(inspectionsData);
      setApiaries(apiariesData);
      setHives(hivesData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load inspections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleInspectionAdded = async () => {
    await fetchData();
    setIsNewInspectionOpen(false);
    setSelectedDate(null);
    toast({
      title: "Success",
      description: "Inspection scheduled successfully",
    });
  };

  const handleDeleteInspection = async (id: string) => {
    setInspectionToDelete(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!inspectionToDelete) return;

    try {
      await inspectionService.deleteInspection(inspectionToDelete);
      setInspections(inspections.filter(i => i.id !== inspectionToDelete));
      toast({
        title: "Success",
        description: "Inspection deleted successfully",
      });
    } catch (error) {
      console.error('Error deleting inspection:', error);
      toast({
        title: "Error",
        description: "Failed to delete inspection",
        variant: "destructive",
      });
    } finally {
      setIsDeleteDialogOpen(false);
      setInspectionToDelete(null);
    }
  };

  const getInspectionStatus = (inspection: inspectionService.InspectionWithHiveDetails): 'completed' | 'scheduled' | 'overdue' => {
    const inspectionDate = parseISO(inspection.inspection_date);
    const today = new Date();
    
    // Consider an inspection completed if there are certain fields filled in
    if (inspection.notes || inspection.queen_seen || inspection.eggs_seen || inspection.larvae_seen) {
      return 'completed';
    }
    
    // If it's in the past but not completed, it's overdue
    if (isPast(inspectionDate) && inspectionDate < today) {
      return 'overdue';
    }
    
    return 'scheduled';
  };

  const handleCompleteInspection = (inspection: inspectionService.InspectionWithHiveDetails) => {
    setInspectionToComplete(inspection);
    setIsCompleteInspectionOpen(true);
  };

  // Transform inspections to the format expected by the calendar component
  const calendarInspections: CalendarInspection[] = inspections.map(inspection => ({
    id: inspection.id,
    apiaryId: inspection.apiary_id,
    apiaryName: inspection.apiary_name,
    hiveId: inspection.hive_id,
    hiveName: inspection.hive_name,
    date: inspection.inspection_date,
    status: getInspectionStatus(inspection),
    type: 'inspection'
  }));

  const handleDayClick = (date: Date, dayInspections: CalendarInspection[]) => {
    if (dayInspections.length === 1) {
      // If there's only one inspection on this day, navigate directly to it
      navigate(`/inspections/${dayInspections[0].id}`);
    } else if (dayInspections.length > 1) {
      // If there are multiple inspections, we could show them in a dialog or navigate to filtered view
      setActiveTab('all');
      // Set search query to this date to filter inspections
      setSearchQuery(format(date, 'yyyy-MM-dd'));
    } else {
      // If no inspections, we could open the new inspection form with this date pre-selected
      setSelectedDate(date);
      setIsNewInspectionOpen(true);
    }
  };

  const handleAddClick = (date: Date) => {
    setSelectedDate(date);
    setIsNewInspectionOpen(true);
  };

  // Get upcoming inspections due in the next 7 days
  const upcomingInspections = inspections.filter(inspection => {
    const inspectionDate = parseISO(inspection.inspection_date);
    const nextWeek = addDays(new Date(), 7);
    const status = getInspectionStatus(inspection);
    
    return (status === 'scheduled' || status === 'overdue') && 
           inspectionDate <= nextWeek;
  });

  const filteredInspections = inspections
    .filter(inspection => {
      const matchesSearch = inspection.hive_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inspection.apiary_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inspection.notes?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        format(parseISO(inspection.inspection_date), 'yyyy-MM-dd').includes(searchQuery);

      const status = getInspectionStatus(inspection);
      
      switch (activeTab) {
        case 'completed':
          return matchesSearch && status === 'completed';
        case 'upcoming':
          return matchesSearch && (status === 'scheduled' || status === 'overdue');
        case 'overdue':
          return matchesSearch && status === 'overdue';
        default:
          return matchesSearch;
      }
    })
    .sort((a, b) => parseISO(b.inspection_date).getTime() - parseISO(a.inspection_date).getTime());

  const renderEmptyState = (title: string, description: string, icon: React.ReactNode) => (
    <div className="flex flex-col items-center justify-center h-48 text-center">
      <div className="h-12 w-12 text-muted-foreground mb-4">
        {icon}
      </div>
      <h3 className="text-lg font-medium">{title}</h3>
      <p className="text-muted-foreground">
        {description}
      </p>
    </div>
  );
  
  return (
    <PageTransition>
      <div className="container max-w-7xl py-6 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Inspections</h1>
            <p className="text-muted-foreground">
              Schedule, track, and manage your hive inspections
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button onClick={() => setIsNewInspectionOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Inspection
                  </Button>
          </div>
        </div>
        
        {/* Upcoming Inspections Alert */}
        {upcomingInspections.length > 0 && (
          <div className="bg-muted p-4 rounded-lg border">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-5 w-5 text-amber-500" />
              <h3 className="font-medium">Upcoming Inspections</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              You have {upcomingInspections.length} inspection{upcomingInspections.length > 1 ? 's' : ''} scheduled in the next 7 days.
            </p>
            <div className="flex flex-wrap gap-2">
              {upcomingInspections.slice(0, 3).map(inspection => (
                <TooltipProvider key={inspection.id}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-xs"
                        onClick={() => navigate(`/inspections/${inspection.id}`)}
                      >
                        {inspection.hive_name} • {format(parseISO(inspection.inspection_date), 'MMM dd')}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs">
                        <p className="font-medium">{inspection.hive_name}</p>
                        <p>{format(parseISO(inspection.inspection_date), 'PPP')}</p>
                        <p className="text-muted-foreground">{inspection.apiary_name}</p>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ))}
              {upcomingInspections.length > 3 && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => setActiveTab('upcoming')}
                >
                  +{upcomingInspections.length - 3} more
                </Button>
              )}
            </div>
        </div>
        )}

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full max-w-sm items-center space-x-2">
                  <Input
                    placeholder="Search inspections..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full sm:w-[300px]"
              />
            </div>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-2 w-full md:w-auto">
              <TabsTrigger value="all" className="flex gap-2">
                <ClipboardCheck className="h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger value="upcoming" className="flex gap-2">
                <CalendarDays className="h-4 w-4" />
                Upcoming
              </TabsTrigger>
              <TabsTrigger value="overdue" className="flex gap-2">
                <AlertCircle className="h-4 w-4" />
                Overdue
              </TabsTrigger>
              <TabsTrigger value="completed" className="flex gap-2">
                <CheckCircle2 className="h-4 w-4" />
                Completed
              </TabsTrigger>
              <TabsTrigger value="calendar" className="flex gap-2">
                <Calendar className="h-4 w-4" />
                Calendar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="all" className="pt-4">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredInspections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInspections.map((inspection) => (
                    <InspectionCard
                      key={inspection.id}
                      inspection={inspection}
                      onClick={() => navigate(`/inspections/${inspection.id}`)}
                      onDelete={() => handleDeleteInspection(inspection.id)}
                      onComplete={getInspectionStatus(inspection) !== 'completed' ? 
                        () => handleCompleteInspection(inspection) : undefined}
                      status={getInspectionStatus(inspection)}
                    />
                  ))}
                </div>
              ) : (
                renderEmptyState(
                  "No inspections found",
                  searchQuery
                    ? "No inspections match your search criteria"
                    : "You haven't recorded any inspections yet",
                  <ClipboardCheck className="h-full w-full" />
                )
              )}
            </TabsContent>
            
            <TabsContent value="upcoming" className="pt-4">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredInspections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInspections.map((inspection) => (
                    <InspectionCard
                      key={inspection.id}
                      inspection={inspection}
                      onClick={() => navigate(`/inspections/${inspection.id}`)}
                      onDelete={() => handleDeleteInspection(inspection.id)}
                      onComplete={() => handleCompleteInspection(inspection)}
                      status={getInspectionStatus(inspection)}
                    />
                  ))}
                </div>
              ) : (
                renderEmptyState(
                  "No upcoming inspections",
                  searchQuery
                    ? "No upcoming inspections match your search criteria"
                    : "You don't have any upcoming inspections scheduled",
                  <CalendarDays className="h-full w-full" />
                )
              )}
            </TabsContent>
            
            <TabsContent value="overdue" className="pt-4">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredInspections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInspections.map((inspection) => (
                    <InspectionCard
                      key={inspection.id}
                      inspection={inspection}
                      onClick={() => navigate(`/inspections/${inspection.id}`)}
                      onDelete={() => handleDeleteInspection(inspection.id)}
                      onComplete={() => handleCompleteInspection(inspection)}
                      status={getInspectionStatus(inspection)}
                    />
                  ))}
                </div>
              ) : (
                renderEmptyState(
                  "No overdue inspections",
                  searchQuery
                    ? "No overdue inspections match your search criteria"
                    : "You don't have any overdue inspections",
                  <AlertCircle className="h-full w-full" />
                )
              )}
            </TabsContent>
            
            <TabsContent value="completed" className="pt-4">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : filteredInspections.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredInspections.map((inspection) => (
                    <InspectionCard
                      key={inspection.id}
                      inspection={inspection}
                      onClick={() => navigate(`/inspections/${inspection.id}`)}
                      onDelete={() => handleDeleteInspection(inspection.id)}
                      status={getInspectionStatus(inspection)}
                    />
                  ))}
                </div>
              ) : (
                renderEmptyState(
                  "No completed inspections",
                  searchQuery
                    ? "No completed inspections match your search criteria"
                    : "You haven't completed any inspections yet",
                  <CheckCircle2 className="h-full w-full" />
                )
              )}
            </TabsContent>

            <TabsContent value="calendar" className="pt-4">
              {loading ? (
                <div className="flex justify-center items-center h-48">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                </div>
              ) : (
                <div className={isMobile ? "w-full -mx-4 sm:mx-0 sm:overflow-x-auto" : "overflow-x-auto"}>
                  <div className={isMobile ? "w-full" : "min-w-[800px]"}>
                    <InspectionCalendar 
                      inspections={calendarInspections}
                      onDayClick={handleDayClick}
                      onAddClick={handleAddClick}
                          />
                        </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
        
        <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
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
              <Button variant="destructive" onClick={confirmDelete}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* New Inspection Form Dialog */}
        <Dialog open={isNewInspectionOpen} onOpenChange={setIsNewInspectionOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Schedule New Inspection</DialogTitle>
              <DialogDescription>
                {selectedDate 
                  ? `Plan an inspection for ${format(selectedDate, 'MMMM d, yyyy')}`
                  : 'Set a date and time for your next hive inspection'}
              </DialogDescription>
            </DialogHeader>
            <div className="max-h-[60vh] overflow-y-auto">
              <NewInspectionForm 
                onInspectionAdded={handleInspectionAdded} 
                onCancel={() => {
                  setIsNewInspectionOpen(false);
                  setSelectedDate(null);
                }} 
                apiaries={apiaries}
                hives={hives}
                initialDate={selectedDate}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Complete Inspection Dialog */}
        <Dialog open={isCompleteInspectionOpen} onOpenChange={setIsCompleteInspectionOpen}>
          <DialogContent className="sm:max-w-[600px]">
                  <DialogHeader>
              <DialogTitle>Complete Inspection</DialogTitle>
                    <DialogDescription>
                {inspectionToComplete && (
                  <>Record findings for the inspection of {inspectionToComplete.hive_name} on {format(parseISO(inspectionToComplete.inspection_date), 'MMMM d, yyyy')}</>
                )}
                    </DialogDescription>
                  </DialogHeader>
            
            <div className="space-y-4 py-4">
              <div className="flex justify-between items-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setIsCompleteInspectionOpen(false);
                    setInspectionToComplete(null);
                    if (inspectionToComplete) {
                      navigate(`/inspections/${inspectionToComplete.id}`);
                    }
                  }}
                  className="w-full"
                >
                  Go to Inspection Page to Complete
                </Button>
              </div>
              
              <div className="bg-muted rounded-md p-4 text-sm">
                <p className="font-medium mb-2">About completing inspections:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Record your findings on the inspection page</li>
                  <li>Include details like queen sighting, brood pattern, and hive health</li>
                  <li>Add notes for future reference</li>
                  <li>Upload photos of the inspection</li>
                </ul>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsCompleteInspectionOpen(false);
                setInspectionToComplete(null);
              }}>
                Cancel
              </Button>
            </DialogFooter>
                </DialogContent>
              </Dialog>
      </div>
    </PageTransition>
  );
};

export default Inspections; 