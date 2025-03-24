import React from 'react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import { CalendarIcon, X } from 'lucide-react';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Slider } from '@/components/ui/slider';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
} from '@/components/ui/dialog';

import { getAllApiaries, getAllHives, addInspection } from '@/utils/mockData';

const formSchema = z.object({
  apiaryId: z.string({
    required_error: "Please select an apiary",
  }),
  hiveId: z.string({
    required_error: "Please select a hive",
  }),
  date: z.date({
    required_error: "Please select a date",
  }),
  type: z.enum(['regular', 'health-check', 'winter-prep', 'varroa-check', 'disease-treatment', 'harvest-evaluation'], {
    required_error: "Please select an inspection type",
  }),
  status: z.enum(['scheduled', 'completed'], {
    required_error: "Please select a status",
  }),
  notes: z.string().optional(),
  findings: z.object({
    queenSighted: z.boolean().default(false),
    broodPattern: z.number().min(0).max(5).default(0),
    honeyStores: z.number().min(0).max(5).default(0),
    diseasesSighted: z.boolean().default(false),
    varroaCount: z.number().min(0).max(100).optional(),
    temperament: z.number().min(0).max(5).default(0),
    populationStrength: z.number().min(0).max(5).default(0),
  }).optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface NewInspectionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  preSelectedApiaryId?: string;
  preSelectedHiveId?: string;
}

const NewInspectionForm: React.FC<NewInspectionFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  preSelectedApiaryId,
  preSelectedHiveId,
}) => {
  const apiaries = getAllApiaries();
  const allHives = getAllHives();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      apiaryId: preSelectedApiaryId || "",
      hiveId: preSelectedHiveId || "",
      status: 'scheduled',
      type: 'regular',
      notes: "",
      findings: {
        queenSighted: false,
        broodPattern: 0,
        honeyStores: 0,
        diseasesSighted: false,
        varroaCount: 0,
        temperament: 0,
        populationStrength: 0,
      },
    },
  });

  const selectedApiaryId = form.watch('apiaryId');
  const status = form.watch('status');
  
  // Filter hives based on selected apiary
  const apiaryHives = selectedApiaryId
    ? allHives.filter(hive => hive.apiaryId === selectedApiaryId)
    : [];

  const onSubmit = (data: FormValues) => {
    // For completed inspections, ensure findings are included
    const inspection = {
      apiaryId: data.apiaryId,
      hiveId: data.hiveId,
      date: data.date.toISOString(),
      type: data.type,
      status: data.status,
      notes: data.notes,
      findings: data.status === 'completed' 
        ? {
            queenSighted: data.findings.queenSighted || false,
            broodPattern: data.findings.broodPattern || 0,
            honeyStores: data.findings.honeyStores || 0,
            diseasesSighted: data.findings.diseasesSighted || false,
            temperament: data.findings.temperament || 0,
            populationStrength: data.findings.populationStrength || 0,
            varroaCount: data.findings.varroaCount
          }
        : undefined,
      createdBy: 'John Beekeeper'
    };
    
    addInspection(inspection);
    
    onClose();
    if (onSuccess) onSuccess();
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {status === 'scheduled' ? 'Schedule New Inspection' : 'Record Inspection'}
          </DialogTitle>
          <DialogDescription>
            {status === 'scheduled'
              ? 'Plan and schedule your next hive inspection'
              : 'Record the findings of a completed inspection'}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 space-y-4">
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem className="space-y-1">
                      <FormLabel>Inspection Status</FormLabel>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                          className="flex"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="scheduled" id="scheduled" />
                            <Label htmlFor="scheduled">Schedule for Later</Label>
                          </div>
                          <div className="flex items-center space-x-2 ml-4">
                            <RadioGroupItem value="completed" id="completed" />
                            <Label htmlFor="completed">Completed</Label>
                          </div>
                        </RadioGroup>
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
                            <SelectValue placeholder="Select apiary" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {apiaries.map(apiary => (
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
                  name="hiveId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hive</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                        disabled={!selectedApiaryId}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={selectedApiaryId ? "Select hive" : "Select an apiary first"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {apiaryHives.map(hive => (
                            <SelectItem key={hive.id} value={hive.id}>
                              {hive.name}
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
                  name="date"
                  render={({ field }) => (
                    <FormItem className="flex flex-col">
                      <FormLabel>Date</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "w-full pl-3 text-left font-normal",
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
                            disabled={(date) => {
                              // Only allow past dates for completed inspections
                              // and future dates for scheduled ones
                              if (status === 'completed') {
                                return date > new Date();
                              }
                              return false;
                            }}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Inspection Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select inspection type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="regular">Routine Check</SelectItem>
                          <SelectItem value="health-check">Health Check</SelectItem>
                          <SelectItem value="winter-prep">Winter Preparation</SelectItem>
                          <SelectItem value="varroa-check">Varroa Check</SelectItem>
                          <SelectItem value="disease-treatment">Disease Treatment</SelectItem>
                          <SelectItem value="harvest-evaluation">Harvest Evaluation</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Add inspection notes here"
                          className="resize-none min-h-[80px]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              {/* Findings section for completed inspections */}
              {status === 'completed' && (
                <div className="flex-1 space-y-4">
                  <h3 className="text-sm font-medium">Inspection Findings</h3>
                  
                  <FormField
                    control={form.control}
                    name="findings.queenSighted"
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
                    name="findings.diseasesSighted"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>Signs of Disease</FormLabel>
                          <FormDescription>
                            Did you notice any signs of disease or pests?
                          </FormDescription>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <div className="space-y-4 mt-4">
                    <FormField
                      control={form.control}
                      name="findings.broodPattern"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Brood Pattern (0-5)</FormLabel>
                          <FormControl>
                            <div className="pt-2">
                              <Slider
                                min={0}
                                max={5}
                                step={1}
                                defaultValue={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                              />
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Poor/None</span>
                                <span>Excellent</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="findings.honeyStores"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Honey Stores (0-5)</FormLabel>
                          <FormControl>
                            <div className="pt-2">
                              <Slider
                                min={0}
                                max={5}
                                step={1}
                                defaultValue={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                              />
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Low/None</span>
                                <span>Abundant</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="findings.temperament"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Temperament (0-5)</FormLabel>
                          <FormControl>
                            <div className="pt-2">
                              <Slider
                                min={0}
                                max={5}
                                step={1}
                                defaultValue={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                              />
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Aggressive</span>
                                <span>Docile</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="findings.populationStrength"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Population Strength (0-5)</FormLabel>
                          <FormControl>
                            <div className="pt-2">
                              <Slider
                                min={0}
                                max={5}
                                step={1}
                                defaultValue={[field.value]}
                                onValueChange={(vals) => field.onChange(vals[0])}
                              />
                              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                <span>Weak</span>
                                <span>Strong</span>
                              </div>
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="findings.varroaCount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Varroa Count (optional)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              min={0}
                              placeholder="Varroa count"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormDescription>
                            Number of varroa mites observed in sample
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-3">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit">
                {status === 'scheduled' ? 'Schedule Inspection' : 'Save Inspection'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default NewInspectionForm; 