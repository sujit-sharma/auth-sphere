import { Navigate, Route, Routes } from 'react-router-dom';
import { GuestRoute, ProtectedRoute, RequirePermission } from './auth/guards';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { Permissions } from './pages/Permissions';
import { Register } from './pages/Register';
import { Roles } from './pages/Roles';
import { Security } from './pages/Security';
import { Users } from './pages/Users';

export function App() {
  return (
    <Routes>
      <Route element={<GuestRoute />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
      </Route>
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="security" element={<Security />} />
          <Route element={<RequirePermission permissions={['users:read']} />}>
            <Route path="admin/users" element={<Users />} />
          </Route>
          <Route element={<RequirePermission permissions={['roles:read']} />}>
            <Route path="admin/roles" element={<Roles />} />
            <Route path="admin/permissions" element={<Permissions />} />
          </Route>
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
