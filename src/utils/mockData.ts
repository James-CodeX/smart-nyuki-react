
// Generate mock data for the app
import { subHours, format } from 'date-fns';

// Generate time points for the last 24 hours (every hour)
const generateTimePoints = (count = 24) => {
  return Array.from({ length: count }).map((_, i) => {
    const date = subHours(new Date(), count - i - 1);
    return format(date, 'HH:mm');
  });
};

const timePoints = generateTimePoints();

// Generate metrics with realistic patterns
const generateTemperatureData = (baseline = 34, variance = 2, count = 24) => {
  return timePoints.map((time, i) => {
    // Create a natural daily cycle with higher temps during the day
    const hourOfDay = parseInt(time.split(':')[0]);
    const timeOfDayFactor = hourOfDay >= 10 && hourOfDay <= 16 ? 1 : 0.5;
    
    // Add some randomness
    const random = (Math.random() - 0.5) * variance;
    
    return {
      time,
      value: baseline + random * timeOfDayFactor
    };
  });
};

const generateHumidityData = (baseline = 50, variance = 15, count = 24) => {
  return timePoints.map((time) => {
    // Humidity tends to be inverse to temperature (higher at night, lower during day)
    const hourOfDay = parseInt(time.split(':')[0]);
    const timeOfDayFactor = hourOfDay >= 10 && hourOfDay <= 16 ? -1 : 1;
    
    const random = (Math.random() - 0.3) * variance;
    
    return {
      time,
      value: Math.max(30, Math.min(80, baseline + random * timeOfDayFactor))
    };
  });
};

const generateSoundData = (baseline = 40, variance = 20, count = 24) => {
  return timePoints.map((time) => {
    // Sound tends to be higher during the day when bees are active
    const hourOfDay = parseInt(time.split(':')[0]);
    const timeOfDayFactor = hourOfDay >= 8 && hourOfDay <= 18 ? 1.5 : 0.7;
    
    const random = (Math.random() - 0.2) * variance;
    
    return {
      time,
      value: Math.max(20, Math.min(80, baseline * timeOfDayFactor + random))
    };
  });
};

const generateWeightData = (baseline = 15, variance = 3, count = 24) => {
  return timePoints.map((time, i) => {
    // Weight generally increases slightly over the day as nectar is collected
    const increase = (i / count) * variance;
    const random = (Math.random() - 0.7) * (variance * 0.2);
    
    return {
      time,
      value: baseline + increase + random
    };
  });
};

// Generate hives data
const generateHive = (id: string, name: string, apiaryId: string, apiaryName: string) => {
  const tempBaseline = 33 + Math.random() * 2;
  const humidityBaseline = 45 + Math.random() * 15;
  const soundBaseline = 35 + Math.random() * 10;
  const weightBaseline = 12 + Math.random() * 8;
  
  const temperature = generateTemperatureData(tempBaseline, 3);
  const humidity = generateHumidityData(humidityBaseline, 15);
  const sound = generateSoundData(soundBaseline, 20);
  const weight = generateWeightData(weightBaseline, 2);
  
  // Generate alerts if metrics are outside acceptable ranges
  const alerts = [];
  
  const currentTemp = temperature[temperature.length - 1].value;
  if (currentTemp > 37) {
    alerts.push({
      type: 'temperature',
      message: 'Temperature too high',
    });
  } else if (currentTemp < 31) {
    alerts.push({
      type: 'temperature',
      message: 'Temperature too low',
    });
  }
  
  const currentHumidity = humidity[humidity.length - 1].value;
  if (currentHumidity > 70) {
    alerts.push({
      type: 'humidity',
      message: 'Humidity too high',
    });
  } else if (currentHumidity < 35) {
    alerts.push({
      type: 'humidity',
      message: 'Humidity too low',
    });
  }
  
  return {
    id,
    name,
    apiaryId,
    apiaryName,
    metrics: {
      temperature,
      humidity,
      sound,
      weight,
    },
    alerts,
  };
};

// Generate apiaries
const generateApiary = (id: string, name: string, location: string, hiveCount: number) => {
  const hives = Array.from({ length: hiveCount }).map((_, i) => {
    return generateHive(
      `hive-${id}-${i + 1}`,
      `Hive ${String.fromCharCode(65 + i)}`, // A, B, C, etc.
      id,
      name
    );
  });
  
  // Calculate averages
  const avgTemperature = hives.reduce((sum, hive) => {
    const temp = hive.metrics.temperature[hive.metrics.temperature.length - 1].value;
    return sum + temp;
  }, 0) / hiveCount;
  
  const avgHumidity = hives.reduce((sum, hive) => {
    const humidity = hive.metrics.humidity[hive.metrics.humidity.length - 1].value;
    return sum + humidity;
  }, 0) / hiveCount;
  
  const avgSound = hives.reduce((sum, hive) => {
    const sound = hive.metrics.sound[hive.metrics.sound.length - 1].value;
    return sum + sound;
  }, 0) / hiveCount;
  
  const avgWeight = hives.reduce((sum, hive) => {
    const weight = hive.metrics.weight[hive.metrics.weight.length - 1].value;
    return sum + weight;
  }, 0) / hiveCount;
  
  return {
    id,
    name,
    location,
    hiveCount,
    hives,
    avgTemperature,
    avgHumidity,
    avgSound,
    avgWeight,
  };
};

// Export mock data
export const apiaries = [
  generateApiary('apiary-1', 'Mountain View Apiary', 'Meadow Hills, CA', 4),
  generateApiary('apiary-2', 'Valley Gardens', 'Sunnydale, OR', 3),
  generateApiary('apiary-3', 'Coastal Bees', 'Ocean Bay, WA', 5),
];

export const getAllApiaries = () => apiaries;

export const getApiaryById = (id: string) => {
  return apiaries.find(apiary => apiary.id === id);
};

export const getHiveById = (apiaryId: string, hiveId: string) => {
  const apiary = apiaries.find(a => a.id === apiaryId);
  if (!apiary) return null;
  
  return apiary.hives.find(h => h.id === hiveId);
};

export const getAllHives = () => {
  return apiaries.flatMap(apiary => apiary.hives);
};
