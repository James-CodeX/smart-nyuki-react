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
  MapPin
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

interface WeatherData {
  condition: string;
  temperature: number;
  tempMin: number;
  tempMax: number;
  humidity: number;
  pressure: number;
  windSpeed: number;
  windDirection: string;
  sunrise: string;
  sunset: string;
  feelsLike: number;
  icon: string;
}

interface Forecast {
  date: string;
  day: string;
  condition: string;
  tempMin: number;
  tempMax: number;
  icon: string;
}

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
};

// Mock data for development - would be replaced by actual API calls
const mockWeatherData = (latitude: number, longitude: number): WeatherData => {
  const conditions = ['Clear', 'Clouds', 'Rain', 'Snow', 'Mist'];
  const condition = conditions[Math.floor(Math.random() * conditions.length)];
  
  // Generate temperature based on month (northern hemisphere)
  const month = new Date().getMonth();
  let baseTemp = 15; // Default base temp
  
  if (month >= 5 && month <= 8) { // Summer (Jun-Sep)
    baseTemp = 25;
  } else if (month >= 9 && month <= 10) { // Fall (Oct-Nov)
    baseTemp = 15;
  } else if (month >= 11 || month <= 1) { // Winter (Dec-Feb)
    baseTemp = 5;
  } else { // Spring (Mar-May)
    baseTemp = 15;
  }
  
  // Adjust for location - simplified
  baseTemp += (latitude - 40) * -0.5; // Cooler as we go north
  
  const temp = baseTemp + (Math.random() * 10 - 5);
  const minTemp = temp - (2 + Math.random() * 3);
  const maxTemp = temp + (2 + Math.random() * 3);
  
  return {
    condition,
    temperature: parseFloat(temp.toFixed(1)),
    tempMin: parseFloat(minTemp.toFixed(1)),
    tempMax: parseFloat(maxTemp.toFixed(1)),
    humidity: Math.floor(50 + Math.random() * 40),
    pressure: Math.floor(980 + Math.random() * 40),
    windSpeed: parseFloat((2 + Math.random() * 8).toFixed(1)),
    windDirection: ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'][Math.floor(Math.random() * 8)],
    sunrise: format(new Date(new Date().setHours(6, Math.floor(Math.random() * 30), 0)), 'h:mm a'),
    sunset: format(new Date(new Date().setHours(19, Math.floor(Math.random() * 30), 0)), 'h:mm a'),
    feelsLike: parseFloat((temp + (Math.random() * 4 - 2)).toFixed(1)),
    icon: condition.toLowerCase()
  };
};

// Mock forecast data
const mockForecast = (latitude: number, longitude: number): Forecast[] => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const conditions = ['Clear', 'Clouds', 'Rain', 'Snow', 'Mist'];
  const today = new Date();
  
  return Array.from({ length: 5 }).map((_, index) => {
    const forecastDate = new Date();
    forecastDate.setDate(today.getDate() + index + 1);
    
    const condition = conditions[Math.floor(Math.random() * conditions.length)];
    const month = forecastDate.getMonth();
    let baseTemp = 15;
    
    if (month >= 5 && month <= 8) { // Summer
      baseTemp = 25;
    } else if (month >= 9 && month <= 10) { // Fall
      baseTemp = 15;
    } else if (month >= 11 || month <= 1) { // Winter
      baseTemp = 5;
    } else { // Spring
      baseTemp = 15;
    }
    
    // Adjust for location
    baseTemp += (latitude - 40) * -0.5;
    
    const temp = baseTemp + (Math.random() * 10 - 5);
    const minTemp = temp - (2 + Math.random() * 3);
    const maxTemp = temp + (2 + Math.random() * 3);
    
    return {
      date: format(forecastDate, 'MMM dd'),
      day: days[forecastDate.getDay()],
      condition,
      tempMin: parseFloat(minTemp.toFixed(1)),
      tempMax: parseFloat(maxTemp.toFixed(1)),
      icon: condition.toLowerCase()
    };
  });
};

const WeatherWidget: React.FC<WeatherWidgetProps> = ({ className }) => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [apiaries, setApiaries] = useState<ApiaryLocation[]>([]);
  const [selectedApiaryId, setSelectedApiaryId] = useState<string>('');
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [forecast, setForecast] = useState<Forecast[]>([]);
  const { toast } = useToast();
  
  useEffect(() => {
    const loadApiaries = async () => {
      try {
        const apiaryData = await getAllApiaries();
        
        // Transform to the format we need
        const transformedApiaries = apiaryData.map(apiary => ({
          id: apiary.id,
          name: apiary.name,
          location: apiary.location,
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
    
    try {
      // In a real implementation, this would be an API call to a weather service
      // For now, just mock the data
      const weather = mockWeatherData(apiary.latitude, apiary.longitude);
      const forecastData = mockForecast(apiary.latitude, apiary.longitude);
      
      setWeatherData(weather);
      setForecast(forecastData);
    } catch (error) {
      console.error('Error loading weather data:', error);
      toast({
        variant: "destructive",
        title: "Error loading weather",
        description: "Could not load the weather data. Please try again later.",
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
  
  return (
    <Card className={className}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="h-5 w-5" />
            <span>Weather Conditions</span>
          </CardTitle>
          <CardDescription>Current apiary weather conditions</CardDescription>
        </div>
        <Select 
          value={selectedApiaryId} 
          onValueChange={handleApiaryChange}
        >
          <SelectTrigger className="w-[180px] h-8">
            <SelectValue placeholder="Select apiary" />
          </SelectTrigger>
          <SelectContent>
            {apiaries.map((apiary) => (
              <SelectItem key={apiary.id} value={apiary.id}>
                {apiary.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </CardHeader>
      
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
                  className="h-8 w-8 p-0" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                >
                  <RefreshCw className={cn(
                    "h-4 w-4",
                    refreshing && "animate-spin"
                  )} />
                  <span className="sr-only">Refresh</span>
                </Button>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary/10">
                    {getWeatherIcon(weatherData.condition, 10)}
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
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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
        
        <TabsContent value="forecast" className="px-6 pb-6 pt-2">
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
                      {getWeatherIcon(day.condition, 6)}
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
      
      <CardFooter className="flex justify-between">
        <Button
          variant="link"
          size="sm"
          className="px-0"
          onClick={() => window.open(`https://weather.com/weather/today/l/${selectedApiary?.latitude},${selectedApiary?.longitude}`, '_blank')}
        >
          View detailed forecast
        </Button>
      </CardFooter>
    </Card>
  );
};

export default WeatherWidget; 