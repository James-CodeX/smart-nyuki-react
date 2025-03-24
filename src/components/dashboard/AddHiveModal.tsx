import React from 'react';
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
import { getAllApiaries } from '@/utils/mockData';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const formSchema = z.object({
  name: z.string().min(3, 'Name must be at least 3 characters'),
  apiaryId: z.string().min(1, 'Please select an apiary'),
  node_id: z.string().min(1, 'Node ID is required'),
  hiveType: z.string().min(1, 'Hive type is required'),
  queenAge: z.string().optional(),
  installationDate: z.string().optional(),
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

const AddHiveModal: React.FC<AddHiveModalProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const apiaries = getAllApiaries();
  const { toast } = useToast();
  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      apiaryId: '',
      node_id: '',
      hiveType: '',
      queenAge: '',
      installationDate: '',
      notes: '',
    },
  });

  const onSubmit = async (data: FormValues) => {
    try {
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
                    <TabsTrigger value="details">Details</TabsTrigger>
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
                      <Label htmlFor="node_id">Node ID</Label>
                      <Input
                        id="node_id"
                        placeholder="Enter IoT node identifier"
                        {...register('node_id')}
                      />
                      {errors.node_id && (
                        <p className="text-sm text-destructive">{errors.node_id.message}</p>
                      )}
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
                      <Label htmlFor="hiveType">Hive Type</Label>
                      <Select onValueChange={(value) => setValue('hiveType', value)}>
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
                      {errors.hiveType && (
                        <p className="text-sm text-destructive">{errors.hiveType.message}</p>
                      )}
                    </div>
                  </TabsContent>
                  
                  <TabsContent value="details" className="space-y-4 py-2">
                    <div className="space-y-2">
                      <Label htmlFor="queenAge">Queen Age (Year)</Label>
                      <Input
                        id="queenAge"
                        type="number"
                        min="0"
                        max="5"
                        placeholder="Queen age in years"
                        {...register('queenAge')}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="installationDate">Installation Date</Label>
                      <Input
                        id="installationDate"
                        type="date"
                        {...register('installationDate')}
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
                  <Button type="submit" disabled={isSubmitting}>
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