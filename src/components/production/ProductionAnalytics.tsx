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
  ArrowDownRight 
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface TimeSeriesProps {
  data: { date: string; value: number }[];
  period: 'week' | 'month' | 'year';
  loading: boolean;
}

interface ForecastProps {
  data: { month: string; projected: number; actual: number }[];
  loading: boolean;
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

interface ProductionAnalyticsProps {
  timeSeriesData: TimeSeriesProps['data'];
  forecastData: ForecastProps['data'];
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

export const ForecastChart: React.FC<ForecastProps> = ({ data, loading }) => {
  return (
    <Card className="overflow-hidden border-border hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-2">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-1.5 rounded-md">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <CardTitle className="text-base font-medium">Production Forecast</CardTitle>
            <CardDescription>
              Projected vs actual production
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.map((item, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{item.month}</TableCell>
                      <TableCell className="text-right">{item.actual.toFixed(1)}</TableCell>
                      <TableCell className="text-right">{item.projected.toFixed(1)}</TableCell>
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

const ProductionAnalytics: React.FC<ProductionAnalyticsProps> = ({
  timeSeriesData,
  forecastData,
  stats,
  period,
  loading
}) => {
  // Format data for stats cards
  const productionMetrics = [
    {
      title: 'Total Production',
      value: stats.totalProduction.toFixed(1),
      change: stats.changePercent.toFixed(1),
      unit: 'kg',
      icon: Scale
    },
    {
      title: 'Average Per Hive',
      value: stats.avgProduction.toFixed(1),
      change: '0.0',
      unit: 'kg',
      icon: BarChart3
    },
    {
      title: 'Forecast Next Month',
      value: stats.forecastProduction.toFixed(1),
      change: '+5.5',
      unit: 'kg',
      icon: TrendingUp
    }
  ];

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {productionMetrics.map((metric, index) => (
          <ProductionStatCard 
            key={index}
            title={metric.title}
            value={metric.value}
            change={metric.change}
            unit={metric.unit}
            icon={metric.icon}
          />
        ))}
      </div>
      
      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <ProductionTimeSeriesChart 
          data={timeSeriesData}
          period={period}
          loading={loading}
        />
        
        <ForecastChart 
          data={forecastData}
          loading={loading}
        />
      </div>
      
      {/* Additional Stats */}
      <ProductionStatistics stats={stats} />
    </div>
  );
};

export default ProductionAnalytics; 