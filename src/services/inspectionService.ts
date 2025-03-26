import { supabase } from '@/lib/supabase';

// Types
export interface InspectionFindings {
  id?: string;
  inspection_id: string;
  queen_sighted: boolean;
  brood_pattern: number; // 1-5 scale
  honey_stores: number; // 1-5 scale 
  population_strength: number; // 1-5 scale
  temperament: number; // 1-5 scale
  diseases_sighted: boolean;
  varroa_count?: number;
  notes?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface Inspection {
  id: string;
  hive_id: string;
  inspection_date: string;
  weight?: number;
  temperature?: number;
  humidity?: number;
  weather_conditions?: string;
  hive_strength?: number;
  queen_seen: boolean;
  eggs_seen: boolean;
  larvae_seen: boolean;
  queen_cells_seen: boolean;
  disease_signs: boolean;
  disease_details?: string;
  varroa_check: boolean;
  varroa_count?: number;
  honey_stores?: number;
  pollen_stores?: number;
  added_supers?: number;
  removed_supers?: number;
  feed_added: boolean;
  feed_type?: string;
  feed_amount?: string;
  medications_added: boolean;
  medication_details?: string;
  notes?: string;
  images?: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface InspectionWithHiveDetails extends Inspection {
  hive_name: string;
  apiary_id: string;
  apiary_name: string;
}

/**
 * Get all inspections for the authenticated user
 */
export const getAllInspections = async (): Promise<InspectionWithHiveDetails[]> => {
  try {
    // First get the inspections
    const { data: inspections, error } = await supabase
      .from('inspections')
      .select('*')
      .order('inspection_date', { ascending: false });

    if (error) {
      throw error;
    }

    if (!inspections?.length) {
      return [];
    }

    // Get all the hives for lookup
    const { data: hives } = await supabase
      .from('hives')
      .select(`
        hive_id,
        name,
        apiary_id,
        apiaries (
          id,
          name
        )
      `);

    // Create a map of hives by hive_id for fast lookup
    const hivesMap = (hives || []).reduce((map, hive) => {
      map[hive.hive_id] = hive;
      return map;
    }, {});

    // Transform the data to match our interface
    const transformedInspections = inspections.map(inspection => {
      const hive = hivesMap[inspection.hive_id];
      return {
        ...inspection,
        hive_name: hive?.name || 'Unknown',
        apiary_id: hive?.apiary_id || '',
        apiary_name: hive?.apiaries?.name || 'Unknown',
      };
    });

    return transformedInspections;
  } catch (error) {
    console.error('Error fetching inspections:', error);
    throw error;
  }
};

/**
 * Get inspections by hive ID
 */
export const getInspectionsByHive = async (hiveId: string): Promise<Inspection[]> => {
  try {
    const { data: inspections, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('hive_id', hiveId)
      .order('inspection_date', { ascending: false });

    if (error) {
      throw error;
    }

    return inspections || [];
  } catch (error) {
    console.error('Error fetching hive inspections:', error);
    throw error;
  }
};

/**
 * Get inspections by apiary ID
 */
export const getInspectionsByApiary = async (apiaryId: string): Promise<InspectionWithHiveDetails[]> => {
  try {
    // Get all hives for this apiary
    const { data: hives } = await supabase
      .from('hives')
      .select(`
        hive_id,
        name,
        apiary_id,
        apiaries (
          id,
          name
        )
      `)
      .eq('apiary_id', apiaryId);
    
    if (!hives?.length) {
      return [];
    }
    
    // Extract hive_ids
    const hiveIds = hives.map(hive => hive.hive_id);
    
    // Create a map of hives by hive_id for fast lookup
    const hivesMap = hives.reduce((map, hive) => {
      map[hive.hive_id] = hive;
      return map;
    }, {});
    
    // Get all inspections for these hives
    const { data: inspections, error } = await supabase
      .from('inspections')
      .select('*')
      .in('hive_id', hiveIds)
      .order('inspection_date', { ascending: false });

    if (error) {
      throw error;
    }

    if (!inspections?.length) {
      return [];
    }

    // Transform the data to match our interface
    const transformedInspections = inspections.map(inspection => {
      const hive = hivesMap[inspection.hive_id];
      return {
        ...inspection,
        hive_name: hive?.name || 'Unknown',
        apiary_id: hive?.apiary_id || '',
        apiary_name: hive?.apiaries?.name || 'Unknown',
      };
    });

    return transformedInspections;
  } catch (error) {
    console.error('Error fetching apiary inspections:', error);
    throw error;
  }
};

/**
 * Get a specific inspection by ID
 */
export const getInspectionById = async (inspectionId: string): Promise<InspectionWithHiveDetails | null> => {
  try {
    // Get the inspection
    const { data: inspection, error } = await supabase
      .from('inspections')
      .select('*')
      .eq('id', inspectionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No inspection found
      }
      throw error;
    }

    if (!inspection) {
      return null;
    }

    // Get the hive details
    const { data: hive } = await supabase
      .from('hives')
      .select(`
        hive_id,
        name,
        apiary_id,
        apiaries (
          id,
          name
        )
      `)
      .eq('hive_id', inspection.hive_id)
      .single();

    // Transform the data to match our interface
    const transformedInspection = {
      ...inspection,
      hive_name: hive?.name || 'Unknown',
      apiary_id: hive?.apiary_id || '',
      apiary_name: hive?.apiaries?.name || 'Unknown',
    };

    return transformedInspection;
  } catch (error) {
    console.error('Error fetching inspection:', error);
    throw error;
  }
};

/**
 * Get inspection findings by inspection ID
 */
export const getInspectionFindings = async (inspectionId: string): Promise<InspectionFindings | null> => {
  try {
    const { data: findings, error } = await supabase
      .from('inspection_findings')
      .select('*')
      .eq('inspection_id', inspectionId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // No findings found
      }
      throw error;
    }

    return findings;
  } catch (error) {
    console.error('Error fetching inspection findings:', error);
    throw error;
  }
};

/**
 * Create a new inspection with the option to add findings data
 * @param inspectionData - The inspection data to create
 * @param findingsData - Optional findings data to create
 * @returns The created inspection
 */
export const createInspection = async (
  inspectionData: Partial<Omit<Inspection, 'id' | 'created_at' | 'updated_at'>>,
  findingsData?: Partial<Omit<InspectionFindings, 'id' | 'created_at' | 'updated_at' | 'inspection_id'>>
): Promise<Inspection> => {
  try {
    // Set default values for boolean fields if not provided
    const defaultedInspectionData = {
      queen_seen: false,
      eggs_seen: false,
      larvae_seen: false,
      queen_cells_seen: false,
      disease_signs: false,
      varroa_check: false,
      feed_added: false,
      medications_added: false,
      ...inspectionData
    };

    // Insert the inspection
    const { data: inspection, error } = await supabase
      .from('inspections')
      .insert(defaultedInspectionData)
      .select('*')
      .single();

    if (error) throw error;

    // If findings data is provided, create findings record
    if (findingsData && Object.keys(findingsData).length > 0) {
      // Default values for required fields in findings
      const defaultedFindingsData = {
        queen_sighted: false,
        brood_pattern: 1,
        honey_stores: 3,
        population_strength: 5,
        temperament: 3,
        diseases_sighted: false,
        ...findingsData,
        inspection_id: inspection.id,
        user_id: inspection.user_id,
      };

      const { error: findingsError } = await supabase
        .from('inspection_findings')
        .insert(defaultedFindingsData);

      if (findingsError) throw findingsError;
    }

    return inspection;
  } catch (error) {
    console.error('Error creating inspection:', error);
    throw error;
  }
};

/**
 * Update an existing inspection and optionally its findings
 * @param id - The inspection id
 * @param inspection - The updated inspection data
 * @param findings - Optional findings data to update or create
 * @returns The updated inspection
 */
export const updateInspection = async (
  id: string,
  inspection: Partial<Inspection>,
  findings?: Partial<InspectionFindings>
): Promise<Inspection> => {
  try {
    console.log('Updating inspection with data:', inspection);
    
    // Extract only valid database fields to prevent errors
    const {
      hive_id,
      inspection_date,
      weight,
      temperature,
      humidity, 
      weather_conditions,
      hive_strength,
      queen_seen,
      eggs_seen,
      larvae_seen,
      queen_cells_seen,
      disease_signs,
      disease_details,
      varroa_check,
      varroa_count,
      honey_stores,
      pollen_stores,
      added_supers,
      removed_supers,
      feed_added,
      feed_type,
      feed_amount,
      medications_added,
      medication_details,
      notes,
      images,
      user_id
    } = inspection;

    // Build a clean update object with only the fields that exist
    const updateObj: any = {};
    if (hive_id !== undefined) updateObj.hive_id = hive_id;
    if (inspection_date !== undefined) updateObj.inspection_date = inspection_date;
    if (weight !== undefined) updateObj.weight = weight;
    if (temperature !== undefined) updateObj.temperature = temperature;
    if (humidity !== undefined) updateObj.humidity = humidity;
    if (weather_conditions !== undefined) updateObj.weather_conditions = weather_conditions;
    if (hive_strength !== undefined) updateObj.hive_strength = hive_strength;
    if (queen_seen !== undefined) updateObj.queen_seen = queen_seen;
    if (eggs_seen !== undefined) updateObj.eggs_seen = eggs_seen;
    if (larvae_seen !== undefined) updateObj.larvae_seen = larvae_seen;
    if (queen_cells_seen !== undefined) updateObj.queen_cells_seen = queen_cells_seen;
    if (disease_signs !== undefined) updateObj.disease_signs = disease_signs;
    if (disease_details !== undefined) updateObj.disease_details = disease_details;
    if (varroa_check !== undefined) updateObj.varroa_check = varroa_check;
    if (varroa_count !== undefined) updateObj.varroa_count = varroa_count;
    if (honey_stores !== undefined) updateObj.honey_stores = honey_stores;
    if (pollen_stores !== undefined) updateObj.pollen_stores = pollen_stores;
    if (added_supers !== undefined) updateObj.added_supers = added_supers;
    if (removed_supers !== undefined) updateObj.removed_supers = removed_supers;
    if (feed_added !== undefined) updateObj.feed_added = feed_added;
    if (feed_type !== undefined) updateObj.feed_type = feed_type;
    if (feed_amount !== undefined) updateObj.feed_amount = feed_amount;
    if (medications_added !== undefined) updateObj.medications_added = medications_added;
    if (medication_details !== undefined) updateObj.medication_details = medication_details;
    if (notes !== undefined) updateObj.notes = notes;
    if (images !== undefined) updateObj.images = images;
    if (user_id !== undefined) updateObj.user_id = user_id;
    
    // Always update the timestamp
    updateObj.updated_at = new Date().toISOString();
    
    // Update the inspection
    const { data: updatedInspection, error } = await supabase
      .from('inspections')
      .update(updateObj)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating inspection:', error);
      throw error;
    }

    // If findings provided, update or create them
    if (findings) {
      console.log('Processing findings data:', findings);
      
      // Check if findings already exist
      const { data: existingFindings, error: findingsQueryError } = await supabase
        .from('inspection_findings')
        .select('id')
        .eq('inspection_id', id)
        .single();

      if (findingsQueryError && findingsQueryError.code !== 'PGRST116') {
        // If error other than 'not found', throw it
        console.error('Error checking existing findings:', findingsQueryError);
        throw findingsQueryError;
      }

      // Ensure required fields have values
      const completeFindings = {
        queen_sighted: findings.queen_sighted !== undefined ? findings.queen_sighted : false,
        brood_pattern: findings.brood_pattern || 1,
        honey_stores: findings.honey_stores || 3,
        population_strength: findings.population_strength || 5,
        temperament: findings.temperament || 3,
        diseases_sighted: findings.diseases_sighted !== undefined ? findings.diseases_sighted : false,
        varroa_count: findings.varroa_count,
        notes: findings.notes,
        user_id: findings.user_id
      };

      if (existingFindings) {
        // Update existing findings
        console.log('Updating existing findings:', existingFindings.id);
        const { error: findingsError } = await supabase
          .from('inspection_findings')
          .update({
            ...completeFindings,
            updated_at: new Date().toISOString(),
          })
          .eq('inspection_id', id);

        if (findingsError) {
          console.error('Error updating findings:', findingsError);
          throw findingsError;
        }
      } else {
        // Create new findings
        console.log('Creating new findings for inspection:', id);
        const { error: findingsError } = await supabase
          .from('inspection_findings')
          .insert({
            ...completeFindings,
            inspection_id: id,
          });

        if (findingsError) {
          console.error('Error creating findings:', findingsError);
          throw findingsError;
        }
      }
    }

    return updatedInspection;
  } catch (error) {
    console.error('Error updating inspection:', error);
    throw error;
  }
};

/**
 * Delete an inspection
 */
export const deleteInspection = async (inspectionId: string): Promise<void> => {
  try {
    // Delete the inspection findings first (due to foreign key constraints)
    const { error: findingsError } = await supabase
      .from('inspection_findings')
      .delete()
      .eq('inspection_id', inspectionId);

    if (findingsError) throw findingsError;

    // Then delete the inspection
    const { error: inspectionError } = await supabase
      .from('inspections')
      .delete()
      .eq('id', inspectionId);

    if (inspectionError) throw inspectionError;
  } catch (error) {
    console.error('Error deleting inspection:', error);
    throw error;
  }
}; 