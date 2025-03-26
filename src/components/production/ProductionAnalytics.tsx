import React, { useMemo } from 'react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from '@/components/ui/card';
import DashboardChart from '@/components/dashboard/DashboardChart';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Scale, 
  TrendingUp, 
  BarChart3, 
  ArrowUpRight, 
  ArrowDownRight,
  Activity,
  Clock,
  Calendar,
  History,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EnhancedForecastData } from '@/services/productionService';

interface TimeSeriesProps {
  data: { date: string; value: number }[];
  period: 'week' | 'month' | 'year';
  loading: boolean;
}

interface ForecastProps {
  data: EnhancedForecastData[];
  loading: boolean;
  timeframe: 'month' | 'quarter' | 'year';
}

interface ProductionStats {
  totalProduction: number;
  changePercent: number;
  avgProduction: number;
  forecastProduction: number;
  topHive: { id: string; name: string; production: number } | null;
  topApiary: { id: string; name: string; production: number } | null;
}

interface ProductionStatCardProps {
  title: string;
  value: string;
  change: string;
  unit: string;
  icon: React.ElementType;
}

interface ForecastInsightCardProps {
  forecastData: EnhancedForecastData[];
  loading: boolean;
}

interface ProductionAnalyticsProps {
  timeSeriesData: TimeSeriesProps['data'];
  forecastData: EnhancedForecastData[];
  stats: ProductionStats;
  period: 'week' | 'month' | 'year';
  loading: boolean;
}

export const ProductionTimeSeriesChart: React.FC<TimeSeriesProps> = ({ data, period, loading }) => {
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
    <Card className="overflow-hidden border-border hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-md">
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-medium">{title}</CardTitle>
            <CardDescription>
              Honey production over time
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="chart">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart">
            <DashboardChart
              title=""
              data={data}
              type="area"
              dataKey="date"
              categories={['value']}
              colors={['#f59e0b']}
              height={300}
              yAxisFormatter={(value) => `${value}kg`}
              tooltipFormatter={(value) => `${value}kg`}
            />
          </TabsContent>
          
          <TabsContent value="table">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Production (kg)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.date}</TableCell>
                      <TableCell className="text-right">{item.value.toFixed(1)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export const ForecastChart: React.FC<ForecastProps> = ({ data, loading, timeframe }) => {
  const titleMap = {
    'month': 'Monthly Production Forecast',
    'quarter': 'Quarterly Production Forecast',
    'year': 'Annual Production Forecast'
  };

  const chartData = useMemo(() => {
    return data.map(item => ({
      month: item.month,
      projected: item.projected,
      actual: item.actual
    }));
  }, [data]);
  
  return (
    <Card className="overflow-hidden border-border hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-md">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-medium">{titleMap[timeframe] || 'Production Forecast'}</CardTitle>
            <CardDescription>
              Projected vs actual production with confidence scoring
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <Tabs defaultValue="chart">
          <TabsList className="mb-4">
            <TabsTrigger value="chart">Chart</TabsTrigger>
            <TabsTrigger value="table">Table</TabsTrigger>
            <TabsTrigger value="factors">Factors</TabsTrigger>
          </TabsList>
          
          <TabsContent value="chart">
            <DashboardChart
              title=""
              data={chartData}
              type="bar"
              dataKey="month"
              categories={['projected', 'actual']}
              colors={['#38bdf8', '#f59e0b']}
              height={300}
              yAxisFormatter={(value) => `${value}kg`}
              tooltipFormatter={(value) => `${value}kg`}
            />
          </TabsContent>
          
          <TabsContent value="table">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead className="text-right">Actual (kg)</TableHead>
                    <TableHead className="text-right">Projected (kg)</TableHead>
                    <TableHead className="text-right">Confidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.month}</TableCell>
                      <TableCell className="text-right">{item.actual.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{item.projected.toFixed(1)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Progress
                            value={item.confidence}
                            className="h-2 w-16"
                            indicatorClassName={
                              item.confidence > 70 ? "bg-green-500" :
                              item.confidence > 40 ? "bg-amber-500" : "bg-red-500"
                            }
                          />
                          <span className="text-xs">
                            {item.confidence}%
                          </span>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </TabsContent>

          <TabsContent value="factors">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Month</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Scale className="h-3.5 w-3.5" />
                        <span>Weight</span>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5" />
                        <span>Frequency</span>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>Seasonal</span>
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <History className="h-3.5 w-3.5" />
                        <span>Historical</span>
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.month}</TableCell>
                      {Object.entries(item.factors).map(([key, value], i) => (
                        <TableCell key={i}>
                          <Progress
                            value={value * 100}
                            className="h-2"
                            indicatorClassName={
                              value > 0.7 ? "bg-green-500" :
                              value > 0.4 ? "bg-amber-500" : 
                              value > 0 ? "bg-red-500" : "bg-gray-300"
                            }
                          />
                          <span className="text-xs block mt-1 text-right">
                            {(value * 100).toFixed(0)}%
                          </span>
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="text-xs text-muted-foreground mt-4 flex items-start gap-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0 mt-0.5" />
              <p>
                Factors contributing to forecast: <strong>Weight</strong> (hive weight data), 
                <strong>Frequency</strong> (harvest intervals), <strong>Seasonal</strong> (monthly patterns), 
                and <strong>Historical</strong> (past production)
              </p>
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export const ProductionStatCard: React.FC<ProductionStatCardProps> = ({ 
  title, 
  value, 
  change, 
  unit, 
  icon: Icon 
}) => {
  const changeNumber = parseFloat(change);
  const isPositive = changeNumber >= 0;
  
  return (
    <Card className="border-border">
      <CardContent className="p-6">
        <div className="flex justify-between">
          <div className="bg-primary/10 p-2 rounded-full">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
            isPositive 
              ? 'bg-primary/10 text-primary' 
              : 'bg-destructive/10 text-destructive'
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

export const ProductionStatistics: React.FC<{ stats: ProductionStats }> = ({ stats }) => {
  return (
    <Card className="overflow-hidden border-border hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Production Highlights</CardTitle>
        <CardDescription>
          Top performers and key metrics
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {stats.topHive && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  Top Performing Hive
                </h3>
                <Badge variant="outline" className="font-normal">
                  {stats.topHive.production.toFixed(1)} kg
                </Badge>
              </div>
              <p className="text-base font-semibold">{stats.topHive.name}</p>
            </div>
          )}
          
          {stats.topApiary && (
            <div className="bg-muted/30 p-4 rounded-lg">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-sm font-medium flex items-center gap-2">
                  Top Performing Apiary
                </h3>
                <Badge variant="outline" className="font-normal">
                  {stats.topApiary.production.toFixed(1)} kg
                </Badge>
              </div>
              <p className="text-base font-semibold">{stats.topApiary.name}</p>
            </div>
          )}
        </div>
        
        <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="bg-muted/30 p-3 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Total</p>
            <p className="text-base font-semibold">{stats.totalProduction.toFixed(1)} kg</p>
          </div>
          
          <div className="bg-muted/30 p-3 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Average</p>
            <p className="text-base font-semibold">{stats.avgProduction.toFixed(1)} kg</p>
          </div>
          
          <div className="bg-muted/30 p-3 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Change</p>
            <p className={`text-base font-semibold ${stats.changePercent >= 0 ? 'text-primary' : 'text-destructive'}`}>
              {stats.changePercent >= 0 ? '+' : ''}{stats.changePercent.toFixed(1)}%
            </p>
          </div>
          
          <div className="bg-muted/30 p-3 rounded-lg text-center">
            <p className="text-xs text-muted-foreground mb-1">Forecast</p>
            <p className="text-base font-semibold">{stats.forecastProduction.toFixed(1)} kg</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const ForecastInsightCard: React.FC<ForecastInsightCardProps> = ({ forecastData, loading }) => {
  // Take only the first month's forecast for detailed insights
  const forecast = forecastData.length > 0 ? forecastData[0] : null;
  
  if (loading || !forecast) {
    return (
      <Card className="overflow-hidden border-border">
        <CardContent className="p-6">
          <div className="flex justify-center items-center h-48">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Calculate the primary factor driving the forecast
  const factors = forecast.factors;
  const primaryFactor = Object.entries(factors).reduce(
    (max, [key, value]) => value > max.value ? { key, value } : max,
    { key: '', value: 0 }
  );
  
  // Map factor keys to readable names
  const factorNames = {
    weight: 'Hive Weight',
    harvestFrequency: 'Harvest Frequency',
    seasonal: 'Seasonal Pattern',
    historical: 'Historical Data'
  };
  
  // Map factor keys to icons
  const factorIcons = {
    weight: Scale,
    harvestFrequency: Clock,
    seasonal: Calendar,
    historical: History
  };
  
  // Get the primary factor name and icon
  const primaryFactorName = factorNames[primaryFactor.key as keyof typeof factorNames];
  const PrimaryFactorIcon = factorIcons[primaryFactor.key as keyof typeof factorIcons];
  
  return (
    <Card className="overflow-hidden border-border hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-md">
            <AlertCircle className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-medium">Forecast Insights</CardTitle>
            <CardDescription>
              Understanding what drives the production forecast
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-3 bg-primary/5 rounded-lg">
            <div className="bg-background p-2 rounded-full">
              {PrimaryFactorIcon && <PrimaryFactorIcon className="h-5 w-5 text-primary" />}
            </div>
            <div>
              <h4 className="font-medium">Primary Factor: {primaryFactorName}</h4>
              <p className="text-sm text-muted-foreground">
                {primaryFactor.key === 'weight' && 'Current hive weight is the strongest predictor for your upcoming harvest'}
                {primaryFactor.key === 'harvestFrequency' && 'Your recent harvest frequency is the key indicator for the forecast'}
                {primaryFactor.key === 'seasonal' && 'Seasonal patterns for this month are driving the forecast prediction'}
                {primaryFactor.key === 'historical' && 'Your historical production during this period is the most reliable indicator'}
              </p>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Forecast Confidence: {forecast.confidence}%</h4>
            <Progress 
              value={forecast.confidence} 
              className="h-2.5"
              indicatorClassName={
                forecast.confidence > 70 ? "bg-green-500" :
                forecast.confidence > 40 ? "bg-amber-500" : "bg-red-500"
              }
            />
            <p className="text-xs text-muted-foreground mt-2">
              {forecast.confidence > 70 
                ? 'High confidence forecast based on strong historical data and consistent patterns'
                : forecast.confidence > 40
                ? 'Moderate confidence based on limited but relevant data'
                : 'Low confidence forecast - consider adding more data points to improve accuracy'}
            </p>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">All Factors</h4>
            <div className="space-y-2">
              {Object.entries(factors).map(([key, value]) => (
                <div key={key} className="grid grid-cols-[1fr_auto] gap-2 items-center">
                  <div>
                    <div className="flex items-center gap-1.5">
                      {factorIcons[key as keyof typeof factorIcons] && 
                        React.createElement(factorIcons[key as keyof typeof factorIcons], {
                          className: "h-3.5 w-3.5 text-muted-foreground"
                        })
                      }
                      <span className="text-sm">{factorNames[key as keyof typeof factorNames]}</span>
                    </div>
                    <Progress 
                      value={value * 100} 
                      className="h-1.5 mt-1"
                      indicatorClassName={
                        value > 0.7 ? "bg-green-500" :
                        value > 0.4 ? "bg-amber-500" : 
                        value > 0 ? "bg-red-500" : "bg-gray-300"
                      }
                    />
                  </div>
                  <span className="text-sm font-medium">{(value * 100).toFixed(0)}%</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="pt-2">
            <p className="text-sm">
              <strong>Estimated Production:</strong> {forecast.projected.toFixed(1)}kg in {forecast.month}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              This forecast is updated daily based on the latest hive weights and production records
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProductionAnalytics: React.FC<ProductionAnalyticsProps> = ({
  timeSeriesData,
  forecastData,
  stats,
  period,
  loading
}) => {
  // Convert week period to month for forecast timeframe
  const forecastTimeframe = period === 'week' ? 'month' : period as 'month' | 'quarter' | 'year';
  
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <ProductionStatCard
          title="Total Production"
          value={stats.totalProduction.toFixed(1)}
          change={stats.changePercent.toFixed(1)}
          unit="kg"
          icon={Scale}
        />
        
        <ProductionStatCard
          title="Average Production"
          value={stats.avgProduction.toFixed(1)}
          change={stats.changePercent.toFixed(1)}
          unit="kg/hive"
          icon={Activity}
        />
        
        {stats.topHive && (
          <ProductionStatCard
            title="Top Performing Hive"
            value={stats.topHive.production.toFixed(1)}
            change="+0.0"
            unit="kg"
            icon={TrendingUp}
          />
        )}
        
        {stats.topApiary && (
          <ProductionStatCard
            title="Top Performing Apiary"
            value={stats.topApiary.production.toFixed(1)}
            change="+0.0"
            unit="kg"
            icon={BarChart3}
          />
        )}
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ProductionTimeSeriesChart 
          data={timeSeriesData}
          period={period}
          loading={loading}
        />
        
        <ForecastChart 
          data={forecastData}
          loading={loading}
          timeframe={forecastTimeframe}
        />
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ForecastInsightCard
          forecastData={forecastData}
          loading={loading}
        />
        
        <ProductionStatistics stats={stats} />
      </div>
    </div>
  );
};

export default ProductionAnalytics; 