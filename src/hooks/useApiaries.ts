import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Apiary {
  id: string;
  name: string;
  location: string;
  description?: string;
  created_at: string;
  user_id: string;
}

export interface ApiaryCreateInput {
  name: string;
  location: string;
  description?: string;
}

export const useApiaries = () => {
  const queryClient = useQueryClient();

  const fetchApiaries = async (): Promise<Apiary[]> => {
    const { data, error } = await supabase
      .from('apiaries')
      .select('*')
      .order('name');

    if (error) {
      throw new Error(error.message);
    }

    return data || [];
  };

  const createApiary = async (apiary: ApiaryCreateInput): Promise<Apiary> => {
    const { data, error } = await supabase
      .from('apiaries')
      .insert([apiary])
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const updateApiary = async (id: string, updates: Partial<ApiaryCreateInput>): Promise<Apiary> => {
    const { data, error } = await supabase
      .from('apiaries')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(error.message);
    }

    return data;
  };

  const deleteApiary = async (id: string): Promise<void> => {
    const { error } = await supabase
      .from('apiaries')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(error.message);
    }
  };

  const apiariesQuery = useQuery<Apiary[], Error>({
    queryKey: ['apiaries'],
    queryFn: fetchApiaries,
  });

  const createApiaryMutation = useMutation({
    mutationFn: createApiary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiaries'] });
      toast.success('Apiary created successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to create apiary: ${error.message}`);
    },
  });

  const updateApiaryMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: Partial<ApiaryCreateInput> }) => 
      updateApiary(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiaries'] });
      toast.success('Apiary updated successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to update apiary: ${error.message}`);
    },
  });

  const deleteApiaryMutation = useMutation({
    mutationFn: deleteApiary,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['apiaries'] });
      toast.success('Apiary deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(`Failed to delete apiary: ${error.message}`);
    },
  });

  return {
    ...apiariesQuery,
    createApiary: createApiaryMutation.mutate,
    updateApiary: updateApiaryMutation.mutate,
    deleteApiary: deleteApiaryMutation.mutate,
    isCreating: createApiaryMutation.isPending,
    isUpdating: updateApiaryMutation.isPending,
    isDeleting: deleteApiaryMutation.isPending,
  };
}; 