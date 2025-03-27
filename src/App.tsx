import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { 
  QueryClient, 
  QueryClientProvider, 
} from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, lazy, Suspense } from "react";

// Use React.lazy for code splitting
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Apiaries = lazy(() => import("./pages/Apiaries"));
const Hives = lazy(() => import("./pages/Hives"));
const ApiaryDetails = lazy(() => import("./pages/ApiaryDetails"));
const HiveDetails = lazy(() => import("./pages/HiveDetails"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Production = lazy(() => import("./pages/Production"));
const Inspections = lazy(() => import("./pages/Inspections"));
const InspectionDetail = lazy(() => import("./pages/InspectionDetail"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Auth = lazy(() => import("./pages/Auth"));

import Sidebar from "./components/layout/Navbar";
import BottomNavigation from "./components/mobile/BottomNavigation";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Loading component for suspense fallback
const PageLoader = () => (
  <div className="min-h-screen w-full flex items-center justify-center">
    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
  </div>
);

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <PageLoader />;
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

  // Page wrapper component to avoid repeating the same layout structure
  const PageWrapper = ({ children }: { children: React.ReactNode }) => {
    // Memoize the content class to prevent unnecessary rerenders
    const contentClass = useMemo(() => {
      return `flex-1 transition-all duration-300 ease-in-out relative ${
        isCollapsed ? 'md:pl-[80px]' : 'md:pl-[250px]'
      }`;
    }, [isCollapsed]);

    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar onCollapsedChange={handleSidebarStateChange} />
        <div className={contentClass}>
          <Suspense fallback={<PageLoader />}>
            <div className="pb-20 md:pb-6">
              {children}
            </div>
          </Suspense>
        </div>
        <BottomNavigation />
      </div>
    );
  };

  return (
    <AnimatePresence mode="wait">
      <Routes>
        <Route path="/auth" element={
          <Suspense fallback={<PageLoader />}>
            <Auth />
          </Suspense>
        } />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <Dashboard />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/apiaries"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <Apiaries />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/apiaries/:id"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <ApiaryDetails />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/hives"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <Hives />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/production"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <Production />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspections"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <Inspections />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/inspections/:id"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <InspectionDetail />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <Alerts />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/apiaries/:apiaryId/hives/:hiveId"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <HiveDetails />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <PageWrapper>
                <Settings />
              </PageWrapper>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
};

const App = () => {
  // Create a memoized query client to prevent unnecessary re-renders
  const queryClient = useMemo(() => new QueryClient({
    defaultOptions: {
      queries: {
        // Cached data is fresh for 5 minutes
        staleTime: 5 * 60 * 1000,
        // Keep unused data in cache for 10 minutes
        gcTime: 10 * 60 * 1000,
        // Retry failed requests up to 2 times
        retry: 2,
        // Don't refetch on window focus for better performance
        refetchOnWindowFocus: false,
      },
    },
  }), []);

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
