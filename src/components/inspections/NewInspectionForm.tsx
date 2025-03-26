import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { CalendarIcon, Check, ChevronsUpDown, Plus, Loader2 } from 'lucide-react';
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
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from '@/components/ui/command';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { toast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { createInspection } from '@/services/inspectionService';

// Define the form validation schema
const inspectionFormSchema = z.object({
  hive_id: z.string({
    required_error: "Please select a hive.",
  }),
  inspection_date: z.date({
    required_error: "Please select a date.",
  }),
  weather_conditions: z.string().optional(),
  temperature: z.number().optional(),
  humidity: z.number().optional(),
  weight: z.number().optional(),
  hive_strength: z.number().min(0).max(10).optional(),
  queen_seen: z.boolean().default(false),
  eggs_seen: z.boolean().default(false),
  larvae_seen: z.boolean().default(false),
  queen_cells_seen: z.boolean().default(false),
  disease_signs: z.boolean().default(false),
  disease_details: z.string().optional(),
  varroa_check: z.boolean().default(false),
  varroa_count: z.number().optional(),
  honey_stores: z.number().min(0).max(5).optional(),
  pollen_stores: z.number().min(0).max(5).optional(),
  added_supers: z.number().min(0).optional(),
  removed_supers: z.number().min(0).optional(),
  feed_added: z.boolean().default(false),
  feed_type: z.string().optional(),
  feed_amount: z.string().optional(),
  medications_added: z.boolean().default(false),
  medication_details: z.string().optional(),
  notes: z.string().optional(),
});

type InspectionFormValues = z.infer<typeof inspectionFormSchema>;

// Default values for the form
const defaultValues: Partial<InspectionFormValues> = {
  inspection_date: new Date(),
  queen_seen: false,
  eggs_seen: false,
  larvae_seen: false,
  queen_cells_seen: false,
  disease_signs: false,
  varroa_check: false,
  feed_added: false,
  medications_added: false,
  hive_strength: 5,
  honey_stores: 3,
  pollen_stores: 3,
  added_supers: 0,
  removed_supers: 0,
};

interface NewInspectionFormProps {
  onInspectionAdded: () => void;
  onCancel: () => void;
  apiaries: Array<{ id: string; name: string }>;
  hives: Array<{ id: string; name: string; apiary_id: string }>;
}

const NewInspectionForm: React.FC<NewInspectionFormProps> = ({ 
  onInspectionAdded,
  onCancel,
  apiaries,
  hives
}) => {
  const [apiaryId, setApiaryId] = useState<string>('');
  const [filteredHives, setFilteredHives] = useState(hives);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<InspectionFormValues>({
    resolver: zodResolver(inspectionFormSchema),
    defaultValues,
  });
  
  // Filter hives when apiary selection changes
  useEffect(() => {
    if (apiaryId) {
      setFilteredHives(hives.filter(hive => hive.apiary_id === apiaryId));
    } else {
      setFilteredHives(hives);
    }
  }, [apiaryId, hives]);
  
  async function onSubmit(data: InspectionFormValues) {
    try {
      setIsSubmitting(true);
      
      // Format data according to DB schema
      const inspectionData = {
        hive_id: data.hive_id,
        inspection_date: format(data.inspection_date, "yyyy-MM-dd'T'HH:mm:ssXXX"),
        weather_conditions: data.weather_conditions,
        temperature: data.temperature,
        humidity: data.humidity,
        weight: data.weight,
        hive_strength: data.hive_strength,
        queen_seen: data.queen_seen,
        eggs_seen: data.eggs_seen,
        larvae_seen: data.larvae_seen,
        queen_cells_seen: data.queen_cells_seen,
        disease_signs: data.disease_signs,
        disease_details: data.disease_details,
        varroa_check: data.varroa_check,
        varroa_count: data.varroa_count,
        honey_stores: data.honey_stores,
        pollen_stores: data.pollen_stores,
        added_supers: data.added_supers,
        removed_supers: data.removed_supers,
        feed_added: data.feed_added,
        feed_type: data.feed_type,
        feed_amount: data.feed_amount,
        medications_added: data.medications_added,
        medication_details: data.medication_details,
        notes: data.notes,
      };
      
      // Prepare findings data (to be added to inspection_findings table)
      const findingsData = {
        queen_sighted: data.queen_seen,
        brood_pattern: data.larvae_seen ? 3 : 1, // Default value
        honey_stores: data.honey_stores || 3,
        population_strength: data.hive_strength || 5,
        temperament: 3, // Default value
        diseases_sighted: data.disease_signs,
        varroa_count: data.varroa_count,
        notes: data.notes,
      };
      
      // Save the inspection
      await createInspection(inspectionData, findingsData);
      
      toast({
        title: "Inspection created",
        description: "Your inspection has been recorded successfully.",
      });
      
      // Reset form and notify parent
      form.reset(defaultValues);
      onInspectionAdded();
    } catch (error) {
      console.error('Error creating inspection:', error);
      toast({
        title: "Error",
        description: "Failed to create inspection. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  }
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
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
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an apiary" />
              </SelectTrigger>
              <SelectContent>
                {apiaries.map((apiary) => (
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
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant="outline"
                        role="combobox"
                        className={cn(
                          "w-full justify-between",
                          !field.value && "text-muted-foreground"
                        )}
                        disabled={!apiaryId}
                      >
                        {field.value
                          ? filteredHives.find((hive) => hive.id === field.value)?.name
                          : "Select a hive"}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </FormControl>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0">
                    <Command>
                      <CommandInput placeholder="Search hives..." />
                      <CommandEmpty>No hives found.</CommandEmpty>
                      <CommandGroup>
                        {filteredHives.map((hive) => (
                          <CommandItem
                            key={hive.id}
                            value={hive.id}
                            onSelect={() => {
                              form.setValue("hive_id", hive.id);
                            }}
                          >
                            <Check
                              className={cn(
                                "mr-2 h-4 w-4",
                                hive.id === field.value
                                  ? "opacity-100"
                                  : "opacity-0"
                              )}
                            />
                            {hive.name}
                          </CommandItem>
                        ))}
                      </CommandGroup>
                    </Command>
                  </PopoverContent>
                </Popover>
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
                <FormLabel>Date</FormLabel>
                <Popover>
                  <PopoverTrigger asChild>
                    <FormControl>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "pl-3 text-left font-normal",
                          !field.value && "text-muted-foreground"
                        )}
                      >
                        {field.value ? (
                          format(field.value, "PPP")
                        ) : (
                          <span>Pick a date</span>
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
                      disabled={(date) =>
                        date > new Date() || date < new Date("1900-01-01")
                      }
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <Separator />
        
        {/* Environmental Conditions */}
        <div>
          <h3 className="text-lg font-medium mb-4">Environmental Conditions</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="weather_conditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Weather Conditions</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Sunny, Cloudy, Rainy" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="temperature"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temperature (°C)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="°C" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="humidity"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Humidity (%)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="%" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="weight"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hive Weight (kg)</FormLabel>
                  <FormControl>
                    <Input 
                      type="number" 
                      placeholder="kg" 
                      {...field}
                      onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>
        
        <Separator />
        
        {/* Colony Status */}
        <div>
          <h3 className="text-lg font-medium mb-4">Colony Status</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="queen_seen"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Queen Sighted</FormLabel>
                      <FormDescription>
                        Was the queen observed during inspection?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="eggs_seen"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Eggs Present</FormLabel>
                      <FormDescription>
                        Were eggs observed in the cells?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="larvae_seen"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Larvae Present</FormLabel>
                      <FormDescription>
                        Were larvae observed in the cells?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="queen_cells_seen"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Queen Cells</FormLabel>
                      <FormDescription>
                        Were queen cells observed?
                      </FormDescription>
                    </div>
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="hive_strength"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hive Strength (1-10)</FormLabel>
                  <FormControl>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-xs">Weak</span>
                        <span className="text-xs font-medium">{field.value || 5}</span>
                        <span className="text-xs">Strong</span>
                      </div>
                      <Slider
                        value={field.value !== undefined ? [field.value] : [5]}
                        min={1}
                        max={10}
                        step={1}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    Rate the overall strength of the colony
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="disease_signs"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Disease Signs</FormLabel>
                    <FormDescription>
                      Were there any signs of disease or pests?
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {form.watch('disease_signs') && (
              <FormField
                control={form.control}
                name="disease_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Disease Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the signs of disease or pests observed..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Resources */}
        <div>
          <h3 className="text-lg font-medium mb-4">Resources</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="honey_stores"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Honey Stores (1-5)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs">Low</span>
                          <span className="text-xs font-medium">{field.value || 3}</span>
                          <span className="text-xs">High</span>
                        </div>
                        <Slider
                          value={field.value !== undefined ? [field.value] : [3]}
                          min={1}
                          max={5}
                          step={1}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Rate the amount of honey stores observed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="pollen_stores"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Pollen Stores (1-5)</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-xs">Low</span>
                          <span className="text-xs font-medium">{field.value || 3}</span>
                          <span className="text-xs">High</span>
                        </div>
                        <Slider
                          value={field.value !== undefined ? [field.value] : [3]}
                          min={1}
                          max={5}
                          step={1}
                          onValueChange={(vals) => field.onChange(vals[0])}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      Rate the amount of pollen stores observed
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="added_supers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Added Supers</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="removed_supers"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Removed Supers</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : 0)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>
        </div>
        
        <Separator />
        
        {/* Feeding & Medications */}
        <div>
          <h3 className="text-lg font-medium mb-4">Feeding & Medications</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="feed_added"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Feed Added</FormLabel>
                    <FormDescription>
                      Was any feed provided during this inspection?
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {form.watch('feed_added') && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 ml-7">
                <FormField
                  control={form.control}
                  name="feed_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feed Type</FormLabel>
                      <Select
                        value={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select feed type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sugar_syrup">Sugar Syrup</SelectItem>
                          <SelectItem value="honey">Honey</SelectItem>
                          <SelectItem value="pollen_patty">Pollen Patty</SelectItem>
                          <SelectItem value="candy_board">Candy Board</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="feed_amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Feed Amount</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 2 liters, 1 kg" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}
            
            <FormField
              control={form.control}
              name="medications_added"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Medications Added</FormLabel>
                    <FormDescription>
                      Were any treatments or medications applied?
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {form.watch('medications_added') && (
              <FormField
                control={form.control}
                name="medication_details"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Medication Details</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Describe the medications/treatments applied..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Varroa Check */}
        <div>
          <h3 className="text-lg font-medium mb-4">Varroa Check</h3>
          <div className="space-y-4">
            <FormField
              control={form.control}
              name="varroa_check"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Varroa Check Performed</FormLabel>
                    <FormDescription>
                      Was a varroa mite check performed during this inspection?
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
            
            {form.watch('varroa_check') && (
              <FormField
                control={form.control}
                name="varroa_count"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Varroa Count</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        min="0"
                        placeholder="Number of mites counted"
                        {...field}
                        onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormDescription>
                      Count of varroa mites found during the check
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          </div>
        </div>
        
        <Separator />
        
        {/* Notes */}
        <div>
          <FormField
            control={form.control}
            name="notes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Notes</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Additional observations or notes about the inspection..."
                    className="min-h-[100px]"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Plus className="mr-2 h-4 w-4" />
                Create Inspection
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default NewInspectionForm; 