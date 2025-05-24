import React, { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, 
  SlidersHorizontal, 
  Search, 
  AlertCircle,
  ArrowDownAZ, 
  ArrowUpZA, 
  ArrowDownUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import PageTransition from '@/components/layout/PageTransition';
import { useToast } from '@/components/ui/use-toast';
import HiveCard from '@/components/hives/HiveCard';
import AddHiveModal from '@/components/hives/AddHiveModal';
import { Skeleton } from '@/components/ui/skeleton';
import { getAllApiaries } from '@/services/apiaryService';
import { useHives } from '@/hooks/useHives';

const SortOptions = {
  NameAsc: 'name-asc',
  NameDesc: 'name-desc',
  DateAsc: 'date-asc',
  DateDesc: 'date-desc',
};

const FilterOptions = {
  All: 'all',
  Healthy: 'healthy',
  NeedsAttention: 'needs-attention',
};

const Hives = () => {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState(SortOptions.NameAsc);
  const [filterBy, setFilterBy] = useState(FilterOptions.All);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApiaryId, setSelectedApiaryId] = useState('all');
  const [apiaries, setApiaries] = useState([]);
  const [isLoadingApiaries, setIsLoadingApiaries] = useState(true);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    data: hives = [], 
    isLoading, 
    isError,
    refetch,
    addHive,
    isAdding
  } = useHives();
  
  // Load apiaries
  React.useEffect(() => {
    const loadApiaries = async () => {
      try {
        setIsLoadingApiaries(true);
        const response = await getAllApiaries();
        setApiaries(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error loading apiaries:', error);
        toast({
          variant: "destructive",
          title: "Error loading apiaries",
          description: "There was a problem loading your apiaries. Please try again.",
        });
      } finally {
        setIsLoadingApiaries(false);
      }
    };
    
    loadApiaries();
  }, [toast]);
  
  // Handle error states
  React.useEffect(() => {
    if (isError) {
      toast({
        variant: "destructive",
        title: "Error loading hives",
        description: "There was a problem loading your hives. Please refresh the page or try again later.",
      });
      console.error("Error loading hives:", isError);
    }
  }, [isError, toast]);
  
  // Filter and sort hives
  const filteredAndSortedHives = useMemo(() => {
    // First filter by search query
    let result = hives?.filter(hive => 
      hive.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];
    
    // Then filter by apiary if selected
    if (selectedApiaryId !== 'all') {
      result = result.filter(hive => hive.apiary_id === selectedApiaryId);
    }
    
    // Then filter by status
    if (filterBy === FilterOptions.Healthy) {
      result = result.filter(hive => !hive.alerts?.length);
    } else if (filterBy === FilterOptions.NeedsAttention) {
      result = result.filter(hive => hive.alerts?.length > 0);
    }
    
    // Finally sort
    return result.sort((a, b) => {
      switch (sortBy) {
        case SortOptions.NameAsc:
          return a.name.localeCompare(b.name);
        case SortOptions.NameDesc:
          return b.name.localeCompare(a.name);
        case SortOptions.DateAsc:
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case SortOptions.DateDesc:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        default:
          return 0;
      }
    });
  }, [hives, searchQuery, selectedApiaryId, filterBy, sortBy]);
  
  // Event handlers with useCallback to prevent unnecessary re-renders
  const handleOpenAddModal = useCallback(() => {
    setIsAddModalOpen(true);
  }, []);
  
  const handleCloseAddModal = useCallback(() => {
    setIsAddModalOpen(false);
  }, []);
  
  const handleAddHive = useCallback(() => {
    // This function is called after a hive is added successfully
    refetch();
  }, [refetch]);
  
  const handleHiveClick = useCallback((apiaryId, hiveId) => {
    navigate(`/apiaries/${apiaryId}/hives/${hiveId}`, {
      state: { from: 'hives' }
    });
  }, [navigate]);
  
  const handleSearchChange = useCallback((e) => {
    setSearchQuery(e.target.value);
  }, []);
  
  const handleApiaryChange = useCallback((value) => {
    setSelectedApiaryId(value);
  }, []);
  
  const handleSortChange = useCallback((value) => {
    setSortBy(value);
  }, []);
  
  // Filter dropdown content
  const filterDropdownContent = (
    <DropdownMenuContent align="end" className="w-56">
      <DropdownMenuCheckboxItem
        checked={filterBy === FilterOptions.All}
        onCheckedChange={() => setFilterBy(FilterOptions.All)}
      >
        All Hives
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={filterBy === FilterOptions.Healthy}
        onCheckedChange={() => setFilterBy(FilterOptions.Healthy)}
      >
        Healthy Hives
      </DropdownMenuCheckboxItem>
      <DropdownMenuCheckboxItem
        checked={filterBy === FilterOptions.NeedsAttention}
        onCheckedChange={() => setFilterBy(FilterOptions.NeedsAttention)}
      >
        Needs Attention
      </DropdownMenuCheckboxItem>
    </DropdownMenuContent>
  );
  
  return (
    <PageTransition>
      <div className="container max-w-full sm:max-w-7xl pt-4 sm:pt-8 pb-8 sm:pb-16 px-3 sm:px-6 mx-auto overflow-x-hidden">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0 mb-6 sm:mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Hives</h1>
            <p className="text-muted-foreground">Manage and monitor your beehives</p>
          </div>

          <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
            <div className="w-full sm:w-[200px]">
              <Select 
                value={selectedApiaryId} 
                onValueChange={handleApiaryChange}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Filter by apiary" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Apiaries</SelectItem>
                  {isLoadingApiaries ? (
                    <SelectItem value="loading" disabled>
                      Loading...
                    </SelectItem>
                  ) : (
                    apiaries.map((apiary) => (
                      <SelectItem key={apiary.id} value={apiary.id}>{apiary.name}</SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            
            <AddHiveModal 
              trigger={
                <Button className="w-full sm:w-auto">
                  <Plus className="h-4 w-4 mr-2" /> Add Hive
                </Button>
              }
              onHiveAdded={handleAddHive}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 gap-4 mb-6 w-full max-w-full overflow-hidden">
          <div className="relative w-full">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search hives..."
              className="pl-8 w-full"
              value={searchQuery}
              onChange={handleSearchChange}
            />
          </div>
          
          <div className="flex gap-2 w-full">
            <div className="flex-1 max-w-[calc(100%-48px)]">
              <Select value={sortBy} onValueChange={handleSortChange}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={SortOptions.NameAsc}>
                    <div className="flex items-center">
                      <ArrowDownAZ className="mr-2 h-4 w-4" />
                      Name (A-Z)
                    </div>
                  </SelectItem>
                  <SelectItem value={SortOptions.NameDesc}>
                    <div className="flex items-center">
                      <ArrowUpZA className="mr-2 h-4 w-4" />
                      Name (Z-A)
                    </div>
                  </SelectItem>
                  <SelectItem value={SortOptions.DateAsc}>
                    <div className="flex items-center">
                      <ArrowDownUp className="mr-2 h-4 w-4" />
                      Oldest first
                    </div>
                  </SelectItem>
                  <SelectItem value={SortOptions.DateDesc}>
                    <div className="flex items-center">
                      <ArrowDownUp className="mr-2 h-4 w-4" />
                      Newest first
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="w-10 p-0">
                  <SlidersHorizontal className="h-4 w-4" />
                  <span className="sr-only">Filter</span>
                </Button>
              </DropdownMenuTrigger>
              {filterDropdownContent}
            </DropdownMenu>
          </div>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full overflow-hidden">
            {Array(6).fill(0).map((_, index) => (
              <Card key={index} className="overflow-hidden w-full">
                <CardContent className="p-0">
                  <div className="p-6">
                    <Skeleton className="h-5 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-4/5 mb-4" />
                    <div className="flex flex-wrap gap-2 mb-4">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-6 w-20" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Skeleton className="h-8 w-8 mx-auto mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                      <div>
                        <Skeleton className="h-8 w-8 mx-auto mb-2" />
                        <Skeleton className="h-4 w-full" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : isError ? (
          <div className="p-12 text-center">
            <AlertCircle className="h-16 w-16 mx-auto mb-4 text-destructive" />
            <h3 className="text-xl font-semibold mb-2">Unable to load hives</h3>
            <p className="text-muted-foreground mb-4">
              There was a problem connecting to the server. Please check your connection and try again.
            </p>
            <Button onClick={() => refetch()} variant="outline">
              Try Again
            </Button>
          </div>
        ) : filteredAndSortedHives.length === 0 ? (
          <div className="text-center py-12">
            <div className="mb-4">
              <img 
                src="/empty-hive.svg" 
                alt="No hives found" 
                className="w-32 h-32 mx-auto opacity-50"
                onError={(e) => {
                  e.currentTarget.src = '';
                  e.currentTarget.alt = '🐝';
                  e.currentTarget.className = 'text-6xl mb-4';
                }}
              />
            </div>
            <h3 className="text-xl font-semibold mb-2">No hives found</h3>
            <p className="text-muted-foreground mb-6">
              {searchQuery || selectedApiaryId !== 'all' || filterBy !== FilterOptions.All
                ? "No hives match your current filters. Try changing your search criteria."
                : "You haven't added any hives yet. Add your first hive to get started."}
            </p>
            <Button onClick={handleOpenAddModal}>
              <Plus className="h-4 w-4 mr-2" /> Add Your First Hive
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 w-full overflow-hidden">
            {filteredAndSortedHives.map((hive) => (
              <HiveCard 
                key={hive.hive_id} 
                hive={hive} 
                onClick={() => handleHiveClick(hive.apiary_id, hive.hive_id)} 
              />
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default React.memo(Hives); 