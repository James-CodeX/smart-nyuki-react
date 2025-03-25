import React, { useState } from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useApiaries } from '@/hooks/useApiaries';
import { useHives } from '@/hooks/useHives';

// Define form schema with Zod
const hiveFormSchema = z.object({
  name: z.string().min(1, { message: 'Hive name is required' }),
  apiaryId: z.string().min(1, { message: 'Apiary is required' }),
  hiveId: z.string().min(1, { message: 'Hive ID is required' })
    .refine(id => /^[a-zA-Z0-9-]+$/.test(id), {
      message: 'Hive ID must contain only letters, numbers, and hyphens',
    }),
  type: z.string().min(1, { message: 'Hive type is required' }),
  description: z.string().optional(),
});

type HiveFormValues = z.infer<typeof hiveFormSchema>;

interface AddHiveModalProps {
  trigger?: React.ReactNode;
  onHiveAdded?: () => void;
}

const hiveTypes = [
  'Langstroth',
  'Top Bar',
  'Warre',
  'Flow Hive',
  'Layens',
  'Other',
];

const AddHiveModal: React.FC<AddHiveModalProps> = ({ 
  trigger,
  onHiveAdded 
}) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { data: apiaries = [] } = useApiaries();
  const { addHive } = useHives();

  const form = useForm<HiveFormValues>({
    resolver: zodResolver(hiveFormSchema),
    defaultValues: {
      name: '',
      apiaryId: '',
      hiveId: '',
      type: '',
      description: '',
    },
  });

  // Function to check if hive ID exists in metrics_time_series_data
  const validateHiveId = async (hiveId: string) => {
    try {
      // First check if this hive ID is already registered to a user
      const { data: existingHive, error: existingError } = await supabase
        .from('hives')
        .select('id')
        .eq('hive_id', hiveId)
        .single();

      if (existingHive) {
        return { valid: false, message: 'This hive ID is already registered by another user' };
      }

      // Then check if the hive ID exists in the metrics table
      const { data, error } = await supabase
        .from('metrics_time_series_data')
        .select('id')
        .eq('hive_id', hiveId)
        .limit(1);

      if (error) throw error;

      if (!data || data.length === 0) {
        return { valid: false, message: 'Hive ID not found in our system. Please check the ID and try again.' };
      }

      return { valid: true };
    } catch (error) {
      console.error("Error validating hive ID:", error);
      return { valid: false, message: 'Error validating hive ID. Please try again.' };
    }
  };

  const onSubmit = async (values: HiveFormValues) => {
    setIsSubmitting(true);
    try {
      // Validate the hive ID against the metrics table
      const validationResult = await validateHiveId(values.hiveId);
      
      if (!validationResult.valid) {
        toast.error(validationResult.message);
        setIsSubmitting(false);
        return;
      }
      
      // Add the hive if validation passes
      await addHive({
        name: values.name,
        apiary_id: values.apiaryId,
        hive_id: values.hiveId,
        type: values.type,
        description: values.description || '',
        status: 'Active',
      });
      
      toast.success('Hive added successfully!');
      form.reset();
      setOpen(false);
      if (onHiveAdded) onHiveAdded();
    } catch (error) {
      console.error("Error adding hive:", error);
      toast.error('Failed to add hive. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {trigger ? (
        <DialogTrigger asChild>
          {trigger}
        </DialogTrigger>
      ) : (
        <DialogTrigger asChild>
          <Button>Add Hive</Button>
        </DialogTrigger>
      )}
      
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add New Hive</DialogTitle>
          <DialogDescription>
            Enter the details for your new hive. The Hive ID must match an existing hardware ID in our system.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hive Name</FormLabel>
                  <FormControl>
                    <Input placeholder="My Hive" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="hiveId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hive ID</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter hardware ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="apiaryId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Apiary</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select an apiary" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {apiaries.map((apiary) => (
                        <SelectItem key={apiary.id} value={apiary.id}>
                          {apiary.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hive Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hive type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hiveTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Details about your hive" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Adding...' : 'Add Hive'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AddHiveModal; 