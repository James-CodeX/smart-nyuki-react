import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format, subMonths, subDays, subYears } from 'date-fns';
import {
  ChevronDown,
  Filter,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Scale,
  LineChart as LineChartIcon,
} from 'lucide-react';
import PageTransition from '@/components/layout/PageTransition';
import { getAllApiaries, getAllHives } from '@/utils/mockData';
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
  LineChart as RechartsLineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { cn } from '@/lib/utils';

// Mock data for honey production
const generateYearlyProductionData = () => {
  const years = [];
  for (let i = 0; i < 5; i++) {
    const year = new Date().getFullYear() - i;
    years.push({
      year,
      totalProduction: Math.floor(Math.random() * 200) + 100, // 100-300kg
    });
  }
  return years.reverse();
};

const generateMonthlyProductionData = () => {
  const months = [];
  const currentYear = new Date().getFullYear();
  
  for (let i = 0; i < 12; i++) {
    const date = subMonths(new Date(), i);
    months.push({
      month: format(date, 'MMM'),
      year: format(date, 'yyyy'),
      production: Math.floor(Math.random() * 30) + 5, // 5-35kg per month
    });
  }
  return months.reverse();
};

const generateDailyWeightChange = () => {
  const days = [];
  for (let i = 30; i >= 0; i--) {
    const date = subDays(new Date(), i);
    const baseWeight = 50; // baseline weight in kg
    const dailyFluctuation = (Math.random() * 1.5) - 0.5; // -0.5 to 1.0 kg daily change
    
    days.push({
      date: format(date, 'dd MMM'),
      weight: baseWeight + (i * dailyFluctuation).toFixed(1),
      change: dailyFluctuation.toFixed(2),
    });
  }
  return days;
};

// Generate mock production data for each hive and apiary
const generateHiveProductionData = () => {
  const apiaries = getAllApiaries();
  const apiaryData = apiaries.map(apiary => {
    // Calculate total apiary production
    const totalProduction = Math.floor(Math.random() * 80) + 20; // 20-100kg
    const productionLastMonth = Math.floor(Math.random() * 50) + 10; // 10-60kg
    const changePercent = (((totalProduction - productionLastMonth) / productionLastMonth) * 100).toFixed(1);
    
    // Generate production data for each hive in this apiary
    const hives = apiary.hives.map(hive => {
      const hiveProduction = Math.floor(Math.random() * 30) + 5; // 5-35kg
      const lastHarvest = subDays(new Date(), Math.floor(Math.random() * 60)); // Random date within last 60 days
      const projectedHarvest = Math.floor(Math.random() * 15) + 5; // 5-20kg
      
      return {
        id: hive.id,
        name: hive.name,
        production: hiveProduction,
        lastHarvest: format(lastHarvest, 'dd MMM yyyy'),
        projectedHarvest,
        weightChange: (Math.random() * 2 - 0.5).toFixed(2), // -0.5 to 1.5 kg/day
        totalWeight: (hive.metrics.weight[hive.metrics.weight.length - 1].value),
      };
    });
    
    return {
      id: apiary.id,
      name: apiary.name,
      location: apiary.location,
      totalProduction,
      changePercent,
      hives,
    };
  });
  
  return apiaryData;
};

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

const isMobile = () => {
  return window.innerWidth < 768;
};

const Production = () => {
  const [timeRange, setTimeRange] = useState('year');
  const [selectedApiary, setSelectedApiary] = useState('all');
  const [productionData, setProductionData] = useState([]);
  const [yearlyData, setYearlyData] = useState([]);
  const [monthlyData, setMonthlyData] = useState([]);
  const [dailyWeightData, setDailyWeightData] = useState([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    // Simulate API call to fetch production data
    const timer = setTimeout(() => {
      const apiaryProductionData = generateHiveProductionData();
      const yearData = generateYearlyProductionData();
      const monthData = generateMonthlyProductionData();
      const weightData = generateDailyWeightChange();
      
      setProductionData(apiaryProductionData);
      setYearlyData(yearData);
      setMonthlyData(monthData);
      setDailyWeightData(weightData);
      setLoading(false);
    }, 800);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Calculate summary data
  const totalProduction = productionData.reduce((sum, apiary) => sum + apiary.totalProduction, 0);
  const avgChangePercent = productionData.length > 0 
    ? (productionData.reduce((sum, apiary) => sum + parseFloat(apiary.changePercent), 0) / productionData.length).toFixed(1)
    : '0.0';
  
  const averageDailyChange = dailyWeightData.length > 0
    ? (dailyWeightData.reduce((sum, day) => sum + parseFloat(day.change), 0) / dailyWeightData.length).toFixed(2)
    : '0.00';
  
  // Get data for selected apiary or all apiaries
  const filteredData = selectedApiary === 'all' 
    ? productionData 
    : productionData.filter(apiary => apiary.id === selectedApiary);
  
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
          
          <Card className="overflow-hidden border-border">
            <CardHeader>
              <div className="h-6 w-48 bg-muted animate-pulse rounded-md"></div>
              <div className="h-4 w-72 bg-muted animate-pulse rounded-md"></div>
            </CardHeader>
            <CardContent>
              <div className="h-[300px] w-full bg-muted animate-pulse rounded-md"></div>
            </CardContent>
          </Card>
        </div>
      </PageTransition>
    );
  }
  
  return (
    <PageTransition>
      <div className="container max-w-7xl pt-16 md:pt-24 pb-16 px-4 sm:px-6 lg:px-8 space-y-6 md:space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b pb-6">
          <div>
            <motion.h1 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight text-foreground"
            >
              Honey Production
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground mt-1"
            >
              Track honey production, weights, and forecasts across your apiaries
            </motion.p>
          </div>
          
          <div className="flex flex-wrap items-center gap-3">
            <Select 
              value={selectedApiary} 
              onValueChange={setSelectedApiary}
            >
              <SelectTrigger className="w-[180px] border-border">
                <SelectValue placeholder="Select Apiary" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Apiaries</SelectItem>
                {productionData.map(apiary => (
                  <SelectItem key={apiary.id} value={apiary.id}>
                    {apiary.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <div className="flex rounded-md border border-border overflow-hidden">
              <Button 
                variant={timeRange === 'day' ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setTimeRange('day')}
                className="rounded-none border-r border-border px-3 h-9"
              >
                Days
              </Button>
              <Button 
                variant={timeRange === 'month' ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setTimeRange('month')}
                className="rounded-none border-r border-border px-3 h-9"
              >
                Months
              </Button>
              <Button 
                variant={timeRange === 'year' ? "default" : "ghost"} 
                size="sm" 
                onClick={() => setTimeRange('year')}
                className="rounded-none px-3 h-9"
              >
                Years
              </Button>
            </div>
          </div>
        </div>
        
        {/* Summary Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <ProductionStatCard 
            title="Total Honey Production"
            value={totalProduction}
            change={avgChangePercent}
            unit="kg"
            icon={BarChart3}
          />
          
          <ProductionStatCard 
            title="Average Daily Weight Change"
            value={averageDailyChange}
            change={(parseFloat(averageDailyChange) * 100 / 0.5).toFixed(1)}
            unit="kg/day"
            icon={Scale}
          />
          
          <ProductionStatCard 
            title="Projected Next Harvest"
            value={Math.floor(totalProduction * 0.4)}
            change="12.5"
            unit="kg"
            icon={LineChartIcon}
          />
        </div>
        
        {/* Production Trends */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Production Trends</CardTitle>
            <CardDescription>
              {timeRange === 'year' ? 'Yearly honey production for the last 5 years' : 
               timeRange === 'month' ? 'Monthly honey production for the last 12 months' :
               'Daily weight changes for the last 30 days'}
            </CardDescription>
          </CardHeader>
          <CardContent className="px-1">
            <div className="h-[350px] md:h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                {timeRange === 'year' ? (
                  <BarChart data={yearlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="year" />
                    <YAxis label={{ value: 'Production (kg)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Bar dataKey="totalProduction" name="Honey Production" fill="var(--color-amber-500)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                ) : timeRange === 'month' ? (
                  <RechartsLineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="month" />
                    <YAxis label={{ value: 'Production (kg)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="production" 
                      name="Monthly Production"
                      stroke="var(--color-amber-500)" 
                      strokeWidth={2}
                      dot={{ r: 4, fill: "var(--color-amber-500)" }}
                      activeDot={{ r: 6 }}
                    />
                  </RechartsLineChart>
                ) : (
                  <RechartsLineChart data={dailyWeightData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: 'Weight (kg)', angle: -90, position: 'insideLeft' }} />
                    <Tooltip />
                    <Line 
                      type="monotone" 
                      dataKey="weight" 
                      name="Hive Weight"
                      stroke="var(--color-green-500)" 
                      strokeWidth={2}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </RechartsLineChart>
                )}
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
        
        {/* Apiary Production Table */}
        <Tabs defaultValue="apiaries" className="mb-8">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="apiaries">Apiaries</TabsTrigger>
            <TabsTrigger value="hives">Hives</TabsTrigger>
          </TabsList>
          
          <TabsContent value="apiaries" className="mt-4 md:mt-6">
            <Card>
              <CardHeader className="px-4 md:px-6">
                <CardTitle>Apiary Production</CardTitle>
                <CardDescription>
                  Total honey production by apiary with change percentage compared to last period
                </CardDescription>
              </CardHeader>
              <CardContent className="px-4 md:px-6">
                <div className="md:hidden space-y-4">
                  {filteredData.map(apiary => (
                    <Card key={apiary.id} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium">{apiary.name}</h4>
                            <p className="text-sm text-muted-foreground">{apiary.location}</p>
                          </div>
                          <Badge variant="outline" className="bg-background">
                            {apiary.hives.length} hives
                          </Badge>
                        </div>
                        <div className="flex justify-between mt-3 pt-3 border-t">
                          <div>
                            <p className="text-sm text-muted-foreground">Production</p>
                            <p className="font-medium">{apiary.totalProduction} kg</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Change</p>
                            <span className={cn(
                              "inline-flex items-center",
                              parseFloat(apiary.changePercent) >= 0 ? "text-primary" : "text-destructive"
                            )}>
                              {parseFloat(apiary.changePercent) >= 0 ? 
                                <ArrowUpRight className="h-4 w-4 mr-1" /> : 
                                <ArrowDownRight className="h-4 w-4 mr-1" />}
                              {apiary.changePercent}%
                            </span>
                          </div>
                          <div className="flex gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.3-4.3"></path>
                              </svg>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
                
                <div className="hidden md:block rounded-md border">
                  <div className="flex justify-between items-center mb-4">
                    <div className="text-sm text-muted-foreground">
                      Showing {filteredData.length} {filteredData.length === 1 ? 'apiary' : 'apiaries'}
                    </div>
                    <Button variant="outline" size="sm" className="gap-1.5">
                      <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-download">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                        <polyline points="7 10 12 15 17 10"></polyline>
                        <line x1="12" y1="15" x2="12" y2="3"></line>
                      </svg>
                      Export Data
                    </Button>
                  </div>
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-muted/50">
                        <TableHead>Apiary Name</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>Hive Count</TableHead>
                        <TableHead className="text-right">Total Production</TableHead>
                        <TableHead className="text-right">Change</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredData.map(apiary => (
                        <TableRow key={apiary.id} className="hover:bg-muted/50">
                          <TableCell className="font-medium">{apiary.name}</TableCell>
                          <TableCell>{apiary.location}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-background">
                              {apiary.hives.length} hives
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-medium">{apiary.totalProduction} kg</TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                              parseFloat(apiary.changePercent) >= 0 ? "bg-primary/10 text-primary" : "bg-destructive/10 text-destructive"
                            )}>
                              {parseFloat(apiary.changePercent) >= 0 ? 
                                <ArrowUpRight className="h-3 w-3 mr-1" /> : 
                                <ArrowDownRight className="h-3 w-3 mr-1" />}
                              {apiary.changePercent}%
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="11" cy="11" r="8"></circle>
                                <path d="m21 21-4.3-4.3"></path>
                              </svg>
                            </Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                              </svg>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="hives" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Hive Production</CardTitle>
                <CardDescription>
                  Detailed honey production by hive with weight change trends
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Hive Name</TableHead>
                      <TableHead>Apiary</TableHead>
                      <TableHead>Last Harvest</TableHead>
                      <TableHead className="text-right">Production</TableHead>
                      <TableHead className="text-right">Weight</TableHead>
                      <TableHead className="text-right">Daily Change</TableHead>
                      <TableHead className="text-right">Projected Harvest</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredData.flatMap(apiary => 
                      apiary.hives.map(hive => (
                        <TableRow key={hive.id}>
                          <TableCell className="font-medium">{hive.name}</TableCell>
                          <TableCell>{apiary.name}</TableCell>
                          <TableCell>{hive.lastHarvest}</TableCell>
                          <TableCell className="text-right">{hive.production} kg</TableCell>
                          <TableCell className="text-right">{hive.totalWeight.toFixed(1)} kg</TableCell>
                          <TableCell className="text-right">
                            <span className={cn(
                              "inline-flex items-center",
                              parseFloat(hive.weightChange) >= 0 ? "text-green-600" : "text-red-600"
                            )}>
                              {parseFloat(hive.weightChange) >= 0 ? 
                                <ArrowUpRight className="h-4 w-4 mr-1" /> : 
                                <ArrowDownRight className="h-4 w-4 mr-1" />}
                              {hive.weightChange} kg/day
                            </span>
                          </TableCell>
                          <TableCell className="text-right">{hive.projectedHarvest} kg</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* Additional Analysis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Production by Season</CardTitle>
              <CardDescription>
                Seasonal honey production patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { season: 'Spring', production: 85 },
                      { season: 'Summer', production: 140 },
                      { season: 'Fall', production: 60 },
                      { season: 'Winter', production: 15 },
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="season" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="production" fill="var(--color-blue-500)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Correlation: Weight vs Production</CardTitle>
              <CardDescription>
                Relationship between hive weight and honey production
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsLineChart
                    data={filteredData.flatMap(apiary => 
                      apiary.hives.map(hive => ({
                        name: hive.name,
                        weight: hive.totalWeight,
                        production: hive.production,
                      }))
                    )}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis yAxisId="left" orientation="left" stroke="var(--color-amber-500)" />
                    <YAxis yAxisId="right" orientation="right" stroke="var(--color-green-500)" />
                    <Tooltip />
                    <Legend />
                    <Line yAxisId="left" type="monotone" dataKey="production" name="Production (kg)" stroke="var(--color-amber-500)" />
                    <Line yAxisId="right" type="monotone" dataKey="weight" name="Weight (kg)" stroke="var(--color-green-500)" />
                  </RechartsLineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
        
        {/* Weather Impact Analysis */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2 text-primary">
                <path d="M17.5 19H9a7 7 0 1 1 6.71-9h1.79a4.5 4.5 0 1 1 0 9Z"></path>
              </svg>
              Weather Impact Analysis
            </CardTitle>
            <CardDescription>
              How weather conditions affect honey production across your apiaries
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-border bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Temperature Correlation</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <RechartsLineChart
                        data={[
                          { temp: 15, production: 12 },
                          { temp: 18, production: 18 },
                          { temp: 20, production: 25 },
                          { temp: 22, production: 32 },
                          { temp: 25, production: 38 },
                          { temp: 28, production: 35 },
                          { temp: 30, production: 28 },
                          { temp: 33, production: 20 },
                        ]}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis 
                          dataKey="temp" 
                          label={{ value: 'Temperature (°C)', position: 'bottom', offset: 0 }}
                        />
                        <YAxis 
                          label={{ value: 'Production Rate', angle: -90, position: 'insideLeft' }} 
                        />
                        <Tooltip />
                        <Line 
                          type="monotone" 
                          dataKey="production" 
                          name="Production Rate"
                          stroke="var(--color-primary)" 
                          strokeWidth={2}
                          dot={{ r: 4, fill: "var(--color-primary)" }}
                        />
                      </RechartsLineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="mt-2 text-sm text-muted-foreground">
                    Optimal production occurs between 22-27°C with significant drops outside this range.
                  </div>
                </CardContent>
              </Card>
              
              <Card className="border-border bg-card/50">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">Weather Factor Impact</CardTitle>
                </CardHeader>
                <CardContent className="pb-4">
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { factor: 'Temperature', impact: 'High', value: 85, color: 'bg-primary' },
                      { factor: 'Rainfall', impact: 'Medium', value: 65, color: 'bg-blue-500' },
                      { factor: 'Wind Speed', impact: 'Low', value: 35, color: 'bg-amber-500' },
                      { factor: 'Humidity', impact: 'Medium', value: 60, color: 'bg-green-500' },
                    ].map((item, index) => (
                      <div key={index} className="flex flex-col">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-sm font-medium">{item.factor}</span>
                          <Badge variant="outline" className="font-normal text-xs">
                            {item.impact}
                          </Badge>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className={`h-full ${item.color} rounded-full`} style={{ width: `${item.value}%` }} />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {item.value}% impact on production
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 p-3 border rounded-md bg-muted/30 text-sm">
                    <p className="font-medium mb-1">Forecast Analysis</p>
                    <p className="text-muted-foreground">
                      Based on weather forecasts, production is expected to increase by 12% in the next
                      30 days as temperatures stabilize in the optimal range.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
        
        {/* Harvest Forecast */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scale className="h-5 w-5 mr-2 text-primary" />
              Harvest Forecast
            </CardTitle>
            <CardDescription>
              Projected honey production for the next 6 months based on historical data and current hive weights
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.from({ length: 6 }).map((_, index) => {
                const date = new Date();
                date.setMonth(date.getMonth() + index + 1);
                const month = format(date, 'MMMM');
                const projectedAmount = Math.floor(Math.random() * 40) + 10; // 10-50kg
                const confidence = Math.floor(Math.random() * 30) + 70; // 70-100%
                
                return (
                  <Card key={index} className="border-border bg-card/50">
                    <CardContent className="p-4 flex justify-between items-center">
                      <div>
                        <h4 className="font-medium text-foreground">{month}</h4>
                        <p className="text-2xl font-bold text-primary">{projectedAmount} kg</p>
                        <div className="flex items-center mt-1">
                          <div className="h-2 w-24 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full" 
                              style={{ width: `${confidence}%` }} 
                            />
                          </div>
                          <span className="text-xs text-muted-foreground ml-2">{confidence}% confidence</span>
                        </div>
                      </div>
                      <div className={`p-3 rounded-full ${index < 2 ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                        {index < 2 ? (
                          <ArrowUpRight className="h-5 w-5" />
                        ) : (
                          <ArrowDownRight className="h-5 w-5" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Production Efficiency Section */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="h-5 w-5 mr-2 text-primary" />
              Production Efficiency
            </CardTitle>
            <CardDescription>
              Analyze production efficiency metrics across your hives
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="col-span-1 lg:col-span-2">
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={productionData.map(apiary => ({
                        name: apiary.name,
                        avgProduction: apiary.hives.length > 0 ? (apiary.totalProduction / apiary.hives.length).toFixed(1) : 0,
                        efficiency: Math.floor(Math.random() * 40) + 60, // 60-100%
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} />
                      <XAxis type="number" />
                      <YAxis dataKey="name" type="category" width={100} />
                      <Tooltip 
                        formatter={(value, name) => [
                          `${value}${name === 'efficiency' ? '%' : ' kg/hive'}`, 
                          name === 'efficiency' ? 'Efficiency' : 'Avg Production per Hive'
                        ]}
                      />
                      <Legend />
                      <Bar dataKey="avgProduction" name="Avg Production per Hive" fill="var(--color-amber-500)" />
                      <Bar dataKey="efficiency" name="Efficiency" fill="var(--color-primary)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
              
              <div className="space-y-4">
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium text-primary mb-2">Production Insights</h4>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2 mt-0.5">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Apiary "Mountain View" has the highest production efficiency at 92%
                      </li>
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2 mt-0.5">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Average production per hive has increased by 12.5% compared to last season
                      </li>
                      <li className="flex items-start">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary mr-2 mt-0.5">
                          <polyline points="20 6 9 17 4 12"></polyline>
                        </svg>
                        Hives with newer queens show 15% better production rates
                      </li>
                    </ul>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardContent className="p-4">
                    <h4 className="text-sm font-medium mb-2">Efficiency Factors</h4>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs">Queen Age</span>
                          <span className="text-xs font-medium">80%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 rounded-full" style={{ width: "80%" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs">Location</span>
                          <span className="text-xs font-medium">95%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-primary rounded-full" style={{ width: "95%" }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs">Hive Maintenance</span>
                          <span className="text-xs font-medium">75%</span>
                        </div>
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: "75%" }} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PageTransition>
  );
};

export default Production; 