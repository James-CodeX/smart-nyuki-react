import React, { useState } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { getAllApiaries } from '@/services/apiaryService';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/lib/supabase';
import { Loader2 } from 'lucide-react';
import { checkHiveAvailability } from '@/services/hiveService';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  hive_id: z.string().min(1, 'Hive ID is required'),
  apiaryId: z.string().min(1, 'Please select an apiary'),
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

interface AddHiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (data: FormValues) => void;
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

const AddHiveModal: React.FC<AddHiveModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const [apiaries, setApiaries] = useState<{id: string, name: string}[]>([]);
  const [isCheckingHiveId, setIsCheckingHiveId] = useState(false);
  const [hiveIdError, setHiveIdError] = useState<string | null>(null);
  const [hiveIdStatus, setHiveIdStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid' | 'taken'>('idle');
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      hive_id: '',
      apiaryId: '',
      type: '',
      status: 'active',
      installation_date: '',
      queen_type: '',
      queen_introduced_date: '',
      queen_marked: false,
      queen_marking_color: '',
      notes: '',
    },
  });

  const queenMarked = watch('queen_marked');
  const hiveId = watch('hive_id');

  // Check if hive ID exists in metrics_time_series_data table and is not already registered
  const checkHiveId = async (id: string) => {
    if (!id) return;
    
    setIsCheckingHiveId(true);
    setHiveIdStatus('checking');
    setHiveIdError(null);
    
    try {
      const result = await checkHiveAvailability(id);
      
      // No longer checking if hive exists in metrics_time_series_data
      // Only checking if it's already registered
      if (!result.available) {
        setHiveIdError(result.error || 'This hive ID is not available');
        setHiveIdStatus('taken');
        setError('hive_id', { message: result.error || 'This hive ID is not available' });
        return;
      }
      
      // Hive ID is valid and available
      clearErrors('hive_id');
      setHiveIdStatus('valid');
    } catch (error) {
      console.error('Error checking hive ID:', error);
      setHiveIdError('Error checking hive ID');
      setHiveIdStatus('invalid');
      setError('hive_id', { message: 'Error checking hive ID' });
    } finally {
      setIsCheckingHiveId(false);
    }
  };

  // React to changes in hive ID
  React.useEffect(() => {
    const timer = setTimeout(() => {
      if (hiveId && hiveId.length > 0) {
        checkHiveId(hiveId);
      } else {
        setHiveIdStatus('idle');
        setHiveIdError(null);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [hiveId]);

  // Load apiaries when modal opens
  React.useEffect(() => {
    if (isOpen) {
      const loadApiaries = async () => {
        try {
          const response = await getAllApiaries();
          setApiaries((Array.isArray(response.data) ? response.data : []).map(apiary => ({
            id: apiary.id,
            name: apiary.name
          })));
        } catch (error) {
          console.error('Error loading apiaries:', error);
          toast({
            variant: "destructive",
            title: "Error loading apiaries",
            description: "Failed to load apiaries. Please try again.",
          });
        }
      };
      
      loadApiaries();
      
      // Reset form state
      reset();
      setHiveIdStatus('idle');
      setHiveIdError(null);
    }
  }, [isOpen, toast, reset]);

  const onSubmit = async (data: FormValues) => {
    try {
      // Final check for hive ID before submission
      if (hiveIdStatus !== 'valid') {
        setError('hive_id', { 
          message: hiveIdStatus === 'taken' 
            ? 'This hive ID is already registered' 
            : hiveIdStatus === 'invalid' 
              ? 'Error validating hive ID' 
              : 'Please verify the hive ID' 
        });
        return;
      }
      
      onAdd(data);
      reset();
      onClose();
      toast({
        title: 'Hive added',
        description: `Successfully added ${data.name}`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to add hive',
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
            className="relative z-10 w-full max-w-xl bg-background border rounded-lg shadow-lg overflow-y-auto max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Add New Hive</h2>
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
                      <Label htmlFor="hive_id">Hive ID</Label>
                      <div className="relative">
                        <Input
                          id="hive_id"
                          placeholder="Enter the hive ID from your sensor"
                          {...register('hive_id')}
                          className={`${
                            hiveIdStatus === 'valid' ? 'border-green-500 pr-10' :
                            hiveIdStatus === 'invalid' || hiveIdStatus === 'taken' ? 'border-red-500 pr-10' : ''
                          }`}
                        />
                        {hiveIdStatus === 'checking' && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2">
                            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                          </div>
                        )}
                        {hiveIdStatus === 'valid' && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-green-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M20 6L9 17l-5-5" />
                            </svg>
                          </div>
                        )}
                        {(hiveIdStatus === 'invalid' || hiveIdStatus === 'taken') && (
                          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500">
                            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <line x1="18" y1="6" x2="6" y2="18"></line>
                              <line x1="6" y1="6" x2="18" y2="18"></line>
                            </svg>
                          </div>
                        )}
                      </div>
                      {errors.hive_id && (
                        <p className="text-sm text-destructive">{errors.hive_id.message}</p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Enter a unique ID for your hive. This can be any ID you choose, as long as it hasn't been registered before.
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="apiaryId">Apiary</Label>
                      <Select onValueChange={(value) => setValue('apiaryId', value)}>
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
                      {errors.apiaryId && (
                        <p className="text-sm text-destructive">{errors.apiaryId.message}</p>
                      )}
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="type">Hive Type</Label>
                      <Select onValueChange={(value) => setValue('type', value)}>
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
                      <Select onValueChange={(value) => setValue('status', value)} defaultValue="active">
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
                        placeholder="Additional notes about the hive"
                        className="min-h-[100px]"
                        {...register('notes')}
                      />
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="queen" className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="queen_type">Queen Type</Label>
                      <Select onValueChange={(value) => setValue('queen_type', value)}>
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
                        onCheckedChange={(checked) => {
                          setValue('queen_marked', checked === true);
                        }}
                      />
                      <Label htmlFor="queen_marked" className="cursor-pointer">Queen is marked</Label>
                    </div>
                    
                    {queenMarked && (
                      <div className="space-y-2 mt-4">
                        <Label htmlFor="queen_marking_color">Marking Color</Label>
                        <Select onValueChange={(value) => setValue('queen_marking_color', value)}>
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
                    onClick={() => {
                      reset();
                      onClose();
                    }}
                  >
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={isSubmitting || hiveIdStatus === 'checking' || hiveIdStatus === 'invalid' || hiveIdStatus === 'taken'}
                  >
                    {isSubmitting ? 'Adding...' : 'Add Hive'}
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

export default AddHiveModal; 