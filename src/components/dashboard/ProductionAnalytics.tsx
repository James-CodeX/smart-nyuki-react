import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  BarChart3, 
  TrendingUp, 
  CalendarDays, 
  ArrowUp, 
  ArrowDown, 
  InfoIcon, 
  Filter 
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { AreaChart, BarChart, LineChart } from '@tremor/react';
import { format, subMonths, subYears, isAfter } from 'date-fns';
import { 
  getProductionForecast, 
  getProductionTimeSeries, 
  getProductionSummary 
} from '@/services/productionService';
import { cn } from '@/lib/utils';

interface ProductionAnalyticsProps {
  className?: string;
}

// Custom formatter for y-axis values (adds kg)
const valueFormatter = (value: number) => `${value} kg`;

const ProductionAnalytics: React.FC<ProductionAnalyticsProps> = ({ className }) => {
  // State for selected view period
  const [period, setPeriod] = useState<'year' | 'month' | 'week'>('month');
  const [loading, setLoading] = useState(true);
  const [apiaryFilter, setApiaryFilter] = useState<string>('all');
  
  // Data states
  const [timeseriesData, setTimeseriesData] = useState<any[]>([]);
  const [forecastData, setForecastData] = useState<any[]>([]);
  const [summaryData, setSummaryData] = useState<{
    totalProduction: number;
    changePercent: number;
    avgProduction: number;
    forecastProduction: number;
    topHive: { name: string; production: number } | null;
    topApiary: { name: string; production: number } | null;
  }>({
    totalProduction: 0,
    changePercent: 0,
    avgProduction: 0,
    forecastProduction: 0,
    topHive: null,
    topApiary: null
  });
  
  // Load data initially and when period changes
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        
        // Get the timeframe based on the selected period
        let startDate: Date;
        switch (period) {
          case 'week':
            startDate = new Date();
            startDate.setDate(startDate.getDate() - 7);
            break;
          case 'year':
            startDate = subYears(new Date(), 1);
            break;
          case 'month':
          default:
            startDate = subMonths(new Date(), 1);
            break;
        }
        
        // Format the date for API request
        const startDateString = format(startDate, 'yyyy-MM-dd');
        
        // Load timeseries data
        const timeseriesDataResult = await getProductionTimeSeries(
          startDateString, 
          format(new Date(), 'yyyy-MM-dd'),
          apiaryFilter === 'all' ? undefined : apiaryFilter
        );
        setTimeseriesData(timeseriesDataResult);
        
        // Load forecast data
        const forecastDataResult = await getProductionForecast(
          apiaryFilter === 'all' ? undefined : apiaryFilter
        );
        setForecastData(forecastDataResult);
        
        // Load summary data
        const summaryResult = await getProductionSummary(
          period,
          apiaryFilter === 'all' ? undefined : apiaryFilter
        );
        setSummaryData(summaryResult);
        
      } catch (error) {
        console.error('Error loading production data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
  }, [period, apiaryFilter]);
  
  const handleApiaryFilterChange = (value: string) => {
    setApiaryFilter(value);
  };
  
  // Filter data for chart display based on the selected period
  const getFilteredChartData = () => {
    if (!timeseriesData?.length) return [];
    
    // For timeframe filtering - already handled by API but ensure clean data
    // by filtering again on client side
    let startDate: Date;
    switch (period) {
      case 'week':
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'year':
        startDate = subYears(new Date(), 1);
        break;
      case 'month':
      default:
        startDate = subMonths(new Date(), 1);
        break;
    }
    
    return timeseriesData
      .filter(item => isAfter(new Date(item.date), startDate))
      .map(item => ({
        ...item,
        // Format the date for display
        date: format(new Date(item.date), period === 'year' ? 'MMM' : 'MMM dd')
      }));
  };
  
  const chartData = getFilteredChartData();
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span>Production Analytics</span>
          </CardTitle>
          <CardDescription>Track and forecast your honey production</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-[250px]" />
            <Skeleton className="h-[200px] w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            <span>Production Analytics</span>
          </CardTitle>
          <CardDescription>Track and forecast your honey production</CardDescription>
        </div>
        <Select value={apiaryFilter} onValueChange={handleApiaryFilterChange}>
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="All Apiaries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Apiaries</SelectItem>
            {/* Note: In a real implementation, you would dynamically populate this list */}
            <SelectItem value="1">Mountain Apiary</SelectItem>
            <SelectItem value="2">Valley Apiary</SelectItem>
            <SelectItem value="3">Forest Apiary</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      
      <Tabs defaultValue="production" className="w-full">
        <div className="px-6 py-2">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="production">Production</TabsTrigger>
            <TabsTrigger value="forecast">Forecast</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="production" className="space-y-4">
          <div className="px-6">
            <div className="flex justify-between items-center mb-4">
              <div className="grid grid-cols-3 gap-4 w-full">
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Total Production</span>
                  <div className="text-2xl font-bold">{summaryData.totalProduction} kg</div>
                  <div className="flex items-center text-xs">
                    {summaryData.changePercent > 0 ? (
                      <>
                        <ArrowUp className="text-green-500 h-3 w-3 mr-1" />
                        <span className="text-green-500">{Math.abs(summaryData.changePercent)}% increase</span>
                      </>
                    ) : summaryData.changePercent < 0 ? (
                      <>
                        <ArrowDown className="text-red-500 h-3 w-3 mr-1" />
                        <span className="text-red-500">{Math.abs(summaryData.changePercent)}% decrease</span>
                      </>
                    ) : (
                      <span>No change</span>
                    )}
                    <span className="ml-1 text-muted-foreground">vs. previous</span>
                  </div>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Average Per Hive</span>
                  <div className="text-2xl font-bold">{summaryData.avgProduction} kg</div>
                </div>
                
                <div className="flex flex-col">
                  <span className="text-sm text-muted-foreground">Forecast Next Month</span>
                  <div className="text-2xl font-bold">{summaryData.forecastProduction} kg</div>
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="flex items-center text-xs text-muted-foreground cursor-help">
                          <InfoIcon className="h-3 w-3 mr-1" />
                          <span>Based on historical data</span>
                        </div>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">Forecast is calculated using historical trends and current hive conditions.</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between mb-2">
              <div className="space-x-1">
                <Button 
                  variant={period === 'week' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setPeriod('week')}
                >
                  Week
                </Button>
                <Button 
                  variant={period === 'month' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setPeriod('month')}
                >
                  Month
                </Button>
                <Button 
                  variant={period === 'year' ? 'default' : 'outline'} 
                  size="sm"
                  onClick={() => setPeriod('year')}
                >
                  Year
                </Button>
              </div>
            </div>
          </div>
          
          <CardContent className="pt-0">
            {chartData.length > 0 ? (
              <AreaChart
                className="h-64 mt-4"
                data={chartData}
                index="date"
                categories={["value"]}
                colors={["amber"]}
                valueFormatter={valueFormatter}
                showLegend={false}
                showGridLines={false}
                showAnimation
                curveType="natural"
              />
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <BarChart3 className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">No Production Data</h3>
                <p className="text-muted-foreground max-w-md">
                  There's no production data available for the selected period. Try selecting a different timeframe or add production records.
                </p>
              </div>
            )}
            
            {(summaryData.topHive || summaryData.topApiary) && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {summaryData.topHive && (
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Top Performing Hive</div>
                    <div className="font-semibold">{summaryData.topHive.name}</div>
                    <div className="text-sm">{summaryData.topHive.production} kg</div>
                  </div>
                )}
                
                {summaryData.topApiary && (
                  <div className="border rounded-lg p-3">
                    <div className="text-sm text-muted-foreground">Top Performing Apiary</div>
                    <div className="font-semibold">{summaryData.topApiary.name}</div>
                    <div className="text-sm">{summaryData.topApiary.production} kg</div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="forecast" className="space-y-4">
          <CardContent>
            <div className="mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <TrendingUp className="h-5 w-5 mr-2" />
                Production Forecast
              </h3>
              <p className="text-sm text-muted-foreground">
                Projected honey production for the next 3 months based on historical data and current hive conditions.
              </p>
            </div>
            
            {forecastData.length > 0 ? (
              <>
                <BarChart
                  className="h-64 mt-6"
                  data={forecastData}
                  index="month"
                  categories={["projected", "actual"]}
                  colors={["amber", "emerald"]}
                  valueFormatter={valueFormatter}
                  showLegend
                  showAnimation
                />
                
                <div className="flex items-center justify-between mt-6">
                  <div>
                    <Badge variant="outline" className="mb-1">Confidence: High</Badge>
                    <div className="text-sm text-muted-foreground">
                      Based on {forecastData.length} months of historical data
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Filter className="h-4 w-4 mr-2" />
                    Adjust Parameters
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <TrendingUp className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">Forecast Unavailable</h3>
                <p className="text-muted-foreground max-w-md">
                  There's not enough historical production data to generate a forecast. Add more production records over time.
                </p>
              </div>
            )}
          </CardContent>
        </TabsContent>
        
        <TabsContent value="trends" className="space-y-4">
          <CardContent>
            <div className="mb-4">
              <h3 className="text-lg font-medium flex items-center">
                <CalendarDays className="h-5 w-5 mr-2" />
                Seasonal Trends
              </h3>
              <p className="text-sm text-muted-foreground">
                Analysis of production patterns across seasons and years
              </p>
            </div>
            
            {chartData.length > 0 ? (
              <>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Peak Production Month</div>
                    <div className="font-semibold text-lg">July</div>
                    <div className="text-sm">Based on historical patterns</div>
                  </div>
                  
                  <div className="border rounded-lg p-4">
                    <div className="text-sm text-muted-foreground mb-1">Year-over-Year Change</div>
                    <div className="font-semibold text-lg flex items-center">
                      <ArrowUp className="text-green-500 h-4 w-4 mr-1" />
                      <span>12.5%</span>
                    </div>
                    <div className="text-sm">Compared to last year</div>
                  </div>
                </div>
                
                <LineChart
                  className="h-64"
                  data={[
                    { month: "Jan", thisYear: 8.2, lastYear: 7.5 },
                    { month: "Feb", thisYear: 9.1, lastYear: 8.2 },
                    { month: "Mar", thisYear: 10.5, lastYear: 9.3 },
                    { month: "Apr", thisYear: 12.3, lastYear: 10.8 },
                    { month: "May", thisYear: 14.8, lastYear: 12.9 },
                    { month: "Jun", thisYear: 16.5, lastYear: 14.5 },
                    { month: "Jul", thisYear: 18.2, lastYear: 16.2 },
                    { month: "Aug", thisYear: 16.9, lastYear: 15.3 },
                    { month: "Sep", thisYear: 14.2, lastYear: 13.4 },
                    { month: "Oct", thisYear: 11.5, lastYear: 10.9 },
                    { month: "Nov", thisYear: 9.8, lastYear: 8.7 },
                    { month: "Dec", thisYear: 8.5, lastYear: 7.9 },
                  ]}
                  index="month"
                  categories={["thisYear", "lastYear"]}
                  colors={["amber", "slate"]}
                  valueFormatter={valueFormatter}
                  showLegend
                  showAnimation
                />
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                <CalendarDays className="h-10 w-10 text-muted-foreground mb-2" />
                <h3 className="text-lg font-medium">Trend Analysis Unavailable</h3>
                <p className="text-muted-foreground max-w-md">
                  There's not enough historical data to analyze production trends. Continue adding records to enable this feature.
                </p>
              </div>
            )}
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter className="flex justify-between">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.location.href = '/production'}
        >
          View Full Production Data
        </Button>
      </CardFooter>
    </Card>
  );
};

export default ProductionAnalytics; 