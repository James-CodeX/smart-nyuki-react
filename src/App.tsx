import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

import Dashboard from "./pages/Dashboard";
import Apiaries from "./pages/Apiaries";
import Hives from "./pages/Hives";
import ApiaryDetails from "./pages/ApiaryDetails";
import HiveDetails from "./pages/HiveDetails";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/layout/Navbar";

const queryClient = new QueryClient();

const App = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Handle sidebar state changes
  const handleSidebarStateChange = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
  };

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="flex min-h-screen bg-background">
            <Sidebar onCollapsedChange={handleSidebarStateChange} />
            <div 
              className={`flex-1 transition-all duration-300 relative ${
                isCollapsed ? 'pl-[80px]' : 'pl-[250px]'
              }`}
            >
              <AnimatePresence mode="wait">
                <Routes>
                  <Route path="/" element={<Dashboard />} />
                  <Route path="/apiaries" element={<Apiaries />} />
                  <Route path="/apiaries/:id" element={<ApiaryDetails />} />
                  <Route path="/hives" element={<Hives />} />
                  <Route path="/apiaries/:apiaryId/hives/:hiveId" element={<HiveDetails />} />
                  <Route path="/settings" element={<Settings />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </AnimatePresence>
            </div>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
