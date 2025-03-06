
import React, { useState } from 'react';
import PageTransition from '@/components/layout/PageTransition';
import { motion } from 'framer-motion';
import { Plus, Map, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import ApiaryCard from '@/components/dashboard/ApiaryCard';
import HiveMetricsCard from '@/components/dashboard/HiveMetricsCard';
import { getAllApiaries, getAllHives } from '@/utils/mockData';

const Dashboard = () => {
  const [tab, setTab] = useState<'apiaries' | 'hives'>('apiaries');
  const apiaries = getAllApiaries();
  const hives = getAllHives();
  
  // Filter hives to only show ones with alerts
  const hivesWithAlerts = hives.filter(hive => hive.alerts && hive.alerts.length > 0);
  
  return (
    <PageTransition>
      <div className="container max-w-7xl pt-24 pb-16 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <motion.h1 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-3xl font-bold tracking-tight"
            >
              Smart-Nyuki Dashboard
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-muted-foreground mt-1"
            >
              Monitor and manage your apiaries and hives
            </motion.p>
          </div>
          
          <div className="flex gap-3">
            <Link to="/map">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-secondary text-secondary-foreground flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium"
              >
                <Map className="h-4 w-4" />
                Map View
              </motion.button>
            </Link>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="bg-primary text-primary-foreground flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium shadow-sm"
            >
              <Plus className="h-4 w-4" />
              Add Apiary
            </motion.button>
          </div>
        </div>
        
        <div className="bg-white/50 backdrop-blur-sm p-1 rounded-lg inline-flex mb-8">
          <button
            onClick={() => setTab('apiaries')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === 'apiaries' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            My Apiaries
          </button>
          <button
            onClick={() => setTab('hives')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
              tab === 'hives' 
                ? 'bg-primary text-primary-foreground shadow-sm' 
                : 'text-foreground hover:bg-secondary'
            }`}
          >
            All Hives
          </button>
        </div>
        
        {tab === 'apiaries' && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {apiaries.map((apiary, i) => (
                <motion.div
                  key={apiary.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <ApiaryCard
                    id={apiary.id}
                    name={apiary.name}
                    location={apiary.location}
                    hiveCount={apiary.hiveCount}
                    avgTemperature={apiary.avgTemperature}
                    avgHumidity={apiary.avgHumidity}
                    avgSound={apiary.avgSound}
                    avgWeight={apiary.avgWeight}
                  />
                </motion.div>
              ))}
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: apiaries.length * 0.1 }}
                className="flex items-center justify-center bg-secondary/50 border border-dashed border-secondary-foreground/20 rounded-2xl p-5 h-full cursor-pointer hover:bg-secondary/80 transition-colors"
              >
                <div className="text-center">
                  <div className="bg-background w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Plus className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium">Add New Apiary</h3>
                  <p className="text-muted-foreground text-sm mt-1">Expand your beekeeping operation</p>
                </div>
              </motion.div>
            </div>
            
            {hivesWithAlerts.length > 0 && (
              <div className="mt-12">
                <h2 className="text-xl font-semibold mb-4 flex items-center">
                  <span className="bg-red-100 text-red-600 p-1 rounded-full mr-2">
                    <AlertCircle className="h-4 w-4" />
                  </span>
                  Hives Needing Attention
                </h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {hivesWithAlerts.map((hive, i) => (
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
              </div>
            )}
          </>
        )}
        
        {tab === 'hives' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {hives.map((hive, i) => (
              <motion.div
                key={hive.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
              >
                <HiveMetricsCard
                  id={hive.id}
                  name={hive.name}
                  apiaryId={hive.apiaryId}
                  apiaryName={hive.apiaryName}
                  metrics={hive.metrics}
                  alerts={hive.alerts}
                />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  );
};

export default Dashboard;
