// Update this page (the content is just a fallback if you fail to update the page)

import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Dashboard from './Dashboard';
import Apiaries from './Apiaries';
import ApiaryDetails from './ApiaryDetails';
import Hives from './Hives';
import HiveDetails from './HiveDetails';
import Production from './Production';
import Settings from './Settings';
import NotFound from './NotFound';

const Index = () => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/apiaries" element={<Apiaries />} />
      <Route path="/apiaries/:id" element={<ApiaryDetails />} />
      <Route path="/hives" element={<Hives />} />
      <Route path="/apiaries/:apiaryId/hives/:hiveId" element={<HiveDetails />} />
      <Route path="/production" element={<Production />} />
      <Route path="/settings" element={<Settings />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default Index;
