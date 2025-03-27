import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { 
  CloudRain, 
  Sun, 
  Cloud, 
  Wind, 
  Thermometer, 
  Droplets, 
  Snowflake,
  CloudLightning,
  CloudFog,
  ArrowDown,
  ArrowUp,
  RefreshCw,
  MapPin,
  AlertTriangle,
  Wifi,
  WifiOff
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { getAllApiaries } from '@/services/apiaryService';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { fetchWeatherData, fetchForecast, WeatherData, Forecast } from '@/services/weatherService';

interface ApiaryLocation {
  id: string;
  name: string;
  location: string;
  latitude: number;
  longitude: number;
}

interface WeatherWidgetProps {
  className?: string;
}

// Helper function to get weather icon based on condition code
const getWeatherIcon = (condition: string, size: number = 5) => {
  const iconClass = `h-${size} w-${size}`;
  
  // If it's a numeric code (from WorldWeatherOnline)
  if (!isNaN(Number(condition))) {
    const code = Number(condition);
    
    // Sunny / Clear
    if ([113].includes(code)) {
      return <Sun className={iconClass} />;
    }
    // Partly cloudy
    else if ([116, 119].includes(code)) {
      return <Cloud className={iconClass} />;
    }
    // Cloudy / Overcast
    else if ([122, 143, 248, 260].includes(code)) {
      return <Cloud className={iconClass} />;
    }
    // Rain / Drizzle
    else if ([176, 185, 263, 266, 281, 284, 293, 296, 299, 302, 305, 308, 311, 314, 353, 356, 359].includes(code)) {
      return <CloudRain className={iconClass} />;
    }
    // Snow
    else if ([179, 182, 227, 230, 317, 320, 323, 326, 329, 332, 335, 338, 368, 371, 374, 377].includes(code)) {
      return <Snowflake className={iconClass} />;
    }
    // Thunderstorm
    else if ([200, 386, 389, 392, 395].includes(code)) {
      return <CloudLightning className={iconClass} />;
    }
    // Fog / Mist
    else if ([143, 248, 260].includes(code)) {
      return <CloudFog className={iconClass} />;
    }
    // Default
    else {
      return <Cloud className={iconClass} />;
    }
  }
  // Fallback to text-based condition
  else {
    switch (condition.toLowerCase()) {
      case 'clear':
      case 'sunny':
        return <Sun className={iconClass} />;
      case 'rain':
      case 'drizzle':
      case 'shower rain':
        return <CloudRain className={iconClass} />;
      case 'clouds':
      case 'few clouds':
      case 'scattered clouds':
      case 'broken clouds':
      case 'overcast clouds':
        return <Cloud className={iconClass} />;
      case 'thunderstorm':
        return <CloudLightning className={iconClass} />;
      case 'snow':
        return <Snowflake className={iconClass} />;
      case 'mist':
      case 'fog':
      case 'haze':
        return <CloudFog className={iconClass} />;
      default:
        return <Cloud className={iconClass} />;
    }
  }
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ className }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiaries, setApiaries] = useState<ApiaryLocation[]>([]);
  const [selectedApiaryId, setSelectedApiaryId] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [usingMockData, setUsingMockData] = useState(false);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadApiaries = async () => {
      try {
        setError(null);
        const apiaryData = await getAllApiaries();
        
        // Transform to the format we need
        const transformedApiaries = apiaryData.map(apiary => ({
          id: apiary.id,
          name: apiary.name,
          location: apiary.location || 'Unknown location',
          latitude: apiary.latitude || 40.7128, // Default to NYC
          longitude: apiary.longitude || -74.0060
        }));
        
        setApiaries(transformedApiaries);
        
        // If we have apiaries, set the first one as selected and load its weather
        if (transformedApiaries.length > 0) {
          setSelectedApiaryId(transformedApiaries[0].id);
          loadWeatherData(transformedApiaries[0]);
        } else {
          setLoading(false);
        }
      } catch (error) {
        console.error('Error loading apiaries:', error);
        setError('Failed to load apiaries. Please try again later.');
        toast({
          variant: "destructive",
          title: "Error loading apiaries",
          description: "Could not load your apiaries. Please try again later.",
        });
        setLoading(false);
      }
    };
    
    loadApiaries();
  }, [toast]);
  
  const loadWeatherData = async (apiary: ApiaryLocation) => {
    setLoading(true);
    setError(null);
    setUsingMockData(false);
    
    try {
      // Fetch real weather data using our weather service
      const weather = await fetchWeatherData(apiary.latitude, apiary.longitude);
      const forecastData = await fetchForecast(apiary.latitude, apiary.longitude);
      
      // Check if we received an API error response
      if (weather.condition === 'API Error') {
        setUsingMockData(true);
        console.warn('Using mock weather data - API error occurred');
        setError('API error occurred. Check your API key or network connection.');
      } 
      // Check if we're using mock data
      else if (typeof weather.icon === 'string' && ['clear', 'clouds', 'rain', 'snow', 'mist'].includes(weather.icon.toLowerCase())) {
        setUsingMockData(true);
        console.warn('Using mock weather data - check your API key and connectivity');
      }
      
      setWeatherData(weather);
      setForecast(forecastData);
    } catch (error) {
      console.error('Error loading weather data:', error);
      setError('Failed to fetch weather data. Please check your API key or network connection.');
      toast({
        variant: "destructive",
        title: "Error loading weather",
        description: "Could not load the weather data. Please check your API configuration.",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };
  
  const handleApiaryChange = (apiaryId: string) => {
    setSelectedApiaryId(apiaryId);
    const apiary = apiaries.find(a => a.id === apiaryId);
    if (apiary) {
      loadWeatherData(apiary);
    }
  };
  
  const handleRefresh = () => {
    setRefreshing(true);
    const apiary = apiaries.find(a => a.id === selectedApiaryId);
    if (apiary) {
      loadWeatherData(apiary);
    } else {
      setRefreshing(false);
    }
  };
  
  // Get the selected apiary
  const selectedApiary = apiaries.find(a => a.id === selectedApiaryId);
  
  if (loading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            <span>Weather Conditions</span>
          </CardTitle>
          <CardDescription>Current apiary weather conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Skeleton className="h-8 w-[180px]" />
            <div className="flex space-x-4">
              <Skeleton className="h-20 w-20 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="h-4 w-16" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-4 w-20" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (apiaries.length === 0) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            <span>Weather Conditions</span>
          </CardTitle>
          <CardDescription>Current apiary weather conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <MapPin className="h-10 w-10 text-muted-foreground mb-2" />
            <h3 className="text-lg font-medium">No Apiaries Found</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              You need to add at least one apiary with location information to see weather conditions.
            </p>
            <Button 
              variant="outline"
              onClick={() => window.location.href = '/apiaries/new'}
            >
              Add Apiary
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            <span>Weather Conditions</span>
          </CardTitle>
          <CardDescription>Current apiary weather conditions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <AlertTriangle className="h-10 w-10 text-amber-500 mb-2" />
            <h3 className="text-lg font-medium">Weather Data Error</h3>
            <p className="text-muted-foreground max-w-md mb-4">
              {error}
            </p>
            <Button 
              variant="outline"
              onClick={handleRefresh}
            >
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Cloud className="h-5 w-5" />
          <span>Weather Conditions</span>
          {usingMockData && (
            <Badge variant="outline" className="ml-2 bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
              <AlertTriangle className="h-3 w-3 mr-1" />
              Using Mock Data
            </Badge>
          )}
        </CardTitle>
        <CardDescription>Current apiary weather conditions</CardDescription>
      </CardHeader>
      
      <CardContent>
        <div className="mb-4">
          <Select
            value={selectedApiaryId}
            onValueChange={handleApiaryChange}
            disabled={loading || refreshing}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select an apiary" />
            </SelectTrigger>
            <SelectContent>
              {apiaries.map((apiary) => (
                <SelectItem key={apiary.id} value={apiary.id}>
                  {apiary.name} ({apiary.location})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {error && (
          <div className="mb-4 p-2 rounded bg-red-50 border border-red-200 text-red-700 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          </div>
        )}
        
        {usingMockData && (
          <div className="mb-4 p-2 rounded bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              <span>
                To see real weather data, please add your WorldWeatherOnline API key to the .env file.
              </span>
            </div>
          </div>
        )}

        <Tabs defaultValue="current" className="w-full">
          <div className="px-6 py-2">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="current">Current</TabsTrigger>
              <TabsTrigger value="forecast">Forecast</TabsTrigger>
            </TabsList>
          </div>
          
          <TabsContent value="current" className="px-6 pb-6 pt-2">
            {weatherData && selectedApiary && (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{selectedApiary.location}</span>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-muted-foreground"
                    onClick={handleRefresh}
                    disabled={refreshing}
                  >
                    <RefreshCw className={cn("h-4 w-4", refreshing && "animate-spin")} />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </div>
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary/10">
                      {getWeatherIcon(weatherData.icon, 10)}
                    </div>
                    <div>
                      <h3 className="text-4xl font-bold">
                        {weatherData.temperature}°C
                      </h3>
                      <p className="text-muted-foreground">{weatherData.condition}</p>
                      <div className="flex items-center text-sm mt-1">
                        <ArrowDown className="h-3 w-3 mr-1" />
                        <span className="mr-2">{weatherData.tempMin}°</span>
                        <ArrowUp className="h-3 w-3 mr-1" />
                        <span>{weatherData.tempMax}°</span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Feels like</p>
                    <p className="text-xl font-medium">{weatherData.feelsLike}°C</p>
                  </div>
                </div>
                
                <Separator className="my-4" />
                
                <div className="grid grid-cols-4 gap-2">
                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <Droplets className="h-5 w-5 mb-1 text-blue-500" />
                    <span className="text-xs text-muted-foreground">Humidity</span>
                    <span className="font-medium">{weatherData.humidity}%</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <Wind className="h-5 w-5 mb-1 text-sky-500" />
                    <span className="text-xs text-muted-foreground">Wind</span>
                    <span className="font-medium">{weatherData.windSpeed} m/s {weatherData.windDirection}</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <Sun className="h-5 w-5 mb-1 text-amber-500" />
                    <span className="text-xs text-muted-foreground">Sunrise</span>
                    <span className="font-medium">{weatherData.sunrise}</span>
                  </div>
                  
                  <div className="flex flex-col items-center p-3 bg-muted/50 rounded-lg">
                    <Cloud className="h-5 w-5 mb-1 text-indigo-500" />
                    <span className="text-xs text-muted-foreground">Sunset</span>
                    <span className="font-medium">{weatherData.sunset}</span>
                  </div>
                </div>
                
                <div className="mt-4 text-sm">
                  <p className="text-muted-foreground">
                    Last updated: {format(new Date(), 'h:mm a, MMM dd')}
                  </p>
                </div>
              </>
            )}
          </TabsContent>
          
          <TabsContent value="forecast" className="space-y-4">
            {selectedApiary && (
              <>
                <div className="flex items-center space-x-2 mb-4">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">{selectedApiary.location}</span>
                </div>
                
                <div className="grid grid-cols-5 gap-2">
                  {forecast.map((day, index) => (
                    <div 
                      key={index} 
                      className="flex flex-col items-center border rounded-lg p-3"
                    >
                      <span className="text-sm font-medium">{day.day}</span>
                      <span className="text-xs text-muted-foreground mb-1">{day.date}</span>
                      <div className="my-2">
                        {getWeatherIcon(day.icon, 6)}
                      </div>
                      <div className="flex items-center justify-between w-full text-sm">
                        <span>{day.tempMin}°</span>
                        <span className="font-medium">{day.tempMax}°</span>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-4">
                  <Badge variant="outline">5-Day Forecast</Badge>
                  <p className="text-xs text-muted-foreground mt-1">
                    Forecast data is updated daily and may change.
                  </p>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
      
      <CardFooter className="flex justify-between pt-2">
        <Button 
          variant="outline" 
          size="sm" 
          className="text-xs"
          onClick={handleRefresh}
          disabled={refreshing || loading}
        >
          {refreshing ? (
            <>
              <RefreshCw className="mr-1 h-3 w-3 animate-spin" />
              Refreshing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-1 h-3 w-3" />
              Refresh
            </>
          )}
        </Button>
        
        <Button variant="link" size="sm" className="text-xs">
          View detailed forecast
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WeatherWidget; 