import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, subDays } from 'date-fns';
import PageTransition from '@/components/layout/PageTransition';
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
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';

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

import { addHive, getAllHives, HiveWithDetails } from '@/services/hiveService';
import { addApiary, getAllApiaries } from '@/services/apiaryService';
import { useToast } from '@/components/ui/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

// Temporary AddInspectionModal component until we implement the real one
const AddInspectionModal = ({ isOpen, onClose, onAdd, hives }: { 
  isOpen: boolean; 
  onClose: () => void; 
  onAdd: (data: any) => void; 
  hives: HiveWithDetails[] 
}) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-background p-6 rounded-lg shadow-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Schedule Inspection</h2>
        <p className="text-muted-foreground mb-4">This feature will be implemented soon.</p>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onAdd({}); onClose(); }}>Save</Button>
        </div>
      </div>
    </div>
  );
};

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
  const { toast } = useToast();
  const navigate = useNavigate();
  
  // Stats
  const apiaryCount = apiaries.length || 0;
  const hiveCount = hives.length || 0;
  const hivesWithAlerts = hives.filter(hive => hive.alerts && hive.alerts.length > 0);
  const alertCount = hivesWithAlerts.length;
  
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
      // TODO: Implement when inspection service is available
      // await addInspection(data);
      
      toast({
        title: "Inspection added",
        description: "Your new inspection has been saved successfully.",
      });
      
      setIsAddInspectionModalOpen(false);
    } catch (error) {
      console.error('Error adding inspection:', error);
      toast({
        variant: "destructive",
        title: "Error adding inspection",
        description: "There was a problem saving the inspection. Please try again.",
      });
    }
  };

  const handleScheduleInspection = () => {
    navigate('/inspections');
  };

  const handleViewHive = (hiveId: string) => {
    // Find the apiary ID for this hive
    const hive = hives.find(h => h.id === hiveId);
    if (hive) {
      navigate(`/apiaries/${hive.apiary_id}/hives/${hiveId}`);
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
    <PageTransition>
      <div className="container max-w-7xl pt-16 md:pt-6 pb-16 px-4 sm:px-6 lg:px-8">
        <header className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight"
            >
              Smart-Nyuki Dashboard
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
                className="text-muted-foreground"
            >
                {format(new Date(), 'EEEE, MMMM d, yyyy')} • Overview of your beekeeping operation
            </motion.p>
          </div>
          
            <div className="flex flex-wrap gap-3">
            <Link to="/map">
                <Button variant="outline" size="sm" className="h-9">
                  <Map className="h-4 w-4 mr-2" />
                Map View
                </Button>
            </Link>
              <Button className="h-9">
                <Plus className="h-4 w-4 mr-2" />
              Add Apiary
              </Button>
            </div>
          </div>
        </header>

        <Tabs 
          defaultValue={activeTab} 
          onValueChange={setActiveTab}
          className="mb-8"
        >
          <TabsList className="bg-background border w-full md:w-auto justify-start overflow-auto">
            <TabsTrigger value="overview" className="text-sm">Overview</TabsTrigger>
            <TabsTrigger value="apiaries" className="text-sm">Apiaries</TabsTrigger>
            <TabsTrigger value="hives" className="text-sm">Hives</TabsTrigger>
            <TabsTrigger value="production" className="text-sm">Production</TabsTrigger>
            <TabsTrigger value="inspections" className="text-sm">Inspections</TabsTrigger>
          </TabsList>
        
          <TabsContent value="overview" className="space-y-6 mt-0">
            {/* Key Stats Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatisticsCard
                title="Total Apiaries"
                value={apiaryCount}
                icon={<Users className="h-4 w-4 text-blue-600" />}
                change={{ value: 0, trend: 'neutral' }}
                description="Total locations"
              />
              <StatisticsCard
                title="Total Hives"
                value={hiveCount}
                icon={<Leaf className="h-4 w-4 text-green-600" />}
                change={{ value: 5, trend: 'up' }}
                description="5% growth this month"
              />
              <StatisticsCard
                title="Alerts"
                value={alertCount}
                icon={<AlertCircle className="h-4 w-4 text-red-600" />}
                change={alertCount > 0 ? { value: alertCount, trend: 'up' } : { value: 0, trend: 'neutral' }}
                description={alertCount > 0 ? "Hives need attention" : "All hives healthy"}
              />
              <StatisticsCard
                title="Inspections"
                value={upcomingInspections.length}
                icon={<CalendarDays className="h-4 w-4 text-purple-600" />}
                description="Due this week"
              />
            </div>

            {/* Quick Actions */}
            <QuickActions 
              onAddApiary={() => setIsAddApiaryModalOpen(true)}
              onAddHive={() => setIsAddHiveModalOpen(true)}
              onScheduleInspection={() => setIsAddInspectionModalOpen(true)}
            />

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Production Trend */}
              <DashboardChart
                title="Honey Production"
                description="Last 30 days trend"
                data={productionData}
                type="area"
                dataKey="date"
                categories={['value']}
                colors={['#f59e0b']}
                height={220}
                valueChange={{
                  value: 15.2,
                  percentage: 12,
                  trend: 'up'
                }}
                yAxisFormatter={(value) => `${value}kg`}
                tooltipFormatter={(value) => `${value}kg`}
              />

              {/* Upcoming Inspections */}
              <UpcomingInspections
                inspections={[...overdueInspections, ...upcomingInspections].slice(0, 5)}
                onViewAll={() => navigate('/inspections')}
                onViewInspection={(inspection) => console.log('View inspection', inspection)}
              />

              {/* Hive Status Overview */}
              {hives.length > 0 && (
                <HiveStatusOverview
                  hives={hivesWithAlerts.length > 0 ? 
                    hivesWithAlerts.map(hive => ({
                      id: hive.id,
                      name: hive.name,
                      apiaryName: hive.apiaryName || '',
                      metrics: hive.metrics || { 
                        temperature: [], 
                        humidity: [], 
                        sound: [], 
                        weight: [] 
                      },
                      alerts: hive.alerts || []
                    })) : 
                    hives.slice(0, 5).map(hive => ({
                      id: hive.id,
                      name: hive.name,
                      apiaryName: hive.apiaryName || '',
                      metrics: hive.metrics || { 
                        temperature: [], 
                        humidity: [], 
                        sound: [], 
                        weight: [] 
                      },
                      alerts: hive.alerts || []
                    }))
                  }
                  onViewHive={handleViewHive}
                />
              )}
        </div>
        
            {/* Metrics Overview */}
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Overall Metrics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <MetricsProgressRow 
                    metrics={[
                      {
                        title: 'Avg Temperature',
                        value: parseFloat(avgTemperature.toFixed(1)),
                        max: 40,
                        icon: <Thermometer className="h-4 w-4" />,
                        color: 'bg-red-500/10 text-red-500'
                      },
                      {
                        title: 'Avg Humidity',
                        value: parseFloat(avgHumidity.toFixed(1)),
                        max: 100,
                        icon: <Droplets className="h-4 w-4" />,
                        color: 'bg-blue-500/10 text-blue-500'
                      },
                      {
                        title: 'Avg Sound',
                        value: parseFloat(avgSound.toFixed(1)),
                        max: 80,
                        icon: <Volume2 className="h-4 w-4" />,
                        color: 'bg-purple-500/10 text-purple-500'
                      },
                      {
                        title: 'Avg Weight',
                        value: parseFloat(avgWeight.toFixed(1)),
                        max: 30,
                        icon: <Weight className="h-4 w-4" />,
                        color: 'bg-amber-500/10 text-amber-500'
                      }
                    ]}
                  />
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="md:col-span-2">
                      <DashboardChart
                        title="Weekly Metrics Trend"
                        data={productionData.slice(-7)}
                        type="line"
                        dataKey="date"
                        categories={['Temp', 'Humidity', 'Weight']}
                        colors={['#ef4444', '#3b82f6', '#f59e0b']}
                        height={220}
                      />
                    </div>
                    <Card>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Inspection Status</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-green-100 flex items-center justify-center">
                              <CheckCircle2 className="h-5 w-5 text-green-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{completedInspections.length}</p>
                              <p className="text-xs text-muted-foreground">Completed</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                              <Clock className="h-5 w-5 text-blue-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{upcomingInspections.length}</p>
                              <p className="text-xs text-muted-foreground">Scheduled</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-red-100 flex items-center justify-center">
                              <AlertCircle className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium">{overdueInspections.length}</p>
                              <p className="text-xs text-muted-foreground">Overdue</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="apiaries" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apiaries.map((apiary, i) => (
                <motion.div
                  key={apiary.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <ApiaryCard
                    id={apiary.id}
                    name={apiary.name}
                    location={apiary.location}
                    hiveCount={apiary.hiveCount}
                    avgTemperature={apiary.avgTemperature}
                    avgHumidity={apiary.avgHumidity}
                    avgSound={apiary.avgSound}
                    avgWeight={apiary.avgWeight}
                  />
                </motion.div>
              ))}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: apiaries.length * 0.1 }}
                className="flex items-center justify-center bg-secondary/50 border border-dashed border-secondary-foreground/20 rounded-2xl p-5 h-full cursor-pointer hover:bg-secondary/80 transition-colors"
                onClick={() => setIsAddApiaryModalOpen(true)}
              >
                <div className="text-center">
                  <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">Add New Apiary</h3>
                  <p className="text-muted-foreground text-sm mt-1">Expand your beekeeping operation</p>
                </div>
              </motion.div>
            </div>
          </TabsContent>

          <TabsContent value="hives" className="space-y-6 mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hives.map((hive, i) => (
              <motion.div
                key={hive.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <HiveMetricsCard
                  id={hive.id}
                  name={hive.name}
                  apiaryId={hive.apiary_id}
                  apiaryName={hive.apiaryName || ''}
                  metrics={hive.metrics || { temperature: [], humidity: [], sound: [], weight: [] }}
                  alerts={hive.alerts || []}
                />
              </motion.div>
            ))}
          </div>
          </TabsContent>

          <TabsContent value="production" className="space-y-6 mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="text-md">Honey Production Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-8">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <SummaryMetric
                      title="Total Production"
                      value="248.5"
                      unit="kg"
                      icon={<BarChart3 className="h-4 w-4" />}
                      changeValue={12}
                      trend="up"
                      status="success"
                    />
                    <SummaryMetric
                      title="Avg Production per Hive"
                      value={parseFloat((248.5 / hiveCount).toFixed(1)) || 0}
                      unit="kg"
                      icon={<Leaf className="h-4 w-4" />}
                      changeValue={5}
                      trend="up"
                      status="info"
                    />
                    <SummaryMetric
                      title="Projected Harvest"
                      value="42.8"
                      unit="kg"
                      icon={<TrendingUp className="h-4 w-4" />}
                      description="Estimated next 30 days"
                      status="info"
                    />
                  </div>
                  
                  <DashboardChart
                    title="Monthly Production"
                    data={[
                      { month: 'Jan', value: 25.2 },
                      { month: 'Feb', value: 18.7 },
                      { month: 'Mar', value: 22.4 },
                      { month: 'Apr', value: 28.3 },
                      { month: 'May', value: 35.8 },
                      { month: 'Jun', value: 41.2 },
                      { month: 'Jul', value: 39.5 },
                      { month: 'Aug', value: 37.1 }
                    ]}
                    type="bar"
                    dataKey="month"
                    categories={['value']}
                    colors={['#f59e0b']}
                    height={300}
                    yAxisFormatter={(value) => `${value}kg`}
                    tooltipFormatter={(value) => `${value}kg`}
                  />

                  <div className="flex justify-center mt-4">
                    <Button 
                      variant="outline" 
                      className="gap-2"
                      onClick={() => navigate('/production')}
                    >
                      View Full Production Report
                      <ArrowRightCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="inspections" className="space-y-6 mt-0">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatisticsCard
                title="Total Inspections"
                value={allInspections.length}
                icon={<ClipboardCheck className="h-4 w-4 text-primary" />}
                description="All-time"
              />
              <StatisticsCard
                title="Completed"
                value={completedInspections.length}
                icon={<CheckCircle2 className="h-4 w-4 text-green-600" />}
                description="Successfully completed"
              />
              <StatisticsCard
                title="Scheduled"
                value={upcomingInspections.length}
                icon={<Clock className="h-4 w-4 text-blue-600" />}
                description="Upcoming next 7 days"
              />
              <StatisticsCard
                title="Overdue"
                value={overdueInspections.length}
                icon={<AlertCircle className="h-4 w-4 text-red-600" />}
                description="Require immediate attention"
              />
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-md">Inspection Calendar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center py-12">
                  <div className="text-center">
                    <BellRing className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
                    <h3 className="text-lg font-medium">Inspection Calendar</h3>
                    <p className="text-muted-foreground mb-4 max-w-md">
                      Track and schedule your hive inspections using our comprehensive calendar view.
                    </p>
                    <Button 
                      onClick={() => navigate('/inspections')}
                      className="gap-2"
                    >
                      Go to Inspections
                      <ArrowRightCircle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
      
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
      
      <AddInspectionModal
        isOpen={isAddInspectionModalOpen}
        onClose={() => setIsAddInspectionModalOpen(false)}
        onAdd={handleAddInspection}
        hives={hives}
      />
    </PageTransition>
  );
};

export default Dashboard;
