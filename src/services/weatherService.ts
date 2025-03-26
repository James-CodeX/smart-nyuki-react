import { format } from 'date-fns';

export interface WeatherData {
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

export interface Forecast {
  date: string;
  day: string;
  condition: string;
  tempMin: number;
  tempMax: number;
  icon: string;
}

// WorldWeatherOnline API key
// In a real app, this would be stored in environment variables
const API_KEY = import.meta.env.VITE_WEATHER_API_KEY || 'YOUR_WORLDWEATHERONLINE_API_KEY';

// Helper function to convert wind degree to direction
const getWindDirection = (degree: number): string => {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(degree / 22.5) % 16;
  return directions[index];
};

/**
 * Fetch current weather data for a location
 */
export const fetchWeatherData = async (latitude: number, longitude: number): Promise<WeatherData> => {
  try {
    // Use mock data for development until API key is set up
    if (API_KEY === 'YOUR_WORLDWEATHERONLINE_API_KEY') {
      console.log('Using mock weather data - no API key provided');
      return mockWeatherData(latitude, longitude);
    }

    console.log(`Fetching weather data for coordinates: ${latitude},${longitude}`);
    
    const apiUrl = `https://api.worldweatheronline.com/premium/v1/weather.ashx?key=${API_KEY}&q=${latitude},${longitude}&format=json&num_of_days=1&fx=yes&cc=yes&mca=no&includelocation=yes&tp=1`;
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('WorldWeatherOnline API response:', data);
    
    // Check if the response contains the expected data
    if (!data.data || !data.data.current_condition || !data.data.current_condition[0]) {
      throw new Error('Invalid API response format: missing current_condition data');
    }
    
    const currentCondition = data.data.current_condition[0];
    const astronomy = data.data.weather[0].astronomy[0];

    // Format the data to match our interface
    const weatherData: WeatherData = {
      condition: currentCondition.weatherDesc[0].value,
      temperature: parseFloat(currentCondition.temp_C),
      tempMin: parseFloat(data.data.weather[0].mintempC),
      tempMax: parseFloat(data.data.weather[0].maxtempC),
      humidity: parseFloat(currentCondition.humidity),
      pressure: parseFloat(currentCondition.pressure),
      windSpeed: parseFloat(currentCondition.windspeedKmph) / 3.6, // Convert km/h to m/s
      windDirection: currentCondition.winddir16Point,
      sunrise: astronomy.sunrise,
      sunset: astronomy.sunset,
      feelsLike: parseFloat(currentCondition.FeelsLikeC || currentCondition.temp_C), // Fallback if FeelsLikeC isn't available
      icon: currentCondition.weatherCode
    };

    return weatherData;
  } catch (error) {
    console.error('Error fetching weather data:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    // Fall back to mock data if the API fails
    return mockWeatherData(latitude, longitude);
  }
};

/**
 * Fetch 5-day forecast for a location
 */
export const fetchForecast = async (latitude: number, longitude: number): Promise<Forecast[]> => {
  try {
    // Use mock data for development until API key is set up
    if (API_KEY === 'YOUR_WORLDWEATHERONLINE_API_KEY') {
      console.log('Using mock forecast data - no API key provided');
      return mockForecast(latitude, longitude);
    }

    console.log(`Fetching forecast data for coordinates: ${latitude},${longitude}`);
    
    const apiUrl = `https://api.worldweatheronline.com/premium/v1/weather.ashx?key=${API_KEY}&q=${latitude},${longitude}&format=json&num_of_days=5&tp=24&fx=yes&cc=yes`;
    console.log('API URL:', apiUrl);
    
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Forecast API error: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    console.log('WorldWeatherOnline forecast API response:', data);
    
    // Check if the response contains the expected data
    if (!data.data || !data.data.weather) {
      throw new Error('Invalid API response format: missing weather forecast data');
    }
    
    const forecasts: Forecast[] = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    
    // Process each day in the forecast
    data.data.weather.forEach((day: any) => {
      try {
        const date = new Date(day.date);
        
        // Ensure required data exists before adding to forecast
        if (day.hourly && day.hourly.length > 0 && day.hourly[0].weatherDesc) {
          forecasts.push({
            date: format(date, 'MMM dd'),
            day: days[date.getDay()],
            condition: day.hourly[0].weatherDesc[0].value,
            tempMin: parseFloat(day.mintempC),
            tempMax: parseFloat(day.maxtempC),
            icon: day.hourly[0].weatherCode
          });
        } else {
          console.warn(`Missing data for forecast day: ${day.date}`);
        }
      } catch (err) {
        console.error(`Error processing forecast for a day:`, err);
      }
    });
    
    return forecasts;
  } catch (error) {
    console.error('Error fetching forecast data:', error);
    if (error instanceof Error) {
      console.error('Error message:', error.message);
    }
    // Fall back to mock data if the API fails
    return mockForecast(latitude, longitude);
  }
};

// Mock data for development - used as fallback if API is not available
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