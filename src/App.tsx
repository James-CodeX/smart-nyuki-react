
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AnimatePresence } from "framer-motion";

import Dashboard from "./pages/Dashboard";
import ApiaryDetails from "./pages/ApiaryDetails";
import HiveDetails from "./pages/HiveDetails";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import Sidebar from "./components/layout/Navbar";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <div className="flex min-h-screen bg-background">
          <Sidebar />
          <div className="flex-1 pl-0 md:pl-[80px] transition-all duration-300 relative">
            <AnimatePresence mode="wait">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/apiaries/:id" element={<ApiaryDetails />} />
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

export default App;
