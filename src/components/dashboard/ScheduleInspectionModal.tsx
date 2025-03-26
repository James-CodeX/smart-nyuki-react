import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { format, addDays } from 'date-fns';
import { 
  Calendar, 
  CheckCircle, 
  X, 
  CalendarDays, 
  Clock, 
  ClipboardList, 
  AlertCircle 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { HiveWithDetails } from '@/services/hiveService';
import { createInspection } from '@/services/inspectionService';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface ScheduleInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onScheduled: () => void;
  hives: HiveWithDetails[];
}

// Form schema with Zod validation
const formSchema = z.object({
  hiveId: z.string({
    required_error: "Please select a hive",
  }),
  inspectionDate: z.date({
    required_error: "Please select a date",
  }),
  type: z.enum(['regular', 'health-check', 'winter-prep', 'varroa-check', 'disease-treatment', 'harvest-evaluation'], {
    required_error: "Please select an inspection type",
  }),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

const ScheduleInspectionModal: React.FC<ScheduleInspectionModalProps> = ({ 
  isOpen, 
  onClose, 
  onScheduled,
  hives 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hiveId: '',
      inspectionDate: addDays(new Date(), 1), // Default to tomorrow
      type: 'regular',
      notes: '',
    },
  });
  
  const handleSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      
      // Get details for the selected hive
      const selectedHive = hives.find(hive => hive.id === data.hiveId);
      
      if (!selectedHive) {
        throw new Error('Selected hive not found');
      }
      
      // Prepare inspection data
      const inspectionData = {
        hive_id: data.hiveId,
        inspection_date: format(data.inspectionDate, 'yyyy-MM-dd'),
        type: data.type,
        status: 'scheduled',
        notes: data.notes || '',
      };
      
      // Create the inspection
      await createInspection(inspectionData);
      
      toast({
        title: "Inspection Scheduled",
        description: `Inspection scheduled for ${selectedHive.name} on ${format(data.inspectionDate, 'PPP')}.`,
      });
      
      onScheduled();
      onClose();
      form.reset();
    } catch (error) {
      console.error('Error scheduling inspection:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "There was a problem scheduling the inspection. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5" />
            Schedule Inspection
          </DialogTitle>
          <DialogDescription>
            Plan your next hive inspection. Choose a hive, date, and type of inspection.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="hiveId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Hive</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a hive" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {hives.map((hive) => (
                        <SelectItem key={hive.id} value={hive.id}>
                          {hive.name} ({hive.apiaryName})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Select the hive you want to inspect
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="inspectionDate"
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
                            <span>Pick a date</span>
                          )}
                          <Calendar className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormDescription>
                    When do you plan to conduct this inspection?
                  </FormDescription>
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
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="regular">Regular</SelectItem>
                      <SelectItem value="health-check">Health Check</SelectItem>
                      <SelectItem value="winter-prep">Winter Preparation</SelectItem>
                      <SelectItem value="varroa-check">Varroa Check</SelectItem>
                      <SelectItem value="disease-treatment">Disease Treatment</SelectItem>
                      <SelectItem value="harvest-evaluation">Harvest Evaluation</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    What type of inspection will you be conducting?
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Notes (Optional)</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Add any notes or reminders for this inspection"
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
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                type="submit"
                disabled={isSubmitting}
                className="gap-2"
              >
                {isSubmitting ? 'Scheduling...' : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    Schedule Inspection
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default ScheduleInspectionModal; 