import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout, PublicLayout } from './components/layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { ToastContainer } from './components/common/ToastContainer';
import { LoadingSpinner } from './components/common/LoadingSpinner';
import { LoginPage } from './pages';
import { useThemeStore } from './stores/themeStore';

// Lazy load pages for code splitting
const DashboardPage = lazy(() => import('./pages/dashboard/DashboardPage'));
const ResearchPage = lazy(() => import('./pages/research/ResearchPage'));
const PlanningPage = lazy(() => import('./pages/planning/PlanningPage'));
const ScriptPage = lazy(() => import('./pages/script/ScriptPage'));
const ProductionPage = lazy(() => import('./pages/production/ProductionPage'));
const PublishPage = lazy(() => import('./pages/publish/PublishPage'));
const AnalyticsPage = lazy(() => import('./pages/analytics/AnalyticsPage'));
const AgentPage = lazy(() => import('./pages/agent/AgentPage'));
const AdminPage = lazy(() => import('./pages/admin/AdminPage'));

function App() {
  const mode = useThemeStore((state) => state.mode);

  useEffect(() => {
    if (mode === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [mode]);

  return (
    <BrowserRouter>
      <ToastContainer />
      <Suspense fallback={<LoadingSpinner fullScreen message="Loading..." />}>
        <Routes>
          {/* Public Routes */}
          <Route element={<PublicLayout />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected Routes */}
          <Route
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/planning" element={<PlanningPage />} />
            <Route path="/script" element={<ScriptPage />} />
            <Route path="/production" element={<ProductionPage />} />
            <Route path="/publish" element={<PublishPage />} />
            <Route path="/analytics" element={<AnalyticsPage />} />
            <Route
              path="/agent"
              element={
                <ProtectedRoute requiredRoles={['owner', 'team']}>
                  <AgentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute requiredRoles={['owner', 'team']}>
                  <AdminPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Default Redirect */}
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;
