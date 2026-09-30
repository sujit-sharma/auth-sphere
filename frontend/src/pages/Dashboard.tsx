import { useAuth } from '../auth/AuthContext';

export function Dashboard() {
  const { user } = useAuth();
  if (!user) return null;
  const name = [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email;

  return (
    <>
      <h2>Welcome, {name}</h2>
      <div className="card">
        <h3>Profile</h3>
        <p><span className="muted">Email:</span> {user.email}</p>
        <p><span className="muted">User ID:</span> <code>{user.id}</code></p>
      </div>
      <div className="card">
        <h3>Roles</h3>
        <div className="chips">
          {user.roles.length ? user.roles.map((r) => <span key={r} className="chip">{r}</span>) : <span className="muted">None</span>}
        </div>
      </div>
      <div className="card">
        <h3>Permissions</h3>
        <div className="chips">
          {user.permissions.length ? user.permissions.map((p) => <span key={p} className="chip">{p}</span>) : <span className="muted">None</span>}
        </div>
      </div>
    </>
  );
}
