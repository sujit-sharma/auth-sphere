import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { ErrorMessage, Field } from '../components/ui';

export function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });
  const [error, setError] = useState<unknown>();
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [k]: e.target.value });

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(undefined);
    try {
      await authApi.register({
        email: form.email,
        password: form.password,
        firstName: form.firstName || undefined,
        lastName: form.lastName || undefined,
      });
      await login(form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="card auth-card" onSubmit={submit}>
      <h2>Create account</h2>
      <ErrorMessage error={error} />
      <div className="row">
        <Field label="First name"><input value={form.firstName} onChange={set('firstName')} /></Field>
        <Field label="Last name"><input value={form.lastName} onChange={set('lastName')} /></Field>
      </div>
      <Field label="Email"><input type="email" value={form.email} onChange={set('email')} required /></Field>
      <Field label="Password">
        <input type="password" value={form.password} onChange={set('password')} required minLength={8} />
      </Field>
      <p className="muted">Min 8 characters with an uppercase letter, a lowercase letter and a number.</p>
      <button className="btn" disabled={busy}>{busy ? 'Creating…' : 'Register'}</button>
      <p className="muted">Have an account? <Link to="/login">Sign in</Link></p>
    </form>
  );
}
