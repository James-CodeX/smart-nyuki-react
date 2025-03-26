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
    const { data: inspections, error } = await supabase
      .from('inspections')
      .select(`
        *,
        hives (
          id,
          name,
          apiary_id,
          apiaries (
            id,
            name
          )
        )
      `)
      .order('inspection_date', { ascending: false });

    if (error) {
      throw error;
    }

    if (!inspections?.length) {
      return [];
    }

    // Transform the data to match our interface
    const transformedInspections = inspections.map(inspection => ({
      ...inspection,
      hive_name: inspection.hives?.name || 'Unknown',
      apiary_id: inspection.hives?.apiary_id || '',
      apiary_name: inspection.hives?.apiaries?.name || 'Unknown',
    }));

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
    const { data: inspections, error } = await supabase
      .from('inspections')
      .select(`
        *,
        hives (
          id,
          name,
          apiary_id,
          apiaries (
            id,
            name
          )
        )
      `)
      .eq('hives.apiary_id', apiaryId)
      .order('inspection_date', { ascending: false });

    if (error) {
      throw error;
    }

    if (!inspections?.length) {
      return [];
    }

    // Transform the data to match our interface
    const transformedInspections = inspections.map(inspection => ({
      ...inspection,
      hive_name: inspection.hives?.name || 'Unknown',
      apiary_id: inspection.hives?.apiary_id || '',
      apiary_name: inspection.hives?.apiaries?.name || 'Unknown',
    }));

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
    const { data: inspection, error } = await supabase
      .from('inspections')
      .select(`
        *,
        hives (
          id,
          name,
          apiary_id,
          apiaries (
            id,
            name
          )
        )
      `)
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

    // Transform the data to match our interface
    const transformedInspection = {
      ...inspection,
      hive_name: inspection.hives?.name || 'Unknown',
      apiary_id: inspection.hives?.apiary_id || '',
      apiary_name: inspection.hives?.apiaries?.name || 'Unknown',
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
 * Create a new inspection
 */
export const createInspection = async (
  inspectionData: Omit<Inspection, 'id' | 'created_at' | 'updated_at'>,
  findingsData?: Omit<InspectionFindings, 'id' | 'created_at' | 'updated_at' | 'inspection_id'>
): Promise<Inspection> => {
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    if (!user) throw new Error('User not authenticated');

    // Start a transaction by using a single query connection
    const { data: newInspection, error: inspectionError } = await supabase
      .from('inspections')
      .insert({ ...inspectionData, user_id: user.id })
      .select()
      .single();

    if (inspectionError) throw inspectionError;

    // If we have findings data, insert it
    if (findingsData && newInspection) {
      const { error: findingsError } = await supabase
        .from('inspection_findings')
        .insert({
          ...findingsData,
          inspection_id: newInspection.id,
          user_id: user.id
        });

      if (findingsError) throw findingsError;
    }

    return newInspection;
  } catch (error) {
    console.error('Error creating inspection:', error);
    throw error;
  }
};

/**
 * Update an existing inspection
 */
export const updateInspection = async (
  inspectionId: string,
  inspectionData: Partial<Omit<Inspection, 'id' | 'created_at' | 'updated_at' | 'user_id'>>,
  findingsData?: Partial<Omit<InspectionFindings, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'inspection_id'>>
): Promise<Inspection> => {
  try {
    // Update the inspection
    const { data: updatedInspection, error: inspectionError } = await supabase
      .from('inspections')
      .update(inspectionData)
      .eq('id', inspectionId)
      .select()
      .single();

    if (inspectionError) throw inspectionError;

    // If we have findings data, update or insert it
    if (findingsData) {
      // Check if findings already exist
      const { data: existingFindings, error: findingsCheckError } = await supabase
        .from('inspection_findings')
        .select('id')
        .eq('inspection_id', inspectionId)
        .maybeSingle();

      if (findingsCheckError) throw findingsCheckError;

      if (existingFindings) {
        // Update existing findings
        const { error: updateFindingsError } = await supabase
          .from('inspection_findings')
          .update(findingsData)
          .eq('id', existingFindings.id);

        if (updateFindingsError) throw updateFindingsError;
      } else {
        // Get current user
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        if (userError) throw userError;
        if (!user) throw new Error('User not authenticated');

        // Insert new findings
        const { error: insertFindingsError } = await supabase
          .from('inspection_findings')
          .insert({
            ...findingsData,
            inspection_id: inspectionId,
            user_id: user.id
          });

        if (insertFindingsError) throw insertFindingsError;
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