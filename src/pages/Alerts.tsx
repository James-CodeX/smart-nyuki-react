import React, { useState, useEffect } from 'react';
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
  
  const { toast } = useToast();

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    // Apply filters whenever the filter states change
    applyFilters();
  }, [alerts, searchTerm, activeTab, sortField, sortDirection, typeFilters, severityFilters]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await getAllAlerts();
      setAlerts(data);
      setFilteredAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast({
        variant: "destructive",
        title: "Error loading alerts",
        description: "There was a problem loading your alerts. Please try again.",
      });
    } finally {
      setLoading(false);
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
      console.error('Error resolving alert:', error);
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
    if (filteredAlerts.length === 0) return;
    
    try {
      setLoading(true);
      
      // Resolve all filtered alerts
      await Promise.all(
        filteredAlerts.map(alert => resolveAlert(alert.id))
      );
      
      // Update the local alerts state
      const resolvedIds = new Set(filteredAlerts.map(alert => alert.id));
      setAlerts(prevAlerts => prevAlerts.filter(alert => !resolvedIds.has(alert.id)));
      
      toast({
        title: "Alerts resolved",
        description: `${filteredAlerts.length} alerts have been marked as resolved.`,
      });
    } catch (error) {
      console.error('Error resolving alerts:', error);
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

  const applyFilters = () => {
    let result = [...alerts];
    
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

  // Get unique alert types and severities for filters
  const uniqueTypes = [...new Set(alerts.map(alert => alert.type))];
  const uniqueSeverities = [...new Set(alerts.map(alert => alert.severity))];

  return (
    <PageTransition>
      <div className="container max-w-7xl pt-16 md:pt-8 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight flex items-center gap-2"
            >
              <BellRing className="h-8 w-8 text-primary" />
              Alerts
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground mt-1"
            >
              Monitor and manage all alerts across your apiaries
            </motion.p>
          </div>
          
          {alerts.length > 0 && (
            <Button 
              variant="destructive"
              onClick={handleBulkResolve}
              disabled={loading || filteredAlerts.length === 0}
              className="w-full md:w-auto"
            >
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Resolve All {filteredAlerts.length > 0 ? `(${filteredAlerts.length})` : ''}
            </Button>
          )}
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full mb-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="all">All Alerts</TabsTrigger>
            <TabsTrigger value="unread">Unread Alerts</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex flex-col md:flex-row justify-between gap-4 mb-6">
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search alerts..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
            {searchTerm && (
              <button 
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setSearchTerm('')}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex flex-wrap gap-2 items-center">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter Types
                  {typeFilters.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{typeFilters.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                {uniqueTypes.map(type => (
                  <DropdownMenuCheckboxItem
                    key={type}
                    checked={typeFilters.includes(type)}
                    onCheckedChange={() => toggleTypeFilter(type)}
                  >
                    <div className="flex items-center">
                      {getAlertIcon(type)}
                      <span className="ml-2">{type}</span>
                    </div>
                  </DropdownMenuCheckboxItem>
                ))}
                {uniqueTypes.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No alert types available
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="h-10">
                  <AlertTriangle className="h-4 w-4 mr-2" />
                  Filter Severity
                  {severityFilters.length > 0 && (
                    <Badge variant="secondary" className="ml-2">{severityFilters.length}</Badge>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-48">
                {uniqueSeverities.map(severity => (
                  <DropdownMenuCheckboxItem
                    key={severity}
                    checked={severityFilters.includes(severity)}
                    onCheckedChange={() => toggleSeverityFilter(severity)}
                  >
                    {severity}
                  </DropdownMenuCheckboxItem>
                ))}
                {uniqueSeverities.length === 0 && (
                  <div className="px-2 py-1.5 text-sm text-muted-foreground">
                    No severity levels available
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            
            <Button variant="outline" size="sm" className="h-10" onClick={() => handleSortChange('created_at')}>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Date {sortField === 'created_at' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
            
            <Button variant="outline" size="sm" className="h-10" onClick={() => handleSortChange('severity')}>
              <ArrowUpDown className="h-4 w-4 mr-2" />
              Severity {sortField === 'severity' && (sortDirection === 'asc' ? '↑' : '↓')}
            </Button>
            
            {(searchTerm || typeFilters.length > 0 || severityFilters.length > 0 || sortField !== 'created_at' || sortDirection !== 'desc' || activeTab !== 'all') && (
              <Button variant="ghost" size="sm" onClick={resetFilters} className="h-10">
                <X className="h-4 w-4 mr-2" />
                Reset
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="overflow-hidden">
                <CardHeader className="pb-2">
                  <Skeleton className="h-5 w-40" />
                  <Skeleton className="h-4 w-28" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-3/4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredAlerts.length === 0 ? (
          <div className="bg-muted/30 border rounded-lg p-10 text-center">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="bg-primary/10 p-4 rounded-full mb-4">
                <CheckCircle className="h-10 w-10 text-primary" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No Alerts Found</h2>
              <p className="text-muted-foreground max-w-md mb-6">
                {searchTerm || typeFilters.length > 0 || severityFilters.length > 0 ? 
                  "No alerts match your current filters. Try adjusting your search or filters." : 
                  "All your hives are in good condition! There are no active alerts at the moment."}
              </p>
              {(searchTerm || typeFilters.length > 0 || severityFilters.length > 0) && (
                <Button variant="outline" onClick={resetFilters}>
                  Clear Filters
                </Button>
              )}
            </motion.div>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {filteredAlerts.map((alert) => (
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
    </PageTransition>
  );
};

export default Alerts; 