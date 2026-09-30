import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/endpoints';
import { setAccessToken } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { ErrorMessage, Field } from '../components/ui';

export function Security() {
  const { logoutAll } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);

  const change = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await authApi.changePassword(current, next);
      // The backend revokes every session on password change.
      setAccessToken(null);
      await logoutAll();
      navigate('/login', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <h2>Security</h2>
      <form className="card" onSubmit={change}>
        <h3>Change password</h3>
        <p className="muted">All sessions are signed out afterwards.</p>
        <ErrorMessage error={error} />
        <Field label="Current password">
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <Field label="New password">
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={8} />
        </Field>
        <button className="btn" disabled={busy}>Change password</button>
      </form>
      <div className="card">
        <h3>Sessions</h3>
        <p className="muted">Sign out of every device where you are logged in.</p>
        <button
          className="btn danger"
          onClick={async () => {
            await logoutAll();
            navigate('/login', { replace: true });
          }}
        >
          Sign out everywhere
        </button>
      </div>
    </>
  );
}
