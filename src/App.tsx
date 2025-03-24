import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
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
import Production from "./pages/Production";
import Inspections from "./pages/Inspections";
import Auth from "./pages/Auth";
import { AuthProvider, useAuth } from "./context/AuthContext";

const queryClient = new QueryClient();

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    // You could render a loading spinner here
    return (
      <div className="min-h-screen w-full flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  const [isCollapsed, setIsCollapsed] = useState(true);
  
  // Handle sidebar state changes
  const handleSidebarStateChange = (collapsed: boolean) => {
    setIsCollapsed(collapsed);
  };

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/auth" element={<Auth />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-background">
                <Sidebar onCollapsedChange={handleSidebarStateChange} />
                <div 
                  className={`flex-1 transition-all duration-300 relative ${
                    isCollapsed ? 'pl-[80px]' : 'pl-[250px]'
                  }`}
                >
                  <Dashboard />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/apiaries"
          element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-background">
                <Sidebar onCollapsedChange={handleSidebarStateChange} />
                <div 
                  className={`flex-1 transition-all duration-300 relative ${
                    isCollapsed ? 'pl-[80px]' : 'pl-[250px]'
                  }`}
                >
                  <Apiaries />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/apiaries/:id"
          element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-background">
                <Sidebar onCollapsedChange={handleSidebarStateChange} />
                <div 
                  className={`flex-1 transition-all duration-300 relative ${
                    isCollapsed ? 'pl-[80px]' : 'pl-[250px]'
                  }`}
                >
                  <ApiaryDetails />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hives"
          element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-background">
                <Sidebar onCollapsedChange={handleSidebarStateChange} />
                <div 
                  className={`flex-1 transition-all duration-300 relative ${
                    isCollapsed ? 'pl-[80px]' : 'pl-[250px]'
                  }`}
                >
                  <Hives />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/production"
          element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-background">
                <Sidebar onCollapsedChange={handleSidebarStateChange} />
                <div 
                  className={`flex-1 transition-all duration-300 relative ${
                    isCollapsed ? 'pl-[80px]' : 'pl-[250px]'
                  }`}
                >
                  <Production />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspections"
          element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-background">
                <Sidebar onCollapsedChange={handleSidebarStateChange} />
                <div 
                  className={`flex-1 transition-all duration-300 relative ${
                    isCollapsed ? 'pl-[80px]' : 'pl-[250px]'
                  }`}
                >
                  <Inspections />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/apiaries/:apiaryId/hives/:hiveId"
          element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-background">
                <Sidebar onCollapsedChange={handleSidebarStateChange} />
                <div 
                  className={`flex-1 transition-all duration-300 relative ${
                    isCollapsed ? 'pl-[80px]' : 'pl-[250px]'
                  }`}
                >
                  <HiveDetails />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <div className="flex min-h-screen bg-background">
                <Sidebar onCollapsedChange={handleSidebarStateChange} />
                <div 
                  className={`flex-1 transition-all duration-300 relative ${
                    isCollapsed ? 'pl-[80px]' : 'pl-[250px]'
                  }`}
                >
                  <Settings />
                </div>
              </div>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;
