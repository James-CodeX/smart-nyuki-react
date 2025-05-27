import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { 
  QueryClient, 
  QueryClientProvider, 
} from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, lazy, Suspense, useContext } from "react";
import { startMetricsChecker, stopMetricsChecker } from "./utils/metricsChecker";
import ActiveAlertsIndicator from "./components/dashboard/ActiveAlertsIndicator";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { SidebarProvider, useSidebar } from "./context/SidebarContext";
import { cn } from "@/lib/utils";
import ErrorBoundary from "./components/common/ErrorBoundary";
import LoadingState from "./components/common/LoadingState";
import logger from '@/utils/logger';

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
const Landing = lazy(() => import("./pages/Landing"));

import BottomNavigation from "./components/mobile/BottomNavigation";
import Sidebar from "./components/layout/Sidebar";
import { AuthProvider, useAuth } from "./context/AuthContext";

// Loading component for suspense fallback
const PageLoader = () => (
  <LoadingState fullPage size="large" text="Loading..." />
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

// Redirect authenticated users from landing to dashboard
const AuthRedirect = ({ children }: ProtectedRouteProps) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <PageLoader />;
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

const AppRoutes = () => {
  // Page wrapper component to avoid repeating the same layout structure
  const PageWrapper = ({ children }: { children: React.ReactNode }) => {
    const { collapsed } = useSidebar();
    
    return (
      <div className="flex min-h-screen bg-background">
        <Sidebar />
        <div className={cn(
          "flex-1 relative transition-all duration-200",
          collapsed ? "md:ml-20" : "md:ml-64"
        )}>
          <Suspense fallback={<PageLoader />}>
            <ErrorBoundary>
              <div className="pb-20 md:pb-6 relative overflow-hidden">
                {children}
              </div>
            </ErrorBoundary>
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
            <ErrorBoundary>
              <Auth />
            </ErrorBoundary>
          </Suspense>
        } />
        <Route
          path="/"
          element={
            <Suspense fallback={<PageLoader />}>
              <ErrorBoundary>
                <Landing />
              </ErrorBoundary>
            </Suspense>
          }
        />
        <Route
          path="/dashboard"
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
        <Route path="*" element={
          <ErrorBoundary>
            <NotFound />
          </ErrorBoundary>
        } />
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

  // Start metrics checker when app mounts
  useEffect(() => {
    logger.log('[DEBUG] App mounted - Starting metrics checker ONCE at:', new Date().toISOString());
    // Start checking metrics every 30 minutes (default)
    const stopChecker = startMetricsChecker();
    
    // Clean up when component unmounts
    return () => {
      logger.log('[DEBUG] App unmounting - Stopping metrics checker at:', new Date().toISOString());
      stopChecker();
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <ThemeProvider>
          <SidebarProvider>
            <AppThemeWrapper>
              <TooltipProvider>
                <Toaster />
                <BrowserRouter>
                  <AppRoutes />
                  <ActiveAlertsIndicator />
                </BrowserRouter>
              </TooltipProvider>
            </AppThemeWrapper>
          </SidebarProvider>
        </ThemeProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

// Wrapper component to apply theme to the entire app
const AppThemeWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { theme } = useTheme();
  
  useEffect(() => {
    // Apply theme class to the document element
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);
  
  return (
    <div className={`${theme === 'dark' ? 'dark' : ''}`}>
      {children}
    </div>
  );
};

export default App;
