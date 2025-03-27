import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Plus, 
  Map, 
  AlertCircle, 
  Thermometer, 
  Droplets, 
  Volume2, 
  Weight, 
  Users,
  CalendarDays,
  CheckCircle2,
  Clock,
  BellRing,
  Leaf,
  BarChart3,
  TrendingUp,
  ArrowRightCircle,
  ClipboardCheck
} from 'lucide-react';

// UI Components
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import PageTransition from '@/components/layout/PageTransition';

// Dashboard Components
import ApiaryCard from '@/components/dashboard/ApiaryCard';
import HiveMetricsCard from '@/components/dashboard/HiveMetricsCard';
import StatisticsCard from '@/components/dashboard/StatisticsCard';
import QuickActions from '@/components/dashboard/QuickActions';
import UpcomingInspections from '@/components/dashboard/UpcomingInspections';
import HiveStatusOverview from '@/components/dashboard/HiveStatusOverview';
import DashboardChart from '@/components/dashboard/DashboardChart';
import { SummaryMetric, MetricsProgressRow } from '@/components/dashboard/SummaryMetricsCard';
import AddHiveModal from '@/components/dashboard/AddHiveModal';
import AddApiaryModal from '@/components/dashboard/AddApiaryModal';
import AlertsManagement from '@/components/dashboard/AlertsManagement';
import ProductionAnalytics from '@/components/dashboard/ProductionAnalytics';
import WeatherWidget from '@/components/dashboard/WeatherWidget';
import ScheduleInspectionModal from '@/components/dashboard/ScheduleInspectionModal';

// Services and Context
import { addHive, getAllHives, HiveWithDetails } from '@/services/hiveService';
import { addApiary, getAllApiaries } from '@/services/apiaryService';
import { useAuth } from '@/context/AuthContext';
import { getUserProfile } from '@/services/settingsService';

// For now, use simple mock data for inspections since we don't have a real service yet
interface Inspection {
  id: string;
  apiaryId: string;
  hiveId: string;
  hiveName: string; // Added for display purposes
  date: string;
  type: 'regular' | 'health-check' | 'winter-prep' | 'varroa-check' | 'disease-treatment' | 'harvest-evaluation';
  status: 'scheduled' | 'completed' | 'overdue' | 'cancelled';
  findings?: any;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

const upcomingInspections: Inspection[] = [
  { id: '1', hiveId: '1', hiveName: 'Hive 1', apiaryId: '1', date: '2023-09-05', status: 'scheduled', type: 'regular', createdBy: 'user', createdAt: '2023-09-01' },
  { id: '2', hiveId: '2', hiveName: 'Hive 2', apiaryId: '1', date: '2023-09-07', status: 'scheduled', type: 'health-check', createdBy: 'user', createdAt: '2023-09-01' }
];
const overdueInspections: Inspection[] = [
  { id: '3', hiveId: '3', hiveName: 'Hive 3', apiaryId: '2', date: '2023-08-25', status: 'overdue', type: 'regular', createdBy: 'user', createdAt: '2023-08-20' }
];
const completedInspections: Inspection[] = [
  { id: '4', hiveId: '4', hiveName: 'Hive 4', apiaryId: '2', date: '2023-08-20', status: 'completed', type: 'regular', createdBy: 'user', createdAt: '2023-08-15' },
  { id: '5', hiveId: '5', hiveName: 'Hive 5', apiaryId: '3', date: '2023-08-15', status: 'completed', type: 'regular', createdBy: 'user', createdAt: '2023-08-10' }
];
const allInspections = [...upcomingInspections, ...overdueInspections, ...completedInspections];

// Generate some sample data for the production chart
const generateProductionData = () => {
  const data = [];
  const now = new Date();
  
  for (let i = 30; i >= 0; i--) {
    const date = subDays(now, i);
    const value = 15 + Math.random() * 10;
    data.push({
      date: format(date, 'MMM dd'),
      value: parseFloat(value.toFixed(1))
    });
  }
  
  return data;
};

// Create a single-property MetricsProgressRow component above the Dashboard component function
const SingleMetricsProgressRow = ({ 
  title, 
  value, 
  unit, 
  icon, 
  progress, 
  loading 
}: { 
  title: string, 
  value: number, 
  unit: string, 
  icon: React.ReactNode, 
  progress: number,
  loading: boolean 
}) => {
  if (loading) {
    return <div className="h-8 bg-muted animate-pulse rounded-md mb-2"></div>;
  }
  
  return (
    <div className="flex items-center justify-between mb-2">
      <div className="flex items-center gap-2">
        <div className="p-1.5 bg-secondary rounded-full">
          {icon}
        </div>
        <span className="text-sm">{title}</span>
      </div>
      <div className="flex items-center">
        <span className="font-medium">{value.toFixed(1)}{unit}</span>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [isAddHiveModalOpen, setIsAddHiveModalOpen] = useState(false);
  const [isAddApiaryModalOpen, setIsAddApiaryModalOpen] = useState(false);
  const [isAddInspectionModalOpen, setIsAddInspectionModalOpen] = useState(false);
  const [hives, setHives] = useState<HiveWithDetails[]>([]);
  const [apiaries, setApiaries] = useState<any[]>([]);
  const [isLoadingHives, setIsLoadingHives] = useState(true);
  const [isLoadingApiaries, setIsLoadingApiaries] = useState(true);
  const [userFirstName, setUserFirstName] = useState('');
  const { toast } = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  // Load user profile to get the first name
  useEffect(() => {
    const loadUserProfile = async () => {
      if (user) {
        try {
          const userProfile = await getUserProfile();
          if (userProfile) {
            setUserFirstName(userProfile.first_name || '');
          }
        } catch (error) {
          console.error('Error loading user profile:', error);
        }
      }
    };
    
    loadUserProfile();
  }, [user]);
  
  // Stats
  const apiaryCount = apiaries.length || 0;
  const hiveCount = hives.length || 0;
  const hivesWithAlerts = hives.filter(hive => hive.alerts && hive.alerts.length > 0);
  const alertCount = hivesWithAlerts.length;
  
  // Calculate total weight from all hives
  const totalWeight = hives.reduce((sum, hive) => {
    if (hive.metrics && hive.metrics.weight && hive.metrics.weight.length > 0) {
      const latestWeight = hive.metrics.weight[hive.metrics.weight.length - 1].value;
      return sum + (latestWeight || 0);
    }
    return sum;
  }, 0);
  
  // Sample production data
  const productionData = generateProductionData();
  
  // Calculate averages for all metrics
  const avgTemperature = apiaryCount > 0 ? apiaries.reduce((sum, a) => sum + a.avgTemperature, 0) / apiaryCount : 0;
  const avgHumidity = apiaryCount > 0 ? apiaries.reduce((sum, a) => sum + a.avgHumidity, 0) / apiaryCount : 0;
  const avgSound = apiaryCount > 0 ? apiaries.reduce((sum, a) => sum + a.avgSound, 0) / apiaryCount : 0;
  const avgWeight = apiaryCount > 0 ? apiaries.reduce((sum, a) => sum + a.avgWeight, 0) / apiaryCount : 0;

  // Load hives and apiaries when component mounts
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoadingHives(true);
        setIsLoadingApiaries(true);
        
        const hivesData = await getAllHives();
        const apiariesData = await getAllApiaries();
        
        setHives(hivesData);
        setApiaries(apiariesData);
        setLoading(false);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
        toast({
          variant: "destructive",
          title: "Error loading data",
          description: "There was a problem loading your data. Please try again.",
        });
      } finally {
        setIsLoadingHives(false);
        setIsLoadingApiaries(false);
      }
    };
    
    loadData();
  }, [toast]);

  // Event handlers
  const handleAddHive = async (data: { 
    name: string;
    hive_id: string;
    apiaryId: string;
    type: string;
    status: string;
    installation_date?: string;
    queen_type?: string;
    queen_introduced_date?: string;
    queen_marked?: boolean;
    queen_marking_color?: string;
    notes?: string;
  }) => {
    try {
      setIsLoadingHives(true);
      
      // Add the hive
      await addHive(data);
      
      // Refresh hives list
      const updatedHives = await getAllHives();
      setHives(updatedHives);
      
      toast({
        title: "Hive added",
        description: "Your new hive has been created successfully.",
      });
      
      setIsAddHiveModalOpen(false);
    } catch (error) {
      console.error('Error adding hive:', error);
      // Get the error message if it exists
      const errorMessage = error instanceof Error ? error.message : "There was a problem creating the hive. Please try again.";
      
      toast({
        variant: "destructive",
        title: "Error adding hive",
        description: errorMessage,
      });
    } finally {
      setIsLoadingHives(false);
    }
  };
  
  // Handle adding a new apiary
  const handleAddApiary = async (data: any) => {
    try {
      setIsLoadingApiaries(true);
      
      // Add the apiary
      await addApiary(data);
      
      // Refresh apiaries list
      const updatedApiaries = await getAllApiaries();
      setApiaries(updatedApiaries);
      
      toast({
        title: "Apiary added",
        description: "Your new apiary has been created successfully.",
      });
      
      setIsAddApiaryModalOpen(false);
    } catch (error) {
      console.error('Error adding apiary:', error);
      toast({
        variant: "destructive",
        title: "Error adding apiary",
        description: "There was a problem creating the apiary. Please try again.",
      });
    } finally {
      setIsLoadingApiaries(false);
    }
  };
  
  // Handle adding a new inspection
  const handleAddInspection = async (data: any) => {
    try {
      // This would be implemented when we have a real inspection service
      // For now, just show a success message
      toast({
        title: "Inspection scheduled",
        description: "Your inspection has been scheduled successfully.",
      });
      
      setIsAddInspectionModalOpen(false);
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      toast({
        variant: "destructive",
        title: "Error scheduling inspection",
        description: "There was a problem scheduling the inspection. Please try again.",
      });
    }
  };

  const handleScheduleInspection = () => {
    navigate('/inspections');
  };

  const handleViewHive = (hiveId: string) => {
    // Find the apiary ID for this hive
    const hive = hives.find(h => h.hive_id === hiveId);
    if (hive) {
      navigate(`/apiaries/${hive.apiary_id}/hives/${hiveId}`, {
        state: { from: 'dashboard' }
      });
    }
  };

  if (loading) {
    return (
      <PageTransition>
        <div className="container max-w-7xl pt-16 md:pt-6 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-6">
            <div className="h-10 bg-muted rounded-md w-1/4"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-32 bg-muted rounded-lg"></div>
              ))}
            </div>
            <div className="h-48 bg-muted rounded-lg"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="h-64 bg-muted rounded-lg"></div>
              <div className="h-64 bg-muted rounded-lg"></div>
            </div>
          </div>
        </div>
      </PageTransition>
    );
  }
  
  return (
    <PageTransition animate={false}>
      <div className="container px-4 py-4 sm:py-6 mx-auto max-w-7xl overflow-visible relative">
        <h1 className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6">Dashboard</h1>
        
        {/* Welcome message - Different versions for desktop and mobile */}
        <div className="mb-6">
          {/* Desktop version */}
          <p className="text-muted-foreground hidden md:block">
            Welcome {userFirstName ? `${userFirstName}` : 'back'}! Here's an overview of your beekeeping operation.
          </p>
          
          {/* Mobile version */}
          <p className="text-muted-foreground md:hidden">
            Welcome {userFirstName ? `${userFirstName}` : 'back'}!
          </p>
        </div>
        
        {/* Dashboard content */}
        <Tabs value={activeTab} onValueChange={setActiveTab} defaultValue="overview">
          <TabsList className="mb-4 hidden md:flex">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          {/* Always visible on mobile, conditional on desktop */}
          <div className="md:hidden space-y-6">
            {/* Overview content for mobile */}
            {/* First row: Stats */}
            <div className="grid gap-4 grid-cols-2">
              <StatisticsCard
                title="Apiaries"
                value={apiaryCount}
                description="Total apiaries"
                icon={<Map className="h-4 w-4 text-muted-foreground" />}
              />
              <StatisticsCard
                title="Hives"
                value={hiveCount}
                description="Total hives"
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
              />
              <StatisticsCard
                title="Total Weight"
                value={parseFloat(totalWeight.toFixed(1))}
                description="Combined hive weight"
                icon={<Weight className="h-4 w-4 text-muted-foreground" />}
              />
              <StatisticsCard
                title="Inspections"
                value={upcomingInspections.length + overdueInspections.length}
                description={overdueInspections.length > 0 ? `${overdueInspections.length} overdue` : 'Upcoming inspections'}
                icon={<ClipboardCheck className="h-4 w-4 text-muted-foreground" />}
                change={overdueInspections.length > 0 ? { value: overdueInspections.length, trend: 'up' } : undefined}
              />
            </div>
            
            {/* Second row: Metrics Summary and Alerts */}
            <div className="grid gap-4 grid-cols-1">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Apiary Metrics</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <SingleMetricsProgressRow 
                      title="Temperature"
                      value={avgTemperature}
                      unit="°C"
                      icon={<Thermometer className="h-4 w-4" />}
                      progress={65}
                      loading={loading}
                    />
                    <SingleMetricsProgressRow 
                      title="Humidity"
                      value={avgHumidity}
                      unit="%"
                      icon={<Droplets className="h-4 w-4" />}
                      progress={45}
                      loading={loading}
                    />
                    <SingleMetricsProgressRow 
                      title="Sound"
                      value={avgSound}
                      unit="dB"
                      icon={<Volume2 className="h-4 w-4" />}
                      progress={35}
                      loading={loading}
                    />
                    <SingleMetricsProgressRow 
                      title="Weight"
                      value={avgWeight}
                      unit="kg"
                      icon={<Weight className="h-4 w-4" />}
                      progress={55}
                      loading={loading}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* Alerts Management */}
              <AlertsManagement 
                onResolve={() => {
                  // Refresh data when an alert is resolved
                  const loadData = async () => {
                    try {
                      const hivesData = await getAllHives();
                      setHives(hivesData);
                    } catch (error) {
                      console.error('Error refreshing hives data:', error);
                    }
                  };
                  loadData();
                }}
              />
            </div>
            
            {/* Weather Widget - Mobile */}
            <WeatherWidget />
            
            {/* Quick Actions - Mobile */}
            <QuickActions 
              onAddApiary={() => setIsAddApiaryModalOpen(true)}
              onAddHive={() => setIsAddHiveModalOpen(true)}
              onScheduleInspection={() => setIsAddInspectionModalOpen(true)}
            />
            
            {/* Upcoming Inspections and Hive Status */}
            <UpcomingInspections
              inspections={[...upcomingInspections, ...overdueInspections, ...completedInspections].slice(0, 5)}
              onViewAll={() => navigate('/inspections')}
              onViewInspection={(inspection) => console.log('View inspection', inspection)}
            />
            <HiveStatusOverview 
              hives={isLoadingHives ? [] : hives.map(hive => ({
                id: hive.hive_id,
                name: hive.name,
                apiaryName: hive.apiaryName || '',
                alerts: hive.alerts || [],
                metrics: hive.metrics || { 
                  temperature: [], 
                  humidity: [], 
                  sound: [], 
                  weight: [] 
                }
              }))}
              onViewHive={handleViewHive}
            />
          </div>
          
          {/* Original tab content for desktop */}
          <TabsContent value="overview" className="space-y-6 hidden md:block">
            {/* First row: Stats */}
            <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
              <StatisticsCard
                title="Apiaries"
                value={apiaryCount}
                description="Total apiaries"
                icon={<Map className="h-4 w-4 text-muted-foreground" />}
              />
              <StatisticsCard
                title="Hives"
                value={hiveCount}
                description="Total hives"
                icon={<Users className="h-4 w-4 text-muted-foreground" />}
              />
              <StatisticsCard
                title="Total Weight"
                value={parseFloat(totalWeight.toFixed(1))}
                description="Combined hive weight"
                icon={<Weight className="h-4 w-4 text-muted-foreground" />}
              />
              <StatisticsCard
                title="Inspections"
                value={upcomingInspections.length + overdueInspections.length}
                description={overdueInspections.length > 0 ? `${overdueInspections.length} overdue` : 'Upcoming inspections'}
                icon={<ClipboardCheck className="h-4 w-4 text-muted-foreground" />}
                change={overdueInspections.length > 0 ? { value: overdueInspections.length, trend: 'up' } : undefined}
              />
            </div>
            
            {/* Second row: Metrics Summary and Alerts */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-medium flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    <span>Apiary Metrics</span>
                  </CardTitle>
                  <CardDescription className="hidden md:block">Average metrics across all apiaries</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <SingleMetricsProgressRow 
                      title="Temperature"
                      value={avgTemperature}
                      unit="°C"
                      icon={<Thermometer className="h-4 w-4" />}
                      progress={65}
                      loading={loading}
                    />
                    <SingleMetricsProgressRow 
                      title="Humidity"
                      value={avgHumidity}
                      unit="%"
                      icon={<Droplets className="h-4 w-4" />}
                      progress={45}
                      loading={loading}
                    />
                    <SingleMetricsProgressRow 
                      title="Sound"
                      value={avgSound}
                      unit="dB"
                      icon={<Volume2 className="h-4 w-4" />}
                      progress={35}
                      loading={loading}
                    />
                    <SingleMetricsProgressRow 
                      title="Weight"
                      value={avgWeight}
                      unit="kg"
                      icon={<Weight className="h-4 w-4" />}
                      progress={55}
                      loading={loading}
                    />
                  </div>
                </CardContent>
              </Card>
              
              {/* New Alerts Management Component */}
              <AlertsManagement 
                onResolve={() => {
                  // Refresh data when an alert is resolved
                  const loadData = async () => {
                    try {
                      const hivesData = await getAllHives();
                      setHives(hivesData);
                    } catch (error) {
                      console.error('Error refreshing hives data:', error);
                    }
                  };
                  loadData();
                }}
              />
            </div>
            
            {/* Third row: Weather Widget and Quick Actions - Desktop only */}
            <div className="hidden md:grid gap-4 grid-cols-1 md:grid-cols-2">
              {/* Weather Widget Component */}
              <WeatherWidget />
              
              <QuickActions 
                onAddApiary={() => setIsAddApiaryModalOpen(true)}
                onAddHive={() => setIsAddHiveModalOpen(true)}
                onScheduleInspection={() => setIsAddInspectionModalOpen(true)}
              />
            </div>
            
            {/* Fourth row: Upcoming Inspections and Hive Status */}
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
              <UpcomingInspections
                inspections={[...upcomingInspections, ...overdueInspections, ...completedInspections].slice(0, 5)}
                onViewAll={() => navigate('/inspections')}
                onViewInspection={(inspection) => console.log('View inspection', inspection)}
              />
              <HiveStatusOverview 
                hives={isLoadingHives ? [] : hives.map(hive => ({
                  id: hive.hive_id,
                  name: hive.name,
                  apiaryName: hive.apiaryName || '',
                  alerts: hive.alerts || [],
                  metrics: hive.metrics || { 
                    temperature: [], 
                    humidity: [], 
                    sound: [], 
                    weight: [] 
                  }
                }))}
                onViewHive={handleViewHive}
              />
            </div>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6 overflow-visible hidden md:block">
            {/* Production Analytics */}
            <ProductionAnalytics className="overflow-visible" />
            
            {/* Charts for hive performance */}
            <Card className="overflow-visible">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  <span>Hive Performance</span>
                </CardTitle>
                <CardDescription>Compare metrics across your hives</CardDescription>
              </CardHeader>
              <CardContent className="overflow-visible">
                <DashboardChart 
                  title="Temperature Comparison"
                  data={hives.map(hive => ({
                    name: hive.name,
                    value: hive.metrics?.temperature.length ? 
                      hive.metrics.temperature[hive.metrics.temperature.length - 1].value : 0
                  }))} 
                  dataKey="name"
                  height={300}
                />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Modals */}
        <AddHiveModal
          isOpen={isAddHiveModalOpen}
          onClose={() => setIsAddHiveModalOpen(false)}
          onAdd={handleAddHive}
        />
        
        <AddApiaryModal
          isOpen={isAddApiaryModalOpen}
          onClose={() => setIsAddApiaryModalOpen(false)}
          onAdd={handleAddApiary}
        />
        
        {/* New Inspection Modal */}
        <ScheduleInspectionModal
          isOpen={isAddInspectionModalOpen}
          onClose={() => setIsAddInspectionModalOpen(false)}
          onScheduled={() => {
            toast({
              title: "Inspection Scheduled",
              description: "Your inspection has been scheduled successfully.",
            });
            // In a real implementation, we would refresh the inspections data here
          }}
          hives={hives}
        />
      </div>
    </PageTransition>
  );
};

export default Dashboard;
