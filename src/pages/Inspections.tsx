import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isPast } from 'date-fns';
import { 
  Plus, 
  Search, 
  ClipboardCheck, 
  CalendarDays, 
  Calendar,
  CheckCircle2, 
  Clock
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
import PageTransition from '@/components/PageTransition';
import InspectionCard from '@/components/inspections/InspectionCard';
import InspectionCalendar, { CalendarInspection } from '@/components/inspections/InspectionCalendar';
import * as inspectionService from '@/services/inspectionService';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const Inspections = () => {
  const navigate = useNavigate();
  const [inspections, setInspections] = useState<inspectionService.InspectionWithHiveDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [inspectionToDelete, setInspectionToDelete] = useState<string | null>(null);
  const [isNewInspectionOpen, setIsNewInspectionOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const isMobile = useMediaQuery('(max-width: 640px)');

  useEffect(() => {
    fetchInspections();
  }, []);

  const fetchInspections = async () => {
    try {
      setLoading(true);
      const data = await inspectionService.getAllInspections();
      setInspections(data);
    } catch (error) {
      console.error('Error fetching inspections:', error);
      toast({
        title: "Error",
        description: "Failed to load inspections",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
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
    if (isPast(inspectionDate)) {
      return 'completed';
    }
    return 'scheduled';
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
          return matchesSearch && status === 'scheduled';
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
              View and manage your hive inspections
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={() => setIsNewInspectionOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              New Inspection
            </Button>
          </div>
        </div>

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

        {/* This placeholder would be replaced with an actual new inspection form component */}
        <Dialog open={isNewInspectionOpen} onOpenChange={setIsNewInspectionOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>New Inspection</DialogTitle>
              <DialogDescription>
                {selectedDate 
                  ? `Create a new inspection for ${format(selectedDate, 'MMMM d, yyyy')}`
                  : 'Create a new hive inspection record'}
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <p className="text-center text-muted-foreground">
                The inspection form component would be integrated here
              </p>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setIsNewInspectionOpen(false);
                setSelectedDate(null);
              }}>
                Cancel
              </Button>
              <Button type="submit">Create Inspection</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  );
};

export default Inspections; 