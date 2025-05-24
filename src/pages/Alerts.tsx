import logger from '@/utils/logger';

import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { format, parseISO } from 'date-fns';
import { 
  AlertCircle, 
  CheckCircle, 
  Filter, 
  X, 
  AlertTriangle,
  Thermometer, 
  Droplets, 
  Volume2, 
  Weight,
  ArrowUpDown,
  BellRing,
  Search
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import PageTransition from '@/components/layout/PageTransition';
import { getAllAlerts, resolveAlert, markAlertAsRead, Alert } from '@/services/alertService';
import { useToast } from '@/components/ui/use-toast';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import { Loader2 } from 'lucide-react';

// Helper function to determine alert type icon
const getAlertIcon = (type: string) => {
  switch (type.toLowerCase()) {
    case 'temperature':
      return <Thermometer className="h-5 w-5 text-orange-500" />;
    case 'humidity':
      return <Droplets className="h-5 w-5 text-blue-500" />;
    case 'sound':
      return <Volume2 className="h-5 w-5 text-purple-500" />;
    case 'weight':
      return <Weight className="h-5 w-5 text-amber-500" />;
    default:
      return <AlertCircle className="h-5 w-5 text-red-500" />;
  }
};

// Helper function to determine severity color
const getSeverityColor = (severity: string): string => {
  switch (severity.toLowerCase()) {
    case 'high':
      return 'bg-red-100 text-red-800 hover:bg-red-200';
    case 'medium':
      return 'bg-orange-100 text-orange-800 hover:bg-orange-200';
    case 'low':
      return 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200';
    default:
      return 'bg-blue-100 text-blue-800 hover:bg-blue-200';
  }
};

const Alerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filteredAlerts, setFilteredAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState<Record<string, boolean>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [sortField, setSortField] = useState<'created_at' | 'severity'>('created_at');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [typeFilters, setTypeFilters] = useState<string[]>([]);
  const [severityFilters, setSeverityFilters] = useState<string[]>([]);
  
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
    
    // Set up an interval to refresh alerts every 30 seconds
    refreshIntervalRef.current = setInterval(() => {
      loadAlerts(false); // Don't set loading to true for periodic refresh
    }, 30 * 1000);
    
    // Clean up interval on unmount
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  useEffect(() => {
    // Apply filters whenever the filter states change
    applyFilters();
  }, [alerts, searchTerm, activeTab, sortField, sortDirection, typeFilters, severityFilters]);

  const loadAlerts = async (showLoading = true) => {
    try {
      if (showLoading) {
        setLoading(true);
      }
      const response = await getAllAlerts();
      const alertsData = Array.isArray(response.data) ? response.data : [];
      setAlerts(alertsData);
      setFilteredAlerts(alertsData);
      // After fetching new alerts, we need to re-apply any active filters
      applyFilters(alertsData);
    } catch (error) {
      logger.error('Error loading alerts:', error);
      if (showLoading) { // Only show error toast for manual refreshes or initial load
        toast({
          variant: 'destructive',
          title: 'Error loading alerts',
          description: 'There was a problem loading your alerts. Please try again.',
        });
      }
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  const handleResolve = async (alertId: string) => {
    try {
      setResolving(prev => ({ ...prev, [alertId]: true }));
      await resolveAlert(alertId);
      
      // Update the local alerts state to reflect the change
      setAlerts(prevAlerts => prevAlerts.filter(alert => alert.id !== alertId));
      
      toast({
        title: "Alert resolved",
        description: "The alert has been marked as resolved.",
      });
    } catch (error) {
      logger.error('Error resolving alert:', error);
      toast({
        variant: "destructive",
        title: "Error resolving alert",
        description: "There was a problem resolving the alert. Please try again.",
      });
    } finally {
      setResolving(prev => ({ ...prev, [alertId]: false }));
    }
  };

  const handleBulkResolve = async () => {
    if (!Array.isArray(filteredAlerts) || filteredAlerts.length === 0) return;
    
    try {
      setLoading(true);
      
      // Resolve all filtered alerts
      await Promise.all(
        filteredAlerts.map(alert => resolveAlert(alert.id))
      );
      
      // Update the local alerts state
      const resolvedIds = new Set(filteredAlerts.map(alert => alert.id));
      setAlerts(prevAlerts => Array.isArray(prevAlerts) ? prevAlerts.filter(alert => !resolvedIds.has(alert.id)) : []);
      
      toast({
        title: "Alerts resolved",
        description: `${filteredAlerts.length} alerts have been marked as resolved.`,
      });
    } catch (error) {
      logger.error('Error resolving alerts:', error);
      toast({
        variant: "destructive",
        title: "Error resolving alerts",
        description: "There was a problem resolving some alerts. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSortChange = (field: 'created_at' | 'severity') => {
    if (sortField === field) {
      // Toggle direction if same field
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field and default to descending
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const toggleTypeFilter = (type: string) => {
    if (typeFilters.includes(type)) {
      setTypeFilters(typeFilters.filter(t => t !== type));
    } else {
      setTypeFilters([...typeFilters, type]);
    }
  };

  const toggleSeverityFilter = (severity: string) => {
    if (severityFilters.includes(severity)) {
      setSeverityFilters(severityFilters.filter(s => s !== severity));
    } else {
      setSeverityFilters([...severityFilters, severity]);
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilters([]);
    setSeverityFilters([]);
    setSortField('created_at');
    setSortDirection('desc');
    setActiveTab('all');
  };

  const applyFilters = (data: Alert[] = alerts) => {
    if (!Array.isArray(data)) {
      setFilteredAlerts([]);
      return;
    }
    
    let result = [...data];
    
    // Filter by tab
    if (activeTab === 'unread') {
      result = result.filter(alert => !alert.is_read);
    }
    
    // Apply search term filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        alert => 
          alert.message.toLowerCase().includes(term) ||
          alert.hive_name.toLowerCase().includes(term) ||
          alert.apiary_name.toLowerCase().includes(term) ||
          alert.type.toLowerCase().includes(term)
      );
    }
    
    // Apply type filters
    if (typeFilters.length > 0) {
      result = result.filter(alert => typeFilters.includes(alert.type));
    }
    
    // Apply severity filters
    if (severityFilters.length > 0) {
      result = result.filter(alert => severityFilters.includes(alert.severity));
    }
    
    // Apply sorting
    result.sort((a, b) => {
      if (sortField === 'created_at') {
        return sortDirection === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else if (sortField === 'severity') {
        const severityMap: Record<string, number> = { 'high': 3, 'medium': 2, 'low': 1, 'info': 0 };
        return sortDirection === 'asc'
          ? (severityMap[a.severity.toLowerCase()] || 0) - (severityMap[b.severity.toLowerCase()] || 0)
          : (severityMap[b.severity.toLowerCase()] || 0) - (severityMap[a.severity.toLowerCase()] || 0);
      }
      return 0;
    });
    
    setFilteredAlerts(result);
  };

  // Get unique alert types and severities for filter dropdowns
  const uniqueTypes = Array.isArray(alerts) ? [...new Set(alerts.map(alert => alert.type))] : [];
  const uniqueSeverities = Array.isArray(alerts) ? [...new Set(alerts.map(alert => alert.severity))] : [];

  const handleRefresh = () => {
    loadAlerts(true);
  };

  return (
    <PageTransition>
      <div className="container max-w-7xl py-6 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Alerts</h1>
            <p className="text-muted-foreground">
              Manage and respond to alerts from your hives
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              onClick={handleRefresh}
              disabled={loading}
            >
              {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
              Refresh
            </Button>
            
            {Array.isArray(alerts) && alerts.length > 0 && (
              <Button 
                variant="default" 
                onClick={handleBulkResolve}
                disabled={loading || !Array.isArray(filteredAlerts) || filteredAlerts.length === 0}
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Resolve All {Array.isArray(filteredAlerts) && filteredAlerts.length > 0 ? `(${filteredAlerts.length})` : ''}
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6">
          {/* Filters sidebar */}
          <div className="space-y-6">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Filter className="h-5 w-5" />
                    <span>Filters</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters}
                    className="h-8 px-2 text-xs"
                  >
                    Reset
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Alert Type</div>
                  <div className="space-y-1">
                    {uniqueTypes.map(type => (
                      <div key={type} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`type-${type}`}
                          checked={typeFilters.includes(type)}
                          onChange={() => toggleTypeFilter(type)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`type-${type}`} className="text-sm capitalize">
                          {type}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Severity</div>
                  <div className="space-y-1">
                    {uniqueSeverities.map(severity => (
                      <div key={severity} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`severity-${severity}`}
                          checked={severityFilters.includes(severity)}
                          onChange={() => toggleSeverityFilter(severity)}
                          className="rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`severity-${severity}`} className="text-sm capitalize">
                          {severity}
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div className="text-sm font-medium">Sort By</div>
                  <Select
                    value={`${sortField}-${sortDirection}`}
                    onValueChange={(value) => {
                      const [field, direction] = value.split('-');
                      setSortField(field as 'created_at' | 'severity');
                      setSortDirection(direction as 'asc' | 'desc');
                    }}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        <SelectItem value="created_at-desc">Newest first</SelectItem>
                        <SelectItem value="created_at-asc">Oldest first</SelectItem>
                        <SelectItem value="severity-desc">Highest severity</SelectItem>
                        <SelectItem value="severity-asc">Lowest severity</SelectItem>
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Main content area */}
          <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search alerts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              
              <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="unread">Unread</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="overflow-hidden">
                    <CardContent className="p-0">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div className="space-y-2">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-4 w-60" />
                          </div>
                          <Skeleton className="h-8 w-20" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : !Array.isArray(filteredAlerts) || filteredAlerts.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <BellRing className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">No alerts found</h3>
                  <p className="text-muted-foreground text-center max-w-md">
                    {searchTerm || typeFilters.length > 0 || severityFilters.length > 0
                      ? "No alerts match your current filters. Try adjusting your search criteria."
                      : "You don't have any active alerts at the moment. Check back later or adjust your alert thresholds in settings."}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {Array.isArray(filteredAlerts) && filteredAlerts.map((alert) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={`overflow-hidden ${!alert.is_read ? 'border-primary/40 bg-primary/5' : ''}`}>
                      <CardHeader className="pb-2">
                        <div className="flex justify-between">
                          <div className="flex items-center gap-2">
                            {getAlertIcon(alert.type)}
                            <CardTitle className="text-base font-medium">
                              {alert.type} Alert • {alert.hive_name}
                            </CardTitle>
                            {!alert.is_read && (
                              <Badge variant="default" className="ml-2">New</Badge>
                            )}
                          </div>
                          <Badge className={`${getSeverityColor(alert.severity)}`}>
                            {alert.severity}
                          </Badge>
                        </div>
                        <CardDescription>
                          {format(parseISO(alert.created_at), "MMM d, yyyy 'at' h:mm a")} • {alert.apiary_name}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm">{alert.message}</p>
                      </CardContent>
                      <CardFooter className="flex justify-end gap-2 pt-0">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleResolve(alert.id)}
                          disabled={resolving[alert.id]}
                        >
                          {resolving[alert.id] ? 
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : 
                            <CheckCircle className="h-4 w-4 mr-2" />
                          }
                          Resolve
                        </Button>
                      </CardFooter>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Alerts; 