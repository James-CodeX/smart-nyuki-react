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
    <Card className="overflow-hidden border-border">
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
  const [apiaries, setApiaries] = useState([]);
  const [hives, setHives] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [selectedHiveForWeight, setSelectedHiveForWeight] = useState('');
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
      
      // Set default hive for weight data if available
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
            <h1 className="text-3xl font-bold tracking-tight">Honey Production</h1>
            <p className="text-muted-foreground mt-1">
              Track your honey harvests and hive productivity
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button 
              size="sm" 
              variant="outline" 
              className="flex items-center"
              onClick={() => loadData()}
            >
              <LineChartIcon className="h-4 w-4 mr-2" />
              Refresh
            </Button>
            
            <Button 
              size="sm" 
              className="flex items-center"
              onClick={() => setAddDialogOpen(true)}
            >
              <PlusCircle className="h-4 w-4 mr-2" />
              Add Record
            </Button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductionStatCard
            title="Total Honey Production"
            value={totalProduction.toFixed(1)}
            change={avgChangePercent}
            unit="kg"
            icon={BarChart3}
          />
          
          <ProductionStatCard
            title="Daily Weight Change"
            value={averageDailyChange}
            change={(parseFloat(averageDailyChange || '0') * 10).toFixed(1)}
            unit="kg"
            icon={Scale}
          />
          
          <ProductionStatCard
            title="Active Hives"
            value={hives.length}
            change={(productionData.length > 0 && hives.length > 0) ? (totalProduction / hives.length).toFixed(1) : '0'}
            unit="kg/hive"
            icon={LineChartIcon}
          />
        </div>
        
        <Card className="border-border">
          <CardHeader className="flex flex-col sm:flex-row justify-between pb-2">
            <div>
              <CardTitle>Production Overview</CardTitle>
              <CardDescription>
                Honey production by time period
              </CardDescription>
            </div>
            
            <div className="flex items-center gap-4 mt-4 sm:mt-0">
              <Select
                value={selectedApiary}
                onValueChange={setSelectedApiary}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select apiary" />
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="ml-auto">
                    <Filter className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline">Filter</span>
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>View Options</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => setTimeRange('year')}>
                      Yearly View
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setTimeRange('month')}>
                      Monthly View
                    </DropdownMenuItem>
                  </DropdownMenuGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </CardHeader>
          
          <CardContent>
            <Tabs defaultValue="chart" className="w-full">
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
        
        <Card className="border-border">
          <CardHeader className="flex flex-col sm:flex-row justify-between pb-2">
            <div>
              <CardTitle>Hive Weight Trends</CardTitle>
              <CardDescription>
                Daily weight changes for selected hive
              </CardDescription>
            </div>
            
            <div className="mt-4 sm:mt-0">
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
          
          <CardContent>
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
            
            <div className="mt-6">
              <h4 className="text-sm font-medium mb-2">Daily Weight Change</h4>
              <div className="w-full aspect-[3/2] sm:aspect-[4/2] md:aspect-[5/2]">
                <DashboardChart
                  title="Daily Weight Change"
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
            </div>
          </CardContent>
        </Card>
        
        {productionData.length > 0 ? (
          <Card className="border-border">
            <CardHeader>
              <CardTitle>Apiary Production Details</CardTitle>
              <CardDescription>
                Detailed production data by apiary and hive
              </CardDescription>
            </CardHeader>
            
            <CardContent>
              <div className="space-y-8">
                {filteredData.map((apiary) => (
                  <div key={apiary.id} className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{apiary.name}</h3>
                        <p className="text-sm text-muted-foreground">{apiary.location}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">
                          Total: {apiary.totalProduction.toFixed(1)} kg
                        </span>
                        <Badge variant={parseFloat(apiary.changePercent) >= 0 ? "default" : "destructive"} className="ml-2">
                          {parseFloat(apiary.changePercent) >= 0 ? '+' : ''}{apiary.changePercent}%
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Hive</TableHead>
                            <TableHead className="text-right">Production (kg)</TableHead>
                            <TableHead className="hidden md:table-cell">Last Harvest</TableHead>
                            <TableHead className="hidden md:table-cell text-right">Weight Change (kg/day)</TableHead>
                            <TableHead className="text-right">Current Weight (kg)</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {apiary.hives.map((hive) => (
                            <TableRow key={hive.id}>
                              <TableCell className="font-medium">{hive.name}</TableCell>
                              <TableCell className="text-right">{hive.production.toFixed(1)}</TableCell>
                              <TableCell className="hidden md:table-cell">{hive.lastHarvest}</TableCell>
                              <TableCell 
                                className={cn(
                                  "hidden md:table-cell text-right",
                                  hive.weightChange > 0 ? "text-primary" : 
                                  hive.weightChange < 0 ? "text-destructive" : ""
                                )}
                              >
                                {hive.weightChange !== null ? (
                                  <span className="flex items-center justify-end">
                                    {hive.weightChange > 0 ? (
                                      <ArrowUpRight className="h-4 w-4 mr-1 text-primary" />
                                    ) : hive.weightChange < 0 ? (
                                      <ArrowDownRight className="h-4 w-4 mr-1 text-destructive" />
                                    ) : null}
                                    {hive.weightChange.toFixed(2)}
                                  </span>
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                {hive.totalWeight !== null ? hive.totalWeight.toFixed(1) : "N/A"}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-border">
            <CardContent className="p-8 flex flex-col items-center justify-center min-h-[200px]">
              <div className="text-center max-w-md">
                <h3 className="text-lg font-medium mb-2">No Production Data Yet</h3>
                <p className="text-muted-foreground mb-6">
                  Start tracking your honey production by adding your first harvest record.
                </p>
                <Button onClick={() => setAddDialogOpen(true)}>
                  <PlusCircle className="h-4 w-4 mr-2" />
                  Add First Record
                </Button>
              </div>
            </CardContent>
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