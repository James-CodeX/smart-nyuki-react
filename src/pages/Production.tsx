import React, { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import { format, subMonths, subDays, startOfMonth, endOfMonth, subYears, isAfter, isBefore } from 'date-fns';
import {
  ChevronDown,
  Filter,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  LineChart as LineChartIcon,
  PlusCircle,
  Loader2,
  TrendingUp,
  Activity,
  Info,
  Calendar,
  Bug,
  LayoutGrid,
} from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import MetricGraph from '@/components/ui/MetricGraph';
import DashboardChart from '@/components/dashboard/DashboardChart';

import { 
  ResponsiveContainer,
} from 'recharts';
import { cn } from '@/lib/utils';
import {
  getAllProductionData,
  getYearlyProductionData,
  getMonthlyProductionData,
  getDailyWeightData,
  addProductionRecord,
  ApiaryProductionSummary,
  getProductionTimeSeries,
  getProductionForecast,
  getProductionSummary
} from '@/services/productionService';
import { getAllApiaries } from '@/services/apiaryService';
import { getAllHives } from '@/services/hiveService';
import { supabase } from '@/lib/supabase';
import ProductionAnalytics from '@/components/production/ProductionAnalytics';

const ProductionStatCard = ({ title, value, change, unit, icon: Icon }) => {
  const changeNumber = parseFloat(change);
  const isPositive = changeNumber >= 0;
  
  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="bg-primary/10 p-2 rounded-full">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
            isPositive ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'
          }`}>
            {isPositive 
              ? <ArrowUpRight className="h-3.5 w-3.5 mr-1" /> 
              : <ArrowDownRight className="h-3.5 w-3.5 mr-1" />}
            {Math.abs(changeNumber).toFixed(1)}%
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {value} <span className="text-base font-normal text-muted-foreground">{unit}</span>
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

const AddProductionRecordDialog = ({ open, setOpen, apiaries, hives, onAddSuccess }) => {
  const [selectedApiaryId, setSelectedApiaryId] = useState('');
  const [selectedHiveId, setSelectedHiveId] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [quality, setQuality] = useState('');
  const [type, setType] = useState('');
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Filter hives by selected apiary
  const filteredHives = selectedApiaryId 
    ? hives.filter(hive => hive.apiary_id === selectedApiaryId)
    : [];

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!selectedHiveId || !selectedApiaryId || !amount || !date || !type) {
      toast({
        title: 'Missing fields',
        description: 'Please fill out all required fields.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    
    try {
      // Get current user
      const { data: userData } = await supabase.auth.getUser();
      if (!userData?.user) {
        throw new Error('User is not authenticated');
      }

      await addProductionRecord({
        hive_id: selectedHiveId,
        apiary_id: selectedApiaryId,
        date,
        amount: parseFloat(amount),
        quality: quality || undefined,
        type,
        notes: notes || undefined,
        created_by: userData.user.id, // Use actual user ID from auth
        user_id: userData.user.id // Add user_id field as well
      });
      
      toast({
        title: 'Success',
        description: 'Production record added successfully.',
      });
      
      // Reset form and close dialog
      setSelectedApiaryId('');
      setSelectedHiveId('');
      setAmount('');
      setDate(format(new Date(), 'yyyy-MM-dd'));
      setQuality('');
      setType('');
      setNotes('');
      setOpen(false);
      
      // Notify parent component to refresh data
      if (onAddSuccess) onAddSuccess();
    } catch (error) {
      console.error('Error adding production record:', error);
      toast({
        title: 'Error',
        description: 'Failed to add production record. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Production Record</DialogTitle>
          <DialogDescription>
            Enter the details of the honey harvest for this hive.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="apiary">Apiary</Label>
              <Select 
                value={selectedApiaryId} 
                onValueChange={setSelectedApiaryId}
              >
                <SelectTrigger id="apiary">
                  <SelectValue placeholder="Select apiary" />
                </SelectTrigger>
                <SelectContent>
                  {apiaries.map(apiary => (
                    <SelectItem key={apiary.id} value={apiary.id}>
                      {apiary.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="hive">Hive</Label>
              <Select 
                value={selectedHiveId} 
                onValueChange={setSelectedHiveId}
                disabled={!selectedApiaryId}
              >
                <SelectTrigger id="hive">
                  <SelectValue placeholder={selectedApiaryId ? "Select hive" : "Select apiary first"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredHives.map(hive => (
                    <SelectItem key={hive.hive_id} value={hive.hive_id}>
                      {hive.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount (kg)</Label>
              <Input 
                id="amount" 
                type="number" 
                step="0.1" 
                min="0" 
                value={amount} 
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 10.5"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="date">Harvest Date</Label>
              <Input 
                id="date" 
                type="date" 
                value={date} 
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Honey Type</Label>
              <Input 
                id="type" 
                value={type} 
                onChange={(e) => setType(e.target.value)}
                placeholder="e.g. Wildflower"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="quality">Quality (optional)</Label>
              <Select 
                value={quality} 
                onValueChange={setQuality}
              >
                <SelectTrigger id="quality">
                  <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Premium">Premium</SelectItem>
                  <SelectItem value="Standard">Standard</SelectItem>
                  <SelectItem value="Processing Grade">Processing Grade</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea 
              id="notes" 
              value={notes} 
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Additional details about this harvest..."
              rows={3}
            />
          </div>
          
          <DialogFooter>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full sm:w-auto"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Add Record'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ForecastChart = ({ data, loading }) => {
  return (
    <DashboardChart
      title="Production Forecast"
      description="Projected vs actual production over time"
      data={data}
      type="bar"
      dataKey="month"
      categories={['projected', 'actual']}
      colors={['#38bdf8', '#f59e0b']}
      height={300}
      yAxisFormatter={(value) => `${value}kg`}
      tooltipFormatter={(value) => `${value}kg`}
    />
  );
};

const ProductionTimeSeriesChart = ({ data, loading, period }) => {
  const title = useMemo(() => {
    switch (period) {
      case 'week':
        return 'Weekly Production';
      case 'month':
        return 'Monthly Production';
      case 'year':
        return 'Yearly Production';
      default:
        return 'Production Over Time';
    }
  }, [period]);

  return (
    <DashboardChart
      title={title}
      description="Honey production over time"
      data={data}
      type="area"
      dataKey="date"
      categories={['value']}
      colors={['#f59e0b']}
      height={300}
      yAxisFormatter={(value) => `${value}kg`}
      tooltipFormatter={(value) => `${value}kg`}
    />
  );
};

const Production = () => {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [apiaries, setApiaries] = useState([]);
  const [allHives, setAllHives] = useState([]);
  const [apiarySummaries, setApiarySummaries] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApiaryId, setSelectedApiaryId] = useState('all');
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [yearlyProduction, setYearlyProduction] = useState([]);
  const [monthlyProduction, setMonthlyProduction] = useState([]);
  const [timeSeriesData, setTimeSeriesData] = useState([]);
  const [forecastData, setForecastData] = useState([]);
  const [productionStats, setProductionStats] = useState({
    totalProduction: 0,
    changePercent: 0,
    avgProduction: 0,
    forecastProduction: 0,
    topHive: null,
    topApiary: null
  });
  
  // Get date range based on selected period
  const getDateRange = () => {
    const now = new Date();
    let startDate, endDate;
    
    switch (selectedPeriod) {
      case 'week':
        startDate = subDays(now, 7);
        endDate = now;
        break;
      case 'month':
        startDate = startOfMonth(now);
        endDate = endOfMonth(now);
        break;
      case 'year':
        startDate = subYears(now, 1);
        endDate = now;
        break;
      default:
        startDate = subMonths(now, 1);
        endDate = now;
    }
    
    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd')
    };
  };
  
  // Load data based on the selected period and apiary
  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load apiaries and hives
      const apiaryData = await getAllApiaries();
      setApiaries(apiaryData);
      
      const hivesData = await getAllHives();
      setAllHives(hivesData);
      
      // Load production summary data
      const summaries = await getAllProductionData();
      setApiarySummaries(summaries);
      
      // Load yearly and monthly production
      const yearlyData = await getYearlyProductionData();
      setYearlyProduction(yearlyData);
      
      const monthlyData = await getMonthlyProductionData();
      setMonthlyProduction(monthlyData);
      
      // Get date range for time series
      const { startDate, endDate } = getDateRange();
      
      // Load time series data
      const seriesData = await getProductionTimeSeries(
        startDate,
        endDate,
        selectedApiaryId === 'all' ? undefined : selectedApiaryId
      );
      setTimeSeriesData(seriesData);
      
      // Load forecast data
      const forecast = await getProductionForecast(
        selectedApiaryId === 'all' ? undefined : selectedApiaryId
      );
      setForecastData(forecast);
      
      // Load production stats
      const stats = await getProductionSummary(
        selectedPeriod,
        selectedApiaryId === 'all' ? undefined : selectedApiaryId
      );
      setProductionStats(stats);
    } catch (error) {
      console.error('Error loading production data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load data on initial render
  useEffect(() => {
    loadData();
  }, []);
  
  // Reload data when period or apiary selection changes
  useEffect(() => {
    loadData();
  }, [selectedPeriod, selectedApiaryId]);
  
  const handleAddSuccess = () => {
    loadData();
  };
  
  // Helper function to check if we're on mobile
  const isMobile = () => {
    return window.innerWidth < 768;
  };

  // Prepare the cards data
  const productionMetrics = [
    {
      title: 'Total Production',
      value: productionStats.totalProduction.toFixed(1),
      change: productionStats.changePercent.toFixed(1),
      unit: 'kg',
      icon: Scale
    },
    {
      title: 'Average Per Hive',
      value: productionStats.avgProduction.toFixed(1),
      change: '0.0',
      unit: 'kg',
      icon: BarChart3
    },
    {
      title: 'Forecast Next Month',
      value: productionStats.forecastProduction.toFixed(1),
      change: '+5.5',
      unit: 'kg',
      icon: TrendingUp
    }
  ];

  return (
    <PageTransition>
      <div className="container max-w-7xl pt-16 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <Scale className="h-5 w-5 text-primary" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight">Honey Production</h1>
            </div>
            <p className="text-muted-foreground mt-2 ml-9">
              Track your honey harvests and hive productivity across all apiaries
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              variant="outline" 
              onClick={() => setAddDialogOpen(true)}
              className="flex items-center"
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Record
            </Button>
            
            <Select 
              value={selectedPeriod} 
              onValueChange={(value) => setSelectedPeriod(value as 'week' | 'month' | 'year')}>
              <SelectTrigger className="w-[130px]">
                <SelectValue placeholder="Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Use the ProductionAnalytics component */}
            <ProductionAnalytics
              timeSeriesData={timeSeriesData}
              forecastData={forecastData}
              stats={productionStats}
              period={selectedPeriod}
              loading={isLoading}
            />
            
            {/* Apiaries Section */}
            <div className="space-y-6 mt-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h2 className="text-xl font-semibold">Apiary Production</h2>
                
                <Select 
                  value={selectedApiaryId} 
                  onValueChange={setSelectedApiaryId}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="All Apiaries" />
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
              </div>
              
              {apiarySummaries.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(selectedApiaryId === 'all' 
                    ? apiarySummaries 
                    : apiarySummaries.filter(a => a.id === selectedApiaryId)
                  ).map(apiary => (
                    <Card key={apiary.id} className="overflow-hidden border-border hover:shadow-md transition-all duration-200">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-semibold">{apiary.name}</CardTitle>
                        <CardDescription>{apiary.location}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Total Production</p>
                            <p className="text-2xl font-bold">{apiary.totalProduction.toFixed(1)} <span className="text-base font-normal text-muted-foreground">kg</span></p>
                          </div>
                          <div className={`flex items-center text-sm font-medium px-2 py-1 rounded-full ${
                            parseFloat(apiary.changePercent) >= 0 
                              ? 'bg-primary/10 text-primary' 
                              : 'bg-destructive/10 text-destructive'
                          }`}>
                            {parseFloat(apiary.changePercent) >= 0 
                              ? <ArrowUpRight className="h-4 w-4 mr-1" /> 
                              : <ArrowDownRight className="h-4 w-4 mr-1" />}
                            {Math.abs(parseFloat(apiary.changePercent)).toFixed(1)}%
                          </div>
                        </div>
                        
                        {apiary.hives.length > 0 ? (
                          <div className="space-y-4">
                            <h4 className="text-sm font-medium">Hives ({apiary.hives.length})</h4>
                            <div className="space-y-2">
                              {apiary.hives.map(hive => (
                                <div key={hive.id} className="flex justify-between items-center py-2 border-b border-border last:border-0">
                                  <div>
                                    <p className="font-medium">{hive.name}</p>
                                    <p className="text-xs text-muted-foreground">Last harvest: {hive.lastHarvest}</p>
                                  </div>
                                  <div className="text-right">
                                    <p className="font-semibold">{hive.production.toFixed(1)} kg</p>
                                    {hive.weightChange !== null && (
                                      <p className={`text-xs ${hive.weightChange >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                        {hive.weightChange >= 0 ? '+' : ''}{hive.weightChange.toFixed(1)} kg
                                      </p>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        ) : (
                          <div className="text-center py-6 text-muted-foreground">
                            <p>No hives in this apiary</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <div className="bg-muted/30 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Scale className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-medium mb-2">No Production Records</h3>
                  <p className="text-muted-foreground max-w-md mx-auto mb-6">
                    You haven't added any production records yet. Start tracking your honey harvests by adding your first record.
                  </p>
                  <Button
                    onClick={() => setAddDialogOpen(true)}
                    className="flex items-center mx-auto"
                  >
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add First Record
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
        
        {/* Add Production Record Dialog */}
        <AddProductionRecordDialog
          open={addDialogOpen}
          setOpen={setAddDialogOpen}
          apiaries={apiaries}
          hives={allHives}
          onAddSuccess={handleAddSuccess}
        />
      </div>
    </PageTransition>
  );
};

export default Production; 