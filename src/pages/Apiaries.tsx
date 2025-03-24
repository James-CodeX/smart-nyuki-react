import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageTransition from '@/components/layout/PageTransition';
import ApiaryCard from '@/components/dashboard/ApiaryCard';
import { getAllApiaries, addApiary } from '@/utils/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import AddApiaryModal from '@/components/dashboard/AddApiaryModal';

const Apiaries = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [apiaries, setApiaries] = useState(getAllApiaries());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const filteredApiaries = apiaries.filter(apiary => 
    apiary.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    apiary.location.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddApiary = (data: { name: string; location: string }) => {
    const newApiary = addApiary(data.name, data.location);
    setApiaries(getAllApiaries()); // Refresh the apiaries list
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
              >
                <Plus className="h-4 w-4" />
                Add Apiary
              </motion.button>
            </div>
          </div>
          
          {filteredApiaries.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No apiaries found</p>
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
                  hiveCount={apiary.hives.length}
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