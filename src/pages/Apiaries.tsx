import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageTransition from '@/components/layout/PageTransition';
import ApiaryCard from '@/components/dashboard/ApiaryCard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AddApiaryModal from '@/components/dashboard/AddApiaryModal';
import { getAllApiaries, addApiary as addApiaryService, ApiaryWithStats } from '@/services/apiaryService';
import { toast } from '@/components/ui/use-toast';

const Apiaries = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [apiaries, setApiaries] = useState<ApiaryWithStats[]>([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    // Load apiaries when component mounts
    const loadApiaries = async () => {
      try {
        setIsLoading(true);
        const data = await getAllApiaries();
        setApiaries(data);
      } catch (error) {
        console.error('Error loading apiaries:', error);
        toast({
          variant: "destructive",
          title: "Error loading apiaries",
          description: "There was a problem loading your apiaries. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadApiaries();
  }, []);
  
  const filteredApiaries = apiaries.filter(apiary => 
    apiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apiary.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddApiary = async (data: { name: string; location: string }) => {
    try {
      setIsLoading(true);
      await addApiaryService(data);
      
      // Refresh the apiaries list
      const updatedApiaries = await getAllApiaries();
      setApiaries(updatedApiaries);
      
      toast({
        title: "Apiary added",
        description: "Your new apiary has been created successfully.",
      });
      
      setIsAddModalOpen(false);
    } catch (error) {
      console.error('Error adding apiary:', error);
      toast({
        variant: "destructive",
        title: "Error adding apiary",
        description: "There was a problem creating the apiary. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <PageTransition>
        <div className="container max-w-7xl pt-16 md:pt-8 pb-16 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
            <div>
              <motion.h1 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-3xl font-bold tracking-tight"
              >
                Apiaries
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-muted-foreground mt-1"
              >
                Manage all your apiaries in one place
              </motion.p>
            </div>
            
            <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search apiaries..." 
                  className="pl-9 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary text-primary-foreground flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                onClick={() => setIsAddModalOpen(true)}
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                Add Apiary
              </motion.button>
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-2 text-lg">Loading apiaries...</span>
            </div>
          ) : filteredApiaries.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">
                {searchTerm ? "No apiaries match your search" : "No apiaries found. Add your first apiary to get started!"}
              </p>
              {searchTerm && (
                <Button variant="link" onClick={() => setSearchTerm('')}>Clear search</Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredApiaries.map((apiary) => (
                <ApiaryCard
                  key={apiary.id}
                  id={apiary.id}
                  name={apiary.name}
                  location={apiary.location}
                  hiveCount={apiary.hiveCount}
                  avgTemperature={apiary.avgTemperature}
                  avgHumidity={apiary.avgHumidity}
                  avgSound={apiary.avgSound}
                  avgWeight={apiary.avgWeight}
                />
              ))}
            </div>
          )}
        </div>
      </PageTransition>
      
      <AddApiaryModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)} 
        onAdd={handleAddApiary} 
      />
    </>
  );
};

export default Apiaries; 