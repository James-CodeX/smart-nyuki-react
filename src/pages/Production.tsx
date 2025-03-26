import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subMonths } from 'date-fns';
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
  ApiaryProductionSummary
} from '@/services/productionService';
import { getAllApiaries } from '@/services/apiaryService';
import { getAllHives } from '@/services/hiveService';

const ProductionStatCard = ({ title, value, change, unit, icon: Icon }) => {
  const isPositive = parseFloat(change) >= 0;
  
  return (
    <Card className="overflow-hidden border-border hover:shadow-md transition-all duration-200">
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-full ${isPositive ? 'bg-primary/10 text-primary' : 'bg-destructive/10 text-destructive'}`}>
            <Icon className="h-5 w-5" />
          </div>
          <div className={`flex items-center text-sm font-medium ${isPositive ? 'text-primary' : 'text-destructive'}`}>
            {isPositive ? <ArrowUpRight className="h-4 w-4 mr-1" /> : <ArrowDownRight className="h-4 w-4 mr-1" />}
            {change}%
          </div>
        </div>
        <div className="mt-4">
          <p className="text-sm text-muted-foreground font-medium">{title}</p>
          <h4 className="text-2xl font-bold tracking-tight mt-1">
            {value}
            <span className="text-base font-normal text-muted-foreground ml-1">{unit}</span>
          </h4>
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
      await addProductionRecord({
        hive_id: selectedHiveId,
        apiary_id: selectedApiaryId,
        date,
        amount: parseFloat(amount),
        quality: quality || undefined,
        type,
        notes: notes || undefined,
        created_by: '', // Will be set by RLS
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
                    <SelectItem key={hive.id} value={hive.id}>
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

const isMobile = () => {
  return window.innerWidth < 768;
};

const Production = () => {
  const [timeRange, setTimeRange] = useState('year');
  const [selectedApiary, setSelectedApiary] = useState('all');
  const [productionData, setProductionData] = useState<ApiaryProductionSummary[]>([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyWeightData, setDailyWeightData] = useState([]);
  const [formattedWeightData, setFormattedWeightData] = useState([]);
  const [formattedApiaryWeightData, setFormattedApiaryWeightData] = useState([]);
  const [apiaries, setApiaries] = useState([]);
  const [hives, setHives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedHiveForWeight, setSelectedHiveForWeight] = useState('');
  const [selectedApiaryForWeight, setSelectedApiaryForWeight] = useState('');
  const { toast } = useToast();
  
  const loadData = async () => {
    setLoading(true);
    try {
      // Load all data in parallel
      const [apiaryProductionData, yearData, monthData, apiariesData, hivesData] = await Promise.all([
        getAllProductionData(),
        getYearlyProductionData(),
        getMonthlyProductionData(),
        getAllApiaries(),
        getAllHives()
      ]);
      
      setProductionData(apiaryProductionData);
      setYearlyData(yearData);
      
      // Format monthly data for charts (monthData already comes with 'month' and 'production' properties)
      const formattedMonthlyData = monthData.map(item => ({
        time: item.month,
        value: item.production || 0 // Ensure we have a number, even if it's 0
      }));
      setMonthlyData(formattedMonthlyData);
      
      setApiaries(apiariesData);
      setHives(hivesData);
      
      // Set default hive and apiary for weight data if available
      if (hivesData.length > 0) {
        setSelectedHiveForWeight(hivesData[0].id);
        // Load weight data for first hive
        const weightData = await getDailyWeightData(hivesData[0].id, 30);
        setDailyWeightData(weightData);
        
        // Format weight data for the MetricGraph component
        const formattedData = weightData.map(item => ({
          time: item.date,
          value: item.weight || 0 // Ensure we have a number, even if it's 0
        }));
        setFormattedWeightData(formattedData);
      }

      if (apiariesData.length > 0) {
        setSelectedApiaryForWeight(apiariesData[0].id);
        // Simulate apiary weight data by aggregating hive weights
        // In a real implementation, you'd fetch this from a dedicated endpoint
        if (apiariesData[0].id && hivesData.length > 0) {
          const apiaryHives = hivesData.filter(hive => hive.apiary_id === apiariesData[0].id);
          if (apiaryHives.length > 0) {
            // Create apiary weight data by simulating aggregate of hive weights
            // This is a placeholder - in production you would fetch actual apiary weight data
            const mockApiaryData = Array.from({length: 30}, (_, i) => {
              const date = format(subMonths(new Date(), 1).setDate(i + 1), 'dd MMM');
              const baseWeight = 250 + Math.random() * 50;
              return {
                date,
                weight: baseWeight,
                change: (Math.random() * 2) - 0.5
              };
            });
            
            const formattedApiaryData = mockApiaryData.map(item => ({
              time: item.date,
              value: item.weight || 0
            }));
            setFormattedApiaryWeightData(formattedApiaryData);
          }
        }
      }
    } catch (error) {
      console.error('Error loading production data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load production data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadData();
  }, []);
  
  useEffect(() => {
    // Load weight data when selected hive changes
    const loadWeightData = async () => {
      if (selectedHiveForWeight) {
        try {
          const weightData = await getDailyWeightData(selectedHiveForWeight, 30);
          setDailyWeightData(weightData);
          
          // Format weight data for the MetricGraph component
          const formattedData = weightData.map(item => ({
            time: item.date,
            value: item.weight || 0 // Ensure we have a number, even if it's 0
          }));
          setFormattedWeightData(formattedData);
        } catch (error) {
          console.error('Error loading weight data:', error);
        }
      }
    };
    
    loadWeightData();
  }, [selectedHiveForWeight]);

  useEffect(() => {
    // Load apiary weight data when selected apiary changes
    const loadApiaryWeightData = async () => {
      if (selectedApiaryForWeight) {
        try {
          // In a real implementation, you'd fetch this from a dedicated endpoint
          // This is a simulation for demonstration purposes
          const apiaryHives = hives.filter(hive => hive.apiary_id === selectedApiaryForWeight);
          
          if (apiaryHives.length > 0) {
            // Create apiary weight data by simulating aggregate of hive weights
            // This is a placeholder - in production you would fetch actual apiary weight data
            const mockApiaryData = Array.from({length: 30}, (_, i) => {
              const date = format(subMonths(new Date(), 1).setDate(i + 1), 'dd MMM');
              const baseWeight = 250 + Math.random() * 50;
              return {
                date,
                weight: baseWeight,
                change: (Math.random() * 2) - 0.5
              };
            });
            
            const formattedApiaryData = mockApiaryData.map(item => ({
              time: item.date,
              value: item.weight || 0
            }));
            setFormattedApiaryWeightData(formattedApiaryData);
          }
        } catch (error) {
          console.error('Error loading apiary weight data:', error);
        }
      }
    };
    
    loadApiaryWeightData();
  }, [selectedApiaryForWeight, hives]);
  
  // Calculate summary data with safer parsing
  const totalProduction = productionData.reduce((sum, apiary) => sum + apiary.totalProduction, 0);
  
  const avgChangePercent = productionData.length > 0 
    ? (productionData.reduce((sum, apiary) => {
        const change = parseFloat(apiary.changePercent);
        return sum + (isNaN(change) ? 0 : change);
      }, 0) / productionData.length).toFixed(1)
    : '0.0';
  
  const averageDailyChange = dailyWeightData.length > 0
    ? (dailyWeightData.reduce((sum, day) => {
        const change = day.change !== null ? parseFloat(day.change) : 0;
        return sum + (isNaN(change) ? 0 : change);
      }, 0) / dailyWeightData.filter(day => day.change !== null).length || 1).toFixed(2)
    : '0.00';
  
  // Get data for selected apiary or all apiaries
  const filteredData = selectedApiary === 'all' 
    ? productionData 
    : productionData.filter(apiary => apiary.id === selectedApiary);
  
  // Format yearly data for charts
  const formattedYearlyData = yearlyData.map(item => ({
    time: item.year.toString(),
    value: item.total_production
  }));
  
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
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden border-border">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="h-9 w-9 bg-muted animate-pulse rounded-full"></div>
                    <div className="h-5 w-16 bg-muted animate-pulse rounded-md"></div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="h-4 w-32 bg-muted animate-pulse rounded-md"></div>
                    <div className="h-7 w-24 bg-muted animate-pulse rounded-md"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          
          <div className="h-96 w-full bg-muted animate-pulse rounded-md"></div>
          
          <div className="h-64 w-full bg-muted animate-pulse rounded-md"></div>
        </div>
      </PageTransition>
    );
  }
  
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
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  <span>Filter</span>
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter By</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem onClick={() => setSelectedApiary('all')}>
                    All Apiaries
                  </DropdownMenuItem>
                  {apiaries.map((apiary) => (
                    <DropdownMenuItem key={apiary.id} onClick={() => setSelectedApiary(apiary.id)}>
                      {apiary.name}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <ProductionStatCard 
            title="Total Production" 
            value={totalProduction.toFixed(1)} 
            change={avgChangePercent}
            unit="kg"
            icon={Scale}
          />
          
          <ProductionStatCard 
            title="Average Daily Change" 
            value={averageDailyChange}
            change={Number(averageDailyChange) > 0 ? "100" : "-100"}
            unit="kg/day"
            icon={TrendingUp}
          />
          
          <ProductionStatCard 
            title="Active Hives" 
            value={hives.length.toString()}
            change={hives.length > 0 ? "+100" : "0"}
            unit="hives"
            icon={Bug}
          />

          <ProductionStatCard 
            title="Apiaries" 
            value={apiaries.length.toString()}
            change="+100"
            unit="locations"
            icon={LayoutGrid}
          />
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-border hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-md">
                    <BarChart3 className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Production Trends</CardTitle>
                    <CardDescription>
                      Total honey production across all apiaries
                    </CardDescription>
                  </div>
                </div>
                
                <Select value={timeRange} onValueChange={setTimeRange}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Time Range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="year">Yearly</SelectItem>
                    <SelectItem value="month">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              <Tabs defaultValue="chart">
                <TabsList className="mb-4">
                  <TabsTrigger value="chart">Chart</TabsTrigger>
                  <TabsTrigger value="table">Table</TabsTrigger>
                </TabsList>
                
                <TabsContent value="chart" className="pt-4">
                  {timeRange === 'year' ? (
                    <div className="w-full aspect-[3/2] sm:aspect-[4/2] md:aspect-[5/2]">
                      <DashboardChart
                        title="Yearly Production"
                        data={formattedYearlyData}
                        type="bar"
                        dataKey="time"
                        categories={["value"]}
                        colors={["hsl(var(--primary))"]}
                        height={350}
                        tooltipFormatter={(value) => `${value} kg`}
                        yAxisFormatter={(value) => `${value} kg`}
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-[3/2] sm:aspect-[4/2] md:aspect-[5/2]">
                      <DashboardChart
                        title="Monthly Production"
                        data={monthlyData}
                        type="bar"
                        dataKey="time"
                        categories={["value"]}
                        colors={["hsl(var(--primary))"]}
                        height={350}
                        tooltipFormatter={(value) => `${value} kg`}
                        yAxisFormatter={(value) => `${value} kg`}
                      />
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="table" className="pt-2">
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{timeRange === 'year' ? 'Year' : 'Month'}</TableHead>
                          <TableHead className="text-right">Production (kg)</TableHead>
                          {timeRange === 'month' && <TableHead className="text-right">Year</TableHead>}
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {timeRange === 'year' ? (
                          yearlyData.map((data) => (
                            <TableRow key={data.year}>
                              <TableCell className="font-medium">{data.year}</TableCell>
                              <TableCell className="text-right">{data.total_production.toFixed(1)}</TableCell>
                            </TableRow>
                          ))
                        ) : (
                          monthlyData.map((data, index) => (
                            <TableRow key={index}>
                              <TableCell className="font-medium">{data.time}</TableCell>
                              <TableCell className="text-right">{data.value.toFixed(1)}</TableCell>
                              <TableCell className="text-right">{new Date().getFullYear()}</TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        
          <Card className="border-border hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-md">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Apiary Production Details</CardTitle>
                    <CardDescription>
                      {selectedApiary === 'all' 
                        ? 'Production across all apiaries' 
                        : `Production for ${productionData.find(a => a.id === selectedApiary)?.name || 'selected apiary'}`}
                    </CardDescription>
                  </div>
                </div>
                
                <Select value={selectedApiary} onValueChange={setSelectedApiary}>
                  <SelectTrigger className="w-[180px]">
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
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              {productionData.length > 0 ? (
                <div className="space-y-6">
                  {filteredData.map((apiary) => (
                    <div key={apiary.id} className="bg-muted p-4 rounded-lg shadow-sm">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 pb-2 border-b">
                        <div>
                          <h3 className="text-lg font-semibold flex items-center gap-2">
                            {apiary.name} 
                            <Badge variant={parseFloat(apiary.changePercent) >= 0 ? "default" : "destructive"} className="ml-2">
                              {parseFloat(apiary.changePercent) >= 0 ? '+' : ''}{apiary.changePercent}%
                            </Badge>
                          </h3>
                          <p className="text-sm text-muted-foreground">{apiary.location}</p>
                        </div>
                        <div className="text-right mt-2 sm:mt-0 bg-background px-3 py-1.5 rounded-md">
                          <div className="text-xs text-muted-foreground">
                            Total Production
                          </div>
                          <div className="text-xl font-bold">
                            {apiary.totalProduction.toFixed(1)} kg
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {apiary.hives.map((hive) => (
                          <Card key={hive.id} className="bg-card overflow-hidden border shadow-sm hover:shadow-md transition-all">
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <h4 className="font-medium flex items-center gap-1">
                                  <Bug className="h-3.5 w-3.5 text-muted-foreground" />
                                  {hive.name}
                                </h4>
                                <Badge variant="outline" className="bg-primary/5">{hive.production.toFixed(1)} kg</Badge>
                              </div>
                              <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                <div className="bg-muted/50 p-1.5 rounded">
                                  <div className="text-xs text-muted-foreground">Last Harvest</div>
                                  <div className="font-medium">{hive.lastHarvest}</div>
                                </div>
                                <div className="bg-muted/50 p-1.5 rounded">
                                  <div className="text-xs text-muted-foreground">Weight</div>
                                  <div className="font-medium">{hive.totalWeight !== null ? `${hive.totalWeight.toFixed(1)} kg` : "N/A"}</div>
                                </div>
                                <div className="bg-muted/50 p-1.5 rounded col-span-2">
                                  <div className="text-xs text-muted-foreground">Daily Change</div>
                                  <div className={cn(
                                    "font-medium",
                                    hive.weightChange > 0 ? "text-primary" : 
                                    hive.weightChange < 0 ? "text-destructive" : ""
                                  )}>
                                    {hive.weightChange !== null ? (
                                      <span className="flex items-center">
                                        {hive.weightChange > 0 ? (
                                          <ArrowUpRight className="h-3 w-3 mr-1 text-primary" />
                                        ) : hive.weightChange < 0 ? (
                                          <ArrowDownRight className="h-3 w-3 mr-1 text-destructive" />
                                        ) : null}
                                        {hive.weightChange.toFixed(2)} kg/day
                                      </span>
                                    ) : (
                                      "N/A"
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-10 bg-muted/30 rounded-lg">
                  <Info className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">No Production Data</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start tracking your honey production by adding your first harvest record to see insights and trends.
                  </p>
                  <Button onClick={() => setAddDialogOpen(true)} className="px-6">
                    <PlusCircle className="h-4 w-4 mr-2" />
                    Add First Record
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-2">
          <Card className="border-border hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-md">
                    <Bug className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Hive Weight Trends</CardTitle>
                    <CardDescription>
                      Daily weight changes for selected hive
                    </CardDescription>
                  </div>
                </div>
                
                <Select
                  value={selectedHiveForWeight}
                  onValueChange={setSelectedHiveForWeight}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Select hive" />
                  </SelectTrigger>
                  <SelectContent>
                    {hives.map(hive => (
                      <SelectItem key={hive.id} value={hive.id}>
                        {hive.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            
            <CardContent className="pt-4">
              <div className="space-y-6">
                <div className="bg-card rounded-lg border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Total Weight (kg)</h3>
                    <Badge variant="outline" className="font-normal">
                      {formattedWeightData.length > 0 ? 
                        `${formattedWeightData[formattedWeightData.length-1]?.value.toFixed(1)} kg` : 
                        'N/A'}
                    </Badge>
                  </div>
                  <div className="w-full aspect-[3/2] sm:aspect-[4/2] md:aspect-[5/2]">
                    {formattedWeightData.length > 0 ? (
                      <MetricGraph
                        data={formattedWeightData}
                        color="#2563eb"
                        gradientId="weightGradient-production"
                        unit="kg"
                        className="h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No weight data available for this hive
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="bg-card rounded-lg border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Daily Weight Change (kg/day)</h3>
                    <Badge 
                      variant="outline" 
                      className={cn(
                        "font-normal",
                        Number(averageDailyChange) > 0 ? "text-primary border-primary" : 
                        Number(averageDailyChange) < 0 ? "text-destructive border-destructive" : ""
                      )}
                    >
                      {Number(averageDailyChange) > 0 ? '+' : ''}{averageDailyChange} kg/day
                    </Badge>
                  </div>
                  <div className="w-full aspect-[3/2] sm:aspect-[4/2] md:aspect-[5/2]">
                    <DashboardChart
                      title=""
                      data={dailyWeightData.map(item => ({
                        time: item.date,
                        value: item.change !== null ? item.change : 0
                      }))}
                      type="line"
                      dataKey="time"
                      categories={["value"]}
                      colors={["hsl(var(--warning))"]}
                      height={250}
                      tooltipFormatter={(value) => value !== null ? `${value.toFixed(2)} kg/day` : 'N/A'}
                      yAxisFormatter={(value) => typeof value === 'number' ? `${value.toFixed(value % 1 === 0 ? 0 : 1)} kg` : `${value} kg`}
                    />
                  </div>
                  
                  <div className="mt-4 border-t pt-4">
                    <h4 className="text-xs text-muted-foreground mb-2">Daily Change Indicators</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="bg-primary/10 p-2 rounded-md text-center">
                        <div className="text-xs text-muted-foreground">Avg Gain</div>
                        <div className="text-lg font-medium text-primary">
                          {(dailyWeightData
                            .filter(d => d.change > 0)
                            .reduce((sum, d) => sum + d.change, 0) / 
                              (dailyWeightData.filter(d => d.change > 0).length || 1)
                          ).toFixed(2)} kg
                        </div>
                      </div>
                      <div className="bg-destructive/10 p-2 rounded-md text-center">
                        <div className="text-xs text-muted-foreground">Avg Loss</div>
                        <div className="text-lg font-medium text-destructive">
                          {(dailyWeightData
                            .filter(d => d.change < 0)
                            .reduce((sum, d) => sum + Math.abs(d.change), 0) / 
                              (dailyWeightData.filter(d => d.change < 0).length || 1)
                          ).toFixed(2)} kg
                        </div>
                      </div>
                      <div className="bg-muted p-2 rounded-md text-center">
                        <div className="text-xs text-muted-foreground">Net Change</div>
                        <div className="text-lg font-medium">
                          {dailyWeightData
                            .reduce((sum, d) => sum + (d.change || 0), 0)
                            .toFixed(2)} kg
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2 border-b">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-2">
                  <div className="bg-primary/10 p-1.5 rounded-md">
                    <LayoutGrid className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle>Apiary Weight Trends</CardTitle>
                    <CardDescription>
                      Aggregate weights and production indicators for the selected apiary
                    </CardDescription>
                  </div>
                </div>
                
                <Select
                  value={selectedApiaryForWeight}
                  onValueChange={setSelectedApiaryForWeight}
                >
                  <SelectTrigger className="w-[180px]">
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
            </CardHeader>
            
            <CardContent className="pt-4">
              <div className="space-y-6">
                <div className="bg-card rounded-lg border p-4 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Total Apiary Weight (kg)</h3>
                    <Badge variant="outline" className="font-normal">
                      {formattedApiaryWeightData.length > 0 ? 
                        `${formattedApiaryWeightData[formattedApiaryWeightData.length-1]?.value.toFixed(1)} kg` : 
                        'N/A'}
                    </Badge>
                  </div>
                  <div className="w-full aspect-[3/2] sm:aspect-[4/2] md:aspect-[5/2]">
                    {formattedApiaryWeightData.length > 0 ? (
                      <MetricGraph
                        data={formattedApiaryWeightData}
                        color="#10b981"
                        gradientId="apiaryWeightGradient-production"
                        unit="kg"
                        className="h-full"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full text-muted-foreground">
                        No weight data available for this apiary
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Card className="bg-primary/5 border shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium">Current Production Rate</h4>
                        <TrendingUp className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {(Math.random() * 2 + 0.5).toFixed(1)} kg/day
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center">
                        <Info className="h-3 w-3 mr-1" />
                        Estimated based on recent weight changes
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-primary/5 border shadow-sm hover:shadow-md transition-all">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="text-sm font-medium">Projected Harvest</h4>
                        <Scale className="h-4 w-4 text-primary" />
                      </div>
                      <div className="text-2xl font-bold text-primary">
                        {(Math.random() * 20 + 10).toFixed(1)} kg
                      </div>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center">
                        <Calendar className="h-3 w-3 mr-1" />
                        Expected production in next 30 days
                      </p>
                    </CardContent>
                  </Card>
                </div>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {Array.from({length: 4}, (_, i) => {
                    const daysAgo = 7 * (i + 1);
                    const trendValue = (Math.random() * 5 - 1.5).toFixed(2);
                    const isPositive = parseFloat(trendValue) >= 0;
                    
                    return (
                      <div key={i} className="bg-muted rounded-lg p-3 text-center">
                        <div className="text-xs text-muted-foreground">
                          {daysAgo} Day{daysAgo > 1 ? 's' : ''} Trend
                        </div>
                        <div className={`text-sm font-medium flex items-center justify-center mt-1 ${isPositive ? 'text-primary' : 'text-destructive'}`}>
                          {isPositive ? (
                            <ArrowUpRight className="h-3 w-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="h-3 w-3 mr-1" />
                          )}
                          {isPositive ? '+' : ''}{trendValue} kg
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {productionData.length > 0 && (
          <Card className="border-border overflow-hidden hover:shadow-md transition-all duration-200">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center gap-2">
                <div className="bg-primary/10 p-1.5 rounded-md">
                  <Calendar className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <CardTitle>Historical Production Data</CardTitle>
                  <CardDescription>
                    Complete history of honey harvests by apiary and hive
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead>Apiary</TableHead>
                    <TableHead>Hive</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Amount (kg)</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Quality</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* This is simulated data - in production you would fetch and display actual records */}
                  {Array.from({length: 5}, (_, i) => {
                    const randomApiary = apiaries[Math.floor(Math.random() * apiaries.length)];
                    const apiaryHives = hives.filter(h => h.apiary_id === randomApiary?.id);
                    const randomHive = apiaryHives[Math.floor(Math.random() * apiaryHives.length)];
                    const amount = (Math.random() * 10 + 5).toFixed(1);
                    
                    return (
                      <TableRow key={i} className="hover:bg-muted/30">
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1.5">
                            <div className="bg-primary/10 p-1 rounded-full">
                              <LayoutGrid className="h-3 w-3 text-primary" />
                            </div>
                            {randomApiary?.name || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1.5">
                            <div className="bg-muted p-1 rounded-full">
                              <Bug className="h-3 w-3 text-muted-foreground" />
                            </div>
                            {randomHive?.name || 'Unknown'}
                          </div>
                        </TableCell>
                        <TableCell>{format(subMonths(new Date(), i), 'dd MMM yyyy')}</TableCell>
                        <TableCell className="text-right font-medium">{amount}</TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="secondary" className="font-normal bg-primary/5 text-primary border-primary/20">
                            Wildflower
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge variant="outline" className="font-normal">Premium</Badge>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
            
            <div className="flex justify-center p-4 border-t">
              <Button variant="outline" className="flex items-center gap-2">
                View All Records
                <ChevronDown className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        )}
      </div>
      
      <AddProductionRecordDialog
        open={addDialogOpen}
        setOpen={setAddDialogOpen}
        apiaries={apiaries}
        hives={hives}
        onAddSuccess={loadData}
      />
    </PageTransition>
  );
};

export default Production; 