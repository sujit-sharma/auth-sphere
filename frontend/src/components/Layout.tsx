import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';

export function Layout() {
  const { user, hasPermission, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="shell">
      <header className="nav">
        <strong>Auth Sphere</strong>
        <nav>
          <NavLink to="/" end>Dashboard</NavLink>
          <NavLink to="/security">Security</NavLink>
          {hasPermission('users:read') && <NavLink to="/admin/users">Users</NavLink>}
          {hasPermission('roles:read') && <NavLink to="/admin/roles">Roles</NavLink>}
          {hasPermission('roles:read') && <NavLink to="/admin/permissions">Permissions</NavLink>}
        </nav>
        <span className="spacer" />
        <span className="muted">{user?.email}</span>
        <button
          className="btn secondary"
          onClick={async () => {
            await logout();
            navigate('/login');
          }}
        >
          Sign out
        </button>
      </header>
      <main className="content">
        <Outlet />
      </main>
    </div>
  );
}
