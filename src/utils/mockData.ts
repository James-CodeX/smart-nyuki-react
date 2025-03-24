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
  const apiary = getApiaryById(apiaryId);
  return apiary?.hives.find(hive => hive.id === hiveId);
};

export const getAllHives = () => {
  return apiaries.flatMap(apiary => apiary.hives);
};

// Add new functions for creating apiaries and hives
export const addApiary = (name: string, location: string) => {
  const newId = `apiary-${Date.now()}`;
  const newApiary = {
    id: newId,
    name,
    location,
    hives: [],
    hiveCount: 0,
    avgTemperature: 34 + (Math.random() - 0.5) * 2,
    avgHumidity: 50 + (Math.random() - 0.5) * 10,
    avgSound: 45 + (Math.random() - 0.5) * 15,
    avgWeight: 50 + (Math.random() - 0.5) * 10,
  };
  
  apiaries.push(newApiary);
  return newApiary;
};

export const addHive = (
  name: string, 
  apiaryId: string, 
  node_id: string,
  hiveType: string,
  queenAge?: string,
  installationDate?: string,
  notes?: string
) => {
  const apiary = getApiaryById(apiaryId);
  if (!apiary) return null;
  
  const apiaryName = apiary.name;
  const newId = `hive-${Date.now()}`;
  
  const temperatureData = generateTemperatureData();
  const humidityData = generateHumidityData();
  const soundData = generateSoundData();
  const weightData = generateWeightData();
  
  const newHive = {
    id: newId,
    name,
    apiaryId,
    apiaryName,
    node_id,
    hiveType,
    queenAge,
    installationDate,
    notes,
    metrics: {
      temperature: temperatureData,
      humidity: humidityData,
      sound: soundData,
      weight: weightData
    },
    alerts: []
  };
  
  apiary.hives.push(newHive);
  
  // Update apiary averages
  updateApiaryAverages(apiaryId);
  
  return newHive;
};

// Helper function to update apiary averages after adding a hive
const updateApiaryAverages = (apiaryId: string) => {
  const apiary = getApiaryById(apiaryId);
  if (!apiary || apiary.hives.length === 0) return;
  
  let totalTemp = 0;
  let totalHumidity = 0;
  let totalSound = 0;
  let totalWeight = 0;
  
  apiary.hives.forEach(hive => {
    const latestTemp = hive.metrics.temperature[hive.metrics.temperature.length - 1].value;
    const latestHumidity = hive.metrics.humidity[hive.metrics.humidity.length - 1].value;
    const latestSound = hive.metrics.sound[hive.metrics.sound.length - 1].value;
    const latestWeight = hive.metrics.weight[hive.metrics.weight.length - 1].value;
    
    totalTemp += latestTemp;
    totalHumidity += latestHumidity;
    totalSound += latestSound;
    totalWeight += latestWeight;
  });
  
  const hiveCount = apiary.hives.length;
  apiary.avgTemperature = parseFloat((totalTemp / hiveCount).toFixed(1));
  apiary.avgHumidity = parseFloat((totalHumidity / hiveCount).toFixed(1));
  apiary.avgSound = parseFloat((totalSound / hiveCount).toFixed(1));
  apiary.avgWeight = parseFloat((totalWeight / hiveCount).toFixed(1));
};

// Inspection data interfaces
export interface InspectionFindings {
  queenSighted: boolean;
  broodPattern: number; // 1-5 scale
  honeyStores: number; // 1-5 scale
  populationStrength: number; // 1-5 scale
  temperament: number; // 1-5 scale
  diseasesSighted: boolean;
  varroaCount?: number;
  notes?: string;
}

export interface Inspection {
  id: string;
  apiaryId: string;
  hiveId: string;
  date: string;
  type: 'regular' | 'health-check' | 'winter-prep' | 'varroa-check' | 'disease-treatment' | 'harvest-evaluation';
  status: 'scheduled' | 'completed' | 'overdue' | 'cancelled';
  findings?: InspectionFindings;
  notes?: string;
  createdBy: string;
  createdAt: string;
}

// Inspection mock data
const mockInspections: Inspection[] = [
  {
    id: '1',
    apiaryId: '1',
    hiveId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString(),
    type: 'regular',
    status: 'completed',
    findings: {
      queenSighted: true,
      broodPattern: 4,
      honeyStores: 3,
      populationStrength: 4,
      temperament: 5,
      diseasesSighted: false
    },
    notes: 'Hive is doing well. Strong population and good brood pattern. The queen was spotted on frame 6.',
    createdBy: 'John Doe',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString()
  },
  {
    id: '2',
    apiaryId: '1',
    hiveId: '2',
    date: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString(),
    type: 'health-check',
    status: 'completed',
    findings: {
      queenSighted: false,
      broodPattern: 3,
      honeyStores: 2,
      populationStrength: 3,
      temperament: 4,
      diseasesSighted: true,
      varroaCount: 5
    },
    notes: 'Found signs of Varroa mites. Treatment might be necessary soon.',
    createdBy: 'Jane Smith',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 8)).toISOString()
  },
  {
    id: '3',
    apiaryId: '2',
    hiveId: '3',
    date: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString(),
    type: 'winter-prep',
    status: 'completed',
    findings: {
      queenSighted: true,
      broodPattern: 4,
      honeyStores: 5,
      populationStrength: 4,
      temperament: 3,
      diseasesSighted: false
    },
    notes: 'Prepared for winter. Added insulation and reduced the entrance.',
    createdBy: 'John Doe',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString()
  },
  {
    id: '4',
    apiaryId: '2',
    hiveId: '4',
    date: new Date(new Date().setHours(new Date().getHours() + 24)).toISOString(),
    type: 'regular',
    status: 'scheduled',
    createdBy: 'Jane Smith',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString()
  },
  {
    id: '5',
    apiaryId: '1',
    hiveId: '1',
    date: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString(),
    type: 'varroa-check',
    status: 'completed',
    findings: {
      queenSighted: true,
      broodPattern: 5,
      honeyStores: 4,
      populationStrength: 5,
      temperament: 4,
      diseasesSighted: true,
      varroaCount: 2
    },
    notes: 'Minimal varroa presence detected. Hive is strong and healthy.',
    createdBy: 'John Doe',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 35)).toISOString()
  },
  {
    id: '6',
    apiaryId: '3',
    hiveId: '5',
    date: new Date(new Date().setDate(new Date().getDate() - 15)).toISOString(),
    type: 'disease-treatment',
    status: 'completed',
    findings: {
      queenSighted: false,
      broodPattern: 3,
      honeyStores: 3,
      populationStrength: 3,
      temperament: 2,
      diseasesSighted: true,
      varroaCount: 8
    },
    notes: 'Applied treatment for varroa mites. Will check effectiveness in 7 days.',
    createdBy: 'Jane Smith',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 20)).toISOString()
  },
  {
    id: '7',
    apiaryId: '3',
    hiveId: '5',
    date: new Date(new Date().setDate(new Date().getDate() - 7)).toISOString(),
    type: 'health-check',
    status: 'completed',
    findings: {
      queenSighted: true,
      broodPattern: 4,
      honeyStores: 3,
      populationStrength: 3,
      temperament: 3,
      diseasesSighted: true,
      varroaCount: 3
    },
    notes: 'Treatment appears to be working. Varroa count decreased.',
    createdBy: 'Jane Smith',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 12)).toISOString()
  },
  {
    id: '8',
    apiaryId: '1',
    hiveId: '2',
    date: new Date(new Date().setDate(new Date().getDate() - 45)).toISOString(),
    type: 'harvest-evaluation',
    status: 'completed',
    findings: {
      queenSighted: true,
      broodPattern: 5,
      honeyStores: 5,
      populationStrength: 5,
      temperament: 4,
      diseasesSighted: false
    },
    notes: 'Ready for harvest. Estimated yield: 15kg.',
    createdBy: 'John Doe',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 50)).toISOString()
  },
  {
    id: '9',
    apiaryId: '2',
    hiveId: '4',
    date: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString(),
    type: 'health-check',
    status: 'overdue',
    createdBy: 'Jane Smith',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 10)).toISOString()
  },
  {
    id: '10',
    apiaryId: '3',
    hiveId: '6',
    date: new Date().toISOString(),
    type: 'regular',
    status: 'scheduled',
    createdBy: 'John Doe',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 5)).toISOString()
  },
  // Add a few more scheduled inspections in the future
  {
    id: '11',
    apiaryId: '1',
    hiveId: '1',
    date: new Date(new Date().setDate(new Date().getDate() + 3)).toISOString(),
    type: 'health-check',
    status: 'scheduled',
    createdBy: 'John Doe',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 2)).toISOString()
  },
  {
    id: '12',
    apiaryId: '2',
    hiveId: '3',
    date: new Date(new Date().setDate(new Date().getDate() + 7)).toISOString(),
    type: 'varroa-check',
    status: 'scheduled',
    createdBy: 'Jane Smith',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString()
  },
  {
    id: '13',
    apiaryId: '3',
    hiveId: '5',
    date: new Date(new Date().setDate(new Date().getDate() + 14)).toISOString(),
    type: 'harvest-evaluation',
    status: 'scheduled',
    createdBy: 'John Doe',
    createdAt: new Date(new Date().setDate(new Date().getDate() - 3)).toISOString()
  }
];

// Inspection functions
export const getAllInspections = (): Inspection[] => {
  return mockInspections;
};

export const getInspectionsByApiary = (apiaryId: string): Inspection[] => {
  return mockInspections.filter(inspection => inspection.apiaryId === apiaryId);
};

export const getInspectionsByHive = (apiaryId: string, hiveId: string): Inspection[] => {
  return mockInspections.filter(
    inspection => inspection.apiaryId === apiaryId && inspection.hiveId === hiveId
  );
};

export const getInspectionById = (id: string): Inspection | undefined => {
  return mockInspections.find(inspection => inspection.id === id);
};

export const getCompletedInspections = (): Inspection[] => {
  return mockInspections.filter(inspection => inspection.status === 'completed');
};

export const getScheduledInspections = (): Inspection[] => {
  return mockInspections.filter(inspection => inspection.status === 'scheduled');
};

export const getOverdueInspections = (): Inspection[] => {
  const now = new Date();
  return mockInspections.filter(
    inspection => 
      inspection.status === 'overdue' || 
      (inspection.status === 'scheduled' && new Date(inspection.date) < now)
  );
};

export const getUpcomingInspections = (days: number = 7): Inspection[] => {
  const now = new Date();
  const future = new Date();
  future.setDate(now.getDate() + days);
  
  return mockInspections.filter(
    inspection => 
      inspection.status === 'scheduled' && 
      new Date(inspection.date) >= now &&
      new Date(inspection.date) <= future
  );
};

export const getInspectionsByDate = (date: Date): Inspection[] => {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  
  return mockInspections.filter(
    inspection => {
      const inspectionDate = new Date(inspection.date);
      return inspectionDate >= startOfDay && inspectionDate <= endOfDay;
    }
  );
};

export const getInspectionsForCalendar = (month: Date): Record<string, Inspection[]> => {
  const startOfMonth = new Date(month.getFullYear(), month.getMonth(), 1);
  const endOfMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0);
  
  const filteredInspections = mockInspections.filter(
    inspection => {
      const inspectionDate = new Date(inspection.date);
      return inspectionDate >= startOfMonth && inspectionDate <= endOfMonth;
    }
  );
  
  const groupedByDate: Record<string, Inspection[]> = {};
  
  filteredInspections.forEach(inspection => {
    const dateStr = new Date(inspection.date).toISOString().split('T')[0];
    if (!groupedByDate[dateStr]) {
      groupedByDate[dateStr] = [];
    }
    groupedByDate[dateStr].push(inspection);
  });
  
  return groupedByDate;
};

// Add inspection function
export const addInspection = (inspectionData: Omit<Inspection, 'id' | 'createdAt'>) => {
  const newId = `inspection-${Date.now()}`;
  const newInspection: Inspection = {
    ...inspectionData,
    id: newId,
    createdAt: new Date().toISOString(),
  };
  
  mockInspections.push(newInspection);
  return newInspection;
};
