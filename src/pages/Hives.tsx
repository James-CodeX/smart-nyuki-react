import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, Search, AlertTriangle } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageTransition from '@/components/layout/PageTransition';
import { getAllHives, addHive } from '@/utils/mockData';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import HiveMetricsCard from '@/components/dashboard/HiveMetricsCard';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import AddHiveModal from '@/components/dashboard/AddHiveModal';

const Hives = () => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterByAlerts, setFilterByAlerts] = useState<boolean>(false);
  const [hives, setHives] = useState(getAllHives());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  const filteredHives = hives.filter(hive => 
    (hive.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    hive.apiaryName.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (!filterByAlerts || (hive.alerts && hive.alerts.length > 0))
  );
  
  const handleAddHive = (data: { 
    name: string, 
    apiaryId: string,
    node_id: string,
    hiveType: string,
    queenAge?: string,
    installationDate?: string,
    notes?: string
  }) => {
    const newHive = addHive(
      data.name, 
      data.apiaryId, 
      data.node_id, 
      data.hiveType,
      data.queenAge,
      data.installationDate,
      data.notes
    );
    setHives(getAllHives()); // Refresh the hives list
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
                Hives
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="text-muted-foreground mt-1"
              >
                Monitor all your hives in one place
              </motion.p>
            </div>
            
            <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Search hives..." 
                  className="pl-9 w-full sm:w-[250px]"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4" />
                    Filters
                    {filterByAlerts && (
                      <Badge variant="secondary" className="ml-1 py-0">1</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setFilterByAlerts(!filterByAlerts)}>
                    <div className="flex items-center gap-2">
                      <div className={`w-4 h-4 rounded border flex items-center justify-center ${filterByAlerts ? 'bg-primary border-primary' : 'border-input'}`}>
                        {filterByAlerts && <span className="text-primary-foreground text-xs">✓</span>}
                      </div>
                      <span>Show only hives with alerts</span>
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-primary text-primary-foreground flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
                onClick={() => setIsAddModalOpen(true)}
              >
                <Plus className="h-4 w-4" />
                Add Hive
              </motion.button>
            </div>
          </div>
          
          {filteredHives.length === 0 ? (
            <div className="text-center py-16">
              <p className="text-lg text-muted-foreground">No hives found</p>
              {(searchTerm || filterByAlerts) && (
                <Button variant="link" onClick={() => {
                  setSearchTerm('');
                  setFilterByAlerts(false);
                }}>Clear filters</Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredHives.map((hive) => (
                <HiveMetricsCard
                  key={hive.id}
                  id={hive.id}
                  name={hive.name}
                  apiaryId={hive.apiaryId}
                  apiaryName={hive.apiaryName}
                  metrics={hive.metrics}
                  alerts={hive.alerts}
                />
              ))}
            </div>
          )}
        </div>
      </PageTransition>
      
      <AddHiveModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAdd={handleAddHive}
      />
    </>
  );
};

export default Hives; 