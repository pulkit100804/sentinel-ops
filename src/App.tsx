import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AuthProvider } from "@/context/AuthContext";
import { AnalysisProvider } from "@/context/AnalysisContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";

import Landing from "./pages/Landing";
import Dashboard from "./pages/Dashboard";
import UploadPage from "./pages/UploadPage";
import ProcessingPage from "./pages/ProcessingPage";
import ComparisonPage from "./pages/ComparisonPage";
import DamagePage from "./pages/DamagePage";
import SeverityPage from "./pages/SeverityPage";
import ReliefPage from "./pages/ReliefPage";
import ReportsPage from "./pages/ReportsPage";
import AdminPage from "./pages/AdminPage";
import LogoutPage from "./pages/LogoutPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const protectedRoutes: { path: string; element: JSX.Element }[] = [
  { path: "/dashboard",  element: <Dashboard /> },
  { path: "/upload",     element: <UploadPage /> },
  { path: "/processing", element: <ProcessingPage /> },
  { path: "/comparison", element: <ComparisonPage /> },
  { path: "/damage",     element: <DamagePage /> },
  { path: "/severity",   element: <SeverityPage /> },
  { path: "/relief",     element: <ReliefPage /> },
  { path: "/reports",    element: <ReportsPage /> },
  { path: "/admin",      element: <AdminPage /> },
];

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AnalysisProvider>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/logout" element={<LogoutPage />} />
              <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
                {protectedRoutes.map(r => <Route key={r.path} path={r.path} element={r.element} />)}
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AnalysisProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
