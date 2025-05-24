import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Loader2, ClipboardList } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { supabase } from '@/lib/supabase';

import { createInspection } from '@/services/inspectionService';

// Define the simplified form validation schema - only the essential fields
const inspectionFormSchema = z.object({
  hive_id: z.string({
    required_error: "Please select a hive.",
  }),
  inspection_date: z.date({
    required_error: "Please select a date.",
  }),
  notes: z.string().optional(),
});

type InspectionFormValues = z.infer<typeof inspectionFormSchema>;

// Default values for the form
const defaultValues: Partial<InspectionFormValues> = {
  inspection_date: new Date(),
};

interface NewInspectionFormProps {
  onInspectionAdded?: () => void;
  onSuccess?: () => void;
  onCancel: () => void;
  apiaries?: Array<{ id: string; name: string }>;
  hives?: Array<{ id: string; name: string; apiary_id: string }>;
  initialDate?: Date;
  preselectedHiveId?: string;
  preselectedApiaryId?: string;
}

const NewInspectionForm: React.FC<NewInspectionFormProps> = ({ 
  onInspectionAdded,
  onSuccess,
  onCancel,
  apiaries = [],
  hives = [],
  initialDate,
  preselectedHiveId,
  preselectedApiaryId
}) => {
  // Debug logs for props
  console.log("NewInspectionForm props:", { 
    apiaries, 
    hives, 
    preselectedHiveId, 
    preselectedApiaryId 
  });
  
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [apiaryId, setApiaryId] = useState<string>(preselectedApiaryId || '');
  const [filteredHives, setFilteredHives] = useState<any[]>(hives);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadedApiaries, setLoadedApiaries] = useState<Array<{ id: string; name: string }>>(apiaries);
  const [loadedHives, setLoadedHives] = useState<any[]>(hives);
  
  // Set initial values, using initialDate if provided
  const initialValues = {
    ...defaultValues,
    inspection_date: initialDate || new Date(),
    hive_id: preselectedHiveId || '',
  };
  
  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues: initialValues,
  });

  // Load apiaries and hives if they weren't provided
  useEffect(() => {
    const fetchData = async () => {
      if (apiaries.length === 0 || hives.length === 0) {
        setIsLoadingData(true);
        try {
          // Import dynamically to avoid circular dependencies
          const { getAllApiaries } = await import('@/services/apiaryService');
          const { getAllHives } = await import('@/services/hiveService');
          
          const apiaryData = await getAllApiaries();
          setLoadedApiaries(Array.isArray(apiaryData.data) ? apiaryData.data : []);
          
          const hiveData = await getAllHives();
          setLoadedHives(Array.isArray(hiveData.data) ? hiveData.data : []);
          
          // If we have a preselected apiary, filter hives
          if (preselectedApiaryId) {
            setFilteredHives(
              Array.isArray(hiveData.data) 
                ? hiveData.data.filter(hive => hive.apiary_id === preselectedApiaryId)
                : []
            );
          } else {
            setFilteredHives(Array.isArray(hiveData.data) ? hiveData.data : []);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          toast({
            title: "Error",
            description: "Failed to load apiaries and hives.",
            variant: "destructive",
          });
        } finally {
          setIsLoadingData(false);
        }
      }
    };
    
    fetchData();
  }, [apiaries, hives, preselectedApiaryId]);
  
  // Filter hives when apiary selection changes
  useEffect(() => {
    console.log("Apiary selected:", apiaryId);
    const hivesToFilter = loadedHives.length > 0 ? loadedHives : hives;
    console.log("Available hives to filter:", hivesToFilter);
    
    if (apiaryId && hivesToFilter.length > 0) {
      // Debug each hive to see what's there
      hivesToFilter.forEach(hive => {
        console.log("Checking hive:", hive, "apiary_id:", hive.apiary_id, "against selected:", apiaryId);
      });
      
      const filtered = hivesToFilter.filter(hive => hive.apiary_id === apiaryId);
      console.log("Filtered hives for apiary:", filtered);
      setFilteredHives(filtered);
    } else {
      console.log("No apiary selected or no hives, showing all hives");
      setFilteredHives(hivesToFilter);
    }
  }, [apiaryId, hives, loadedHives]);
  
  async function onSubmit(data: InspectionFormValues) {
    try {
      setIsSubmitting(true);
      
      // Get current user
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('Error getting user:', userError);
        throw new Error('Failed to authenticate user');
      }
      if (!user) {
        throw new Error('User not authenticated');
      }
      
      // Format data according to DB schema - only sending essential fields
      // All boolean fields have default values in the service
      const inspectionData = {
        hive_id: data.hive_id,
        inspection_date: format(data.inspection_date, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        notes: data.notes,
        user_id: user.id,
        // Set defaults for required fields
        queen_seen: false,
        eggs_seen: false,
        larvae_seen: false,
        queen_cells_seen: false,
        disease_signs: false,
        varroa_check: false,
        feed_added: false,
        medications_added: false
      };
      
      // Create inspection with minimal data
      await createInspection(inspectionData);
      
      toast({
        title: "Inspection scheduled",
        description: "Your inspection has been scheduled successfully. You can add findings after completing the inspection.",
      });
      
      // Reset form and notify parent
      form.reset(defaultValues);
      
      // Call the success callback
      if (onSuccess) {
        onSuccess();
      } else if (onInspectionAdded) {
        // For backward compatibility
        onInspectionAdded();
      }
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      toast({
        title: "Error",
        description: "Failed to schedule inspection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  // Display loading state
  if (isLoadingData) {
    return (
      <div className="flex justify-center items-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }
  
  // Ensure filteredHives is always an array
  const hivesToDisplay = Array.isArray(filteredHives) ? filteredHives : [];
  console.log("HivesToDisplay when rendering:", hivesToDisplay);
  const displayApiaries = loadedApiaries.length > 0 ? loadedApiaries : apiaries;
  console.log("DisplayApiaries when rendering:", displayApiaries);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="bg-muted/30">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
              <ClipboardList className="h-4 w-4" />
              <p>Only basic information is required to schedule an inspection. You'll add findings after completing it.</p>
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          {/* Apiary Selection */}
          <FormItem>
            <FormLabel>Apiary</FormLabel>
            <Select
              value={apiaryId}
              onValueChange={(value) => {
                setApiaryId(value);
                // Reset hive selection when apiary changes
                form.setValue('hive_id', '');
              }}
              defaultValue={preselectedApiaryId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an apiary" />
              </SelectTrigger>
              <SelectContent>
                {displayApiaries.map((apiary) => (
                  <SelectItem key={apiary.id} value={apiary.id}>
                    {apiary.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </FormItem>
          
          {/* Hive Selection */}
          <FormField
            control={form.control}
            name="hive_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Hive</FormLabel>
                <Select
                  value={field.value}
                  onValueChange={(value) => {
                    field.onChange(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a hive" />
                  </SelectTrigger>
                  <SelectContent>
                    {hivesToDisplay.length > 0 ? (
                      hivesToDisplay.map((hive) => (
                        <SelectItem key={hive.hive_id || hive.id} value={hive.hive_id || hive.id}>
                          {hive.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem key="no-hives" value="none" disabled>No hives available</SelectItem>
                    )}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          
          {/* Inspection Date */}
          <FormField
            control={form.control}
            name="inspection_date"
            render={({ field }) => (
              <FormItem className="flex flex-col">
                <FormLabel>Inspection Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Select a date</span>
                        )}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value}
                      onSelect={field.onChange}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormDescription>
                  When do you plan to perform this inspection?
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Separator />
        
        {/* Notes (Optional) */}
        <div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes (Optional)</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Add any preparation notes or reminders for this inspection..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  You'll be able to add detailed findings after completing the inspection.
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-between gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <CalendarIcon className="mr-2 h-4 w-4" />
                Schedule Inspection
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NewInspectionForm; 