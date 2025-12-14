import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout, PublicLayout } from './components/layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import {
  LoginPage,
  DashboardPage,
  ResearchPage,
  PlanningPage,
  ScriptPage,
  ProductionPage,
  PublishPage,
  AnalyticsPage,
  AdminPage,
} from './pages';
import { useThemeStore } from './stores/themeStore';

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
    </BrowserRouter>
  );
}

export default App;
