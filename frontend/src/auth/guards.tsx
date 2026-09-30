import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

export function ProtectedRoute() {
  const { user, loading } = useAuth();
  const location = useLocation();
  if (loading) return <p className="center muted">Loading…</p>;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}

export function GuestRoute() {
  const { user, loading } = useAuth();
  if (loading) return <p className="center muted">Loading…</p>;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}

export function RequirePermission({ permissions }: { permissions: string[] }) {
  const { hasPermission } = useAuth();
  if (!hasPermission(...permissions)) {
    return (
      <div className="card">
        <h2>Access denied</h2>
        <p className="muted">You need: {permissions.join(', ')}</p>
      </div>
    );
  }
  return <Outlet />;
}
