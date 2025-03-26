import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { HiveWithDetails, HiveWithFullDetails, fetchHiveDetails } from '@/services/hiveService';

export interface HiveCreateInput {
  name: string;
  apiary_id: string;
  hive_id: string;
  type: string;
  status: string;
  installation_date?: string;
  queen_type?: string;
  queen_introduced_date?: string;
  queen_marked?: boolean;
  queen_marking_color?: string;
  notes?: string;
  alerts_enabled?: boolean;
  description?: string;
}

type ApiaryWithName = {
  name: string;
};

export const useHives = () => {
  const queryClient = useQueryClient();

  const fetchHives = async (): Promise<HiveWithFullDetails[]> => {
    try {
      // Fetch basic hive data
      const { data: hives, error } = await supabase
        .from('hives')
        .select(`
          hive_id,
          name,
          type,
          status,
          apiary_id,
          created_at,
          updated_at,
          user_id,
          apiaries(name)
        `)
        .order('name');

      if (error) {
        console.error("Error fetching hives:", error);
        throw new Error(`Failed to fetch hives: ${error.message}`);
      }

      if (!hives || hives.length === 0) {
        console.log("No hives found");
        return [];
      }

      console.log("Hives fetched successfully:", hives.length);

      // For each hive, fetch its detailed metrics
      const hivesWithDetails = await Promise.all(
        hives.map(async (hive) => {
          try {
            const details = await fetchHiveDetails(hive.hive_id);
            
            // Convert metrics from timestamp to time format
            const convertedMetrics = {
              temperature: details.metrics.temperature.map(item => ({ 
                time: item.timestamp, 
                value: item.value 
              })),
              humidity: details.metrics.humidity.map(item => ({ 
                time: item.timestamp, 
                value: item.value 
              })),
              weight: details.metrics.weight.map(item => ({ 
                time: item.timestamp, 
                value: item.value 
              })),
              sound: details.metrics.sound.map(item => ({ 
                time: item.timestamp, 
                value: item.value 
              }))
            };
            
            // Convert alerts from timestamp to created_at format
            const convertedAlerts = details.alerts.map(alert => ({
              id: alert.id,
              type: alert.type,
              message: alert.message,
              severity: alert.severity,
              created_at: alert.timestamp
            }));
            
            // Get name from apiaries object
            const apiaryData = hive.apiaries as unknown as ApiaryWithName;
            const apiaryName = apiaryData?.name || 'Unknown';
            
            return {
              name: hive.name,
              hive_id: hive.hive_id,
              apiary_id: hive.apiary_id,
              type: hive.type,
              status: hive.status,
              description: '',  // Add empty string since the description doesn't exist in DB
              user_id: hive.user_id,
              created_at: hive.created_at,
              updated_at: hive.updated_at,
              apiaryName: apiaryName,
              metrics: convertedMetrics,
              alerts: convertedAlerts
            } as unknown as HiveWithFullDetails;
          } catch (err) {
            console.error(`Error fetching details for hive ${hive.hive_id}:`, err);
            
            // Get name from apiaries object
            const apiaryData = hive.apiaries as unknown as ApiaryWithName;
            const apiaryName = apiaryData?.name || 'Unknown';
            
            return {
              name: hive.name,
              hive_id: hive.hive_id,
              apiary_id: hive.apiary_id,
              type: hive.type,
              status: hive.status,
              description: '',  // Add empty string since the description doesn't exist in DB
              user_id: hive.user_id,
              created_at: hive.created_at,
              updated_at: hive.updated_at,
              apiaryName: apiaryName,
              metrics: {
                temperature: [],
                humidity: [],
                weight: [],
                sound: []
              },
              alerts: []
            } as unknown as HiveWithFullDetails;
          }
        })
      );

      return hivesWithDetails;
    } catch (err) {
      console.error("Error in fetchHives:", err);
      throw err;
    }
  };

  const addHive = async (hive: HiveCreateInput): Promise<HiveWithFullDetails> => {
    // Create a new object without the description field if it's not in the DB
    const { description, ...hiveData } = hive;
    
    // Get the current authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError) throw new Error(authError.message);
    if (!user) throw new Error('User not authenticated');
    
    const { data, error } = await supabase
      .from('hives')
      .insert([{
        ...hiveData,
        user_id: user.id  // Set the user_id to the current authenticated user
      }])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Fetch the apiary name for the new hive
    const { data: apiary, error: apiaryError } = await supabase
      .from('apiaries')
      .select('name')
      .eq('id', hive.apiary_id)
      .single();

    if (apiaryError) {
      console.error("Error fetching apiary name:", apiaryError);
    }

    return {
      ...data,
      hive_id: data.hive_id,
      apiaryName: apiary?.name || 'Unknown',
      description: description || '', // Add the description from the input or empty string
      metrics: {
        temperature: [],
        humidity: [],
        weight: [],
        sound: []
      },
      alerts: []
    } as unknown as HiveWithFullDetails;
  };

  const updateHive = async (id: string, updates: Partial<HiveCreateInput>): Promise<HiveWithFullDetails> => {
    // Create a new object without the description field if it's not in the DB
    const { description, ...updateData } = updates;
    
    const { data, error } = await supabase
      .from('hives')
      .update(updateData)
      .eq('hive_id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    // Fetch the apiary name for the updated hive
    const { data: apiary, error: apiaryError } = await supabase
      .from('apiaries')
      .select('name')
      .eq('id', data.apiary_id)
      .single();

    if (apiaryError) {
      console.error("Error fetching apiary name:", apiaryError);
    }

    // Fetch the detailed metrics
    try {
      const details = await fetchHiveDetails(id);
      
      // Convert metrics from timestamp to time format
      const convertedMetrics = {
        temperature: details.metrics.temperature.map(item => ({ 
          time: item.timestamp, 
          value: item.value 
        })),
        humidity: details.metrics.humidity.map(item => ({ 
          time: item.timestamp, 
          value: item.value 
        })),
        weight: details.metrics.weight.map(item => ({ 
          time: item.timestamp, 
          value: item.value 
        })),
        sound: details.metrics.sound.map(item => ({ 
          time: item.timestamp, 
          value: item.value 
        }))
      };
      
      // Convert alerts from timestamp to created_at format
      const convertedAlerts = details.alerts.map(alert => ({
        id: alert.id,
        type: alert.type,
        message: alert.message,
        severity: alert.severity,
        created_at: alert.timestamp
      }));
      
      return {
        ...data,
        hive_id: data.hive_id,
        apiaryName: apiary?.name || 'Unknown',
        description: description || '',
        metrics: convertedMetrics,
        alerts: convertedAlerts
      } as unknown as HiveWithFullDetails;
    } catch (error) {
      console.error('Error fetching hive details:', error);
      
      return {
        ...data,
        hive_id: data.hive_id,
        apiaryName: apiary?.name || 'Unknown',
        description: description || '',
        metrics: {
          temperature: [],
          humidity: [],
          weight: [],
          sound: []
        },
        alerts: []
      } as unknown as HiveWithFullDetails;
    }
  };

  const deleteHive = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('hives')
      .delete()
      .eq('hive_id', id);

    if (error) {
      throw new Error(error.message);
    }
  };

  const hivesQuery = useQuery<HiveWithFullDetails[], Error>({
    queryKey: ['hives'],
    queryFn: fetchHives,
  });

  const addHiveMutation = useMutation({
    mutationFn: addHive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hives'] });
      toast.success('Hive added successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to add hive: ${error.message}`);
    },
  });

  const updateHiveMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<HiveCreateInput> }) => 
      updateHive(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hives'] });
      toast.success('Hive updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update hive: ${error.message}`);
    },
  });

  const deleteHiveMutation = useMutation({
    mutationFn: deleteHive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hives'] });
      toast.success('Hive deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete hive: ${error.message}`);
    },
  });

  return {
    ...hivesQuery,
    addHive: addHiveMutation.mutate,
    updateHive: updateHiveMutation.mutate,
    deleteHive: deleteHiveMutation.mutate,
    isAdding: addHiveMutation.isPending,
    isUpdating: updateHiveMutation.isPending,
    isDeleting: deleteHiveMutation.isPending,
  };
}; 