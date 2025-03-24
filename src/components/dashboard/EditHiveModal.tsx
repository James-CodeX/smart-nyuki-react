import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  hiveType: z.string().min(2, 'Hive type is required'),
  queenAge: z.number().min(0, 'Queen age must be a positive number').max(5, 'Queen age must be 5 or less'),
  installationDate: z.date(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditHiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (data: FormValues) => void;
  hive: {
    id: string;
    name: string;
    hiveType: string;
    queenAge: number;
    installationDate: string;
    notes?: string;
  };
}

const EditHiveModal: React.FC<EditHiveModalProps> = ({
  isOpen,
  onClose,
  onEdit,
  hive,
}) => {
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
    setValue,
    control,
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      hiveType: '',
      queenAge: 0,
      installationDate: new Date(),
      notes: '',
    },
  });

  // Set form values when hive data or isOpen changes
  useEffect(() => {
    if (isOpen && hive) {
      setValue('name', hive.name);
      setValue('hiveType', hive.hiveType);
      setValue('queenAge', hive.queenAge);
      setValue('installationDate', new Date(hive.installationDate));
      setValue('notes', hive.notes || '');
    }
  }, [isOpen, hive, setValue]);

  const installationDate = watch('installationDate');

  const onSubmit = async (data: FormValues) => {
    try {
      onEdit(data);
      onClose();
      toast({
        title: 'Hive updated',
        description: `Successfully updated ${data.name}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update hive',
        variant: 'destructive',
      });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative z-10 w-full max-w-lg bg-background border rounded-lg shadow-lg overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Edit Hive</h2>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-full"
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Hive Name</Label>
                  <Input
                    id="name"
                    placeholder="Enter hive name"
                    {...register('name')}
                  />
                  {errors.name && (
                    <p className="text-sm text-destructive">{errors.name.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="hiveType">Hive Type</Label>
                  <Select 
                    onValueChange={(value) => setValue('hiveType', value)}
                    defaultValue={hive.hiveType}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select hive type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Langstroth">Langstroth</SelectItem>
                      <SelectItem value="Warre">Warre</SelectItem>
                      <SelectItem value="Top Bar">Top Bar</SelectItem>
                      <SelectItem value="Flow">Flow</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.hiveType && (
                    <p className="text-sm text-destructive">{errors.hiveType.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="queenAge">Queen Age (years)</Label>
                  <Input
                    id="queenAge"
                    type="number"
                    min="0"
                    max="5"
                    step="1"
                    placeholder="Enter queen age"
                    {...register('queenAge', { valueAsNumber: true })}
                  />
                  {errors.queenAge && (
                    <p className="text-sm text-destructive">{errors.queenAge.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="installationDate">Installation Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !installationDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {installationDate ? format(installationDate, "PPP") : <span>Pick a date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={installationDate}
                        onSelect={(date) => date && setValue('installationDate', date)}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  {errors.installationDate && (
                    <p className="text-sm text-destructive">{errors.installationDate.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Notes</Label>
                  <Textarea
                    id="notes"
                    placeholder="Add any notes about this hive"
                    className="min-h-[100px]"
                    {...register('notes')}
                  />
                </div>
                
                <div className="flex justify-end space-x-2 pt-4 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={onClose}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Updating...' : 'Update Hive'}
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default EditHiveModal; 