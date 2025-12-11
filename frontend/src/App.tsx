import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout, PublicLayout } from './components/layout';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import {
  LoginPage,
  DashboardPage,
  ScriptPage,
  AnalyticsPage,
  PlaceholderPage,
} from './pages';

function App() {
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
          <Route path="/research" element={<PlaceholderPage title="リサーチ" />} />
          <Route path="/planning" element={<PlaceholderPage title="企画" />} />
          <Route path="/script" element={<ScriptPage />} />
          <Route path="/production" element={<PlaceholderPage title="動画制作" />} />
          <Route path="/publish" element={<PlaceholderPage title="公開・配信" />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route
            path="/admin"
            element={
              <ProtectedRoute requiredRoles={['owner', 'team']}>
                <PlaceholderPage title="管理" />
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
