import type { ReactNode } from 'react';
import { ApiError } from '../api/client';

export function ErrorMessage({ error }: { error: unknown }) {
  if (!error) return null;
  const message = error instanceof Error ? error.message : 'Something went wrong';
  const details = error instanceof ApiError ? error.details : undefined;
  return (
    <div className="alert" role="alert">
      {message}
      {Array.isArray(details) && (
        <ul>
          {details.map((d: { path?: string; message?: string }, i) => (
            <li key={i}>
              {d.path ? `${d.path}: ` : ''}
              {d.message ?? JSON.stringify(d)}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

export function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: ReactNode }) {
  return (
    <div className="backdrop" onClick={onClose}>
      <div className="modal card" onClick={(e) => e.stopPropagation()}>
        <div className="row">
          <h3>{title}</h3>
          <span className="spacer" />
          <button className="btn secondary" onClick={onClose}>Close</button>
        </div>
        {children}
      </div>
    </div>
  );
}
