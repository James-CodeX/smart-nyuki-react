import React, { useEffect, useState } from 'react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';

const formSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  type: z.string().min(1, 'Hive type is required'),
  status: z.string().min(1, 'Status is required'),
  installation_date: z.string().optional(),
  queen_type: z.string().optional(),
  queen_introduced_date: z.string().optional(),
  queen_marked: z.boolean().optional(),
  queen_marking_color: z.string().optional(),
  notes: z.string().optional(),
});

type FormValues = z.infer<typeof formSchema>;

interface EditHiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: (data: FormValues & { hive_id: string }) => void;
  hive: {
    hive_id: string;
    name: string;
    type: string;
    status: string;
    installation_date?: string;
    queen_type?: string;
    queen_introduced_date?: string;
    queen_marked?: boolean;
    queen_marking_color?: string;
    notes?: string;
  };
}

const hiveTypes = [
  'Langstroth',
  'Dadant',
  'Top-bar',
  'Warre',
  'Horizontal',
  'Flow Hive',
  'Other'
];

const hiveStatuses = [
  'active',
  'inactive',
  'maintenance',
  'monitoring',
  'quarantine'
];

const queenTypes = [
  'Italian',
  'Carniolan',
  'Buckfast',
  'Russian',
  'Caucasian',
  'Minnesota Hygienic',
  'Wild/Local',
  'Other'
];

const markingColors = [
  'white',
  'yellow',
  'red',
  'green',
  'blue'
];

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
    watch,
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      type: '',
      status: '',
      installation_date: '',
      queen_type: '',
      queen_introduced_date: '',
      queen_marked: false,
      queen_marking_color: '',
      notes: '',
    },
  });

  const queenMarked = watch('queen_marked');

  // Set form values when hive data or isOpen changes
  useEffect(() => {
    if (isOpen && hive) {
      setValue('name', hive.name);
      setValue('type', hive.type);
      setValue('status', hive.status || 'active');
      setValue('installation_date', hive.installation_date || '');
      setValue('queen_type', hive.queen_type || '');
      setValue('queen_introduced_date', hive.queen_introduced_date || '');
      setValue('queen_marked', hive.queen_marked || false);
      setValue('queen_marking_color', hive.queen_marking_color || '');
      setValue('notes', hive.notes || '');
    }
  }, [isOpen, hive, setValue]);

  const onSubmit = async (data: FormValues) => {
    try {
      onEdit({ ...data, hive_id: hive.hive_id });
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
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="queen">Queen Details</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="basic" className="space-y-4 py-2">
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
                      <Label htmlFor="type">Hive Type</Label>
                      <Select 
                        onValueChange={(value) => setValue('type', value)}
                        defaultValue={hive.type}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select hive type" />
                        </SelectTrigger>
                        <SelectContent>
                          {hiveTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.type && (
                        <p className="text-sm text-destructive">{errors.type.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select 
                        onValueChange={(value) => setValue('status', value)}
                        defaultValue={hive.status || 'active'}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          {hiveStatuses.map((status) => (
                            <SelectItem key={status} value={status}>
                              {status.charAt(0).toUpperCase() + status.slice(1)}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.status && (
                        <p className="text-sm text-destructive">{errors.status.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="installation_date">Installation Date</Label>
                      <Input
                        id="installation_date"
                        type="date"
                        {...register('installation_date')}
                      />
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
                  </TabsContent>
                  
                  <TabsContent value="queen" className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="queen_type">Queen Type</Label>
                      <Select 
                        onValueChange={(value) => setValue('queen_type', value)}
                        defaultValue={hive.queen_type}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select queen type" />
                        </SelectTrigger>
                        <SelectContent>
                          {queenTypes.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="queen_introduced_date">Queen Introduction Date</Label>
                      <Input
                        id="queen_introduced_date"
                        type="date"
                        {...register('queen_introduced_date')}
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2 mt-4">
                      <Checkbox 
                        id="queen_marked" 
                        checked={queenMarked}
                        onCheckedChange={(checked) => {
                          setValue('queen_marked', checked === true);
                        }}
                      />
                      <Label htmlFor="queen_marked" className="cursor-pointer">Queen is marked</Label>
                    </div>
                    
                    {queenMarked && (
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="queen_marking_color">Marking Color</Label>
                        <Select 
                          onValueChange={(value) => setValue('queen_marking_color', value)}
                          defaultValue={hive.queen_marking_color}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select marking color" />
                          </SelectTrigger>
                          <SelectContent>
                            {markingColors.map((color) => (
                              <SelectItem key={color} value={color}>
                                <div className="flex items-center">
                                  <div 
                                    className="w-4 h-4 rounded-full mr-2" 
                                    style={{ backgroundColor: color }}
                                  ></div>
                                  {color.charAt(0).toUpperCase() + color.slice(1)}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
                
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