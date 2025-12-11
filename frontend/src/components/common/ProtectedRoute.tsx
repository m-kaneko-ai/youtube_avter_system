import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: UserRole[];
}

export const ProtectedRoute = ({
  children,
  requiredRoles,
}: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore();
  const location = useLocation();

  // 未認証の場合はログインページにリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // ロール制限がある場合はチェック
  if (requiredRoles && user) {
    const hasRequiredRole = requiredRoles.includes(user.role);
    if (!hasRequiredRole) {
      // 権限がない場合はダッシュボードにリダイレクト
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
