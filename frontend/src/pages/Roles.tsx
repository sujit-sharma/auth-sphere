import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { permissionsApi, rolesApi } from '../api/endpoints';
import type { Role } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ErrorMessage, Field, Modal } from '../components/ui';

export function Roles() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const roles = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list });
  const [editing, setEditing] = useState<Role | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const invalidate = () => qc.invalidateQueries({ queryKey: ['roles'] });

  const create = useMutation({
    mutationFn: () => rolesApi.create({ name, description: description || undefined }),
    onSuccess: () => {
      setName('');
      setDescription('');
      invalidate();
    },
  });
  const remove = useMutation({ mutationFn: rolesApi.remove, onSuccess: invalidate });
  const canWrite = hasPermission('roles:write');
  const canDelete = hasPermission('roles:delete');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };

  return (
    <>
      <h2>Roles</h2>
      {canWrite && (
        <form className="card row" onSubmit={submit}>
          <Field label="Name"><input value={name} onChange={(e) => setName(e.target.value)} required maxLength={50} /></Field>
          <Field label="Description"><input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={255} /></Field>
          <button className="btn" disabled={create.isPending}>Create role</button>
        </form>
      )}
      <ErrorMessage error={roles.error ?? create.error ?? remove.error} />
      {roles.data?.map((r) => (
        <div key={r.id} className="card">
          <div className="row">
            <h3>{r.name}</h3>
            <span className="muted">{r.description}</span>
            <span className="spacer" />
            {canWrite && <button className="btn secondary" onClick={() => setEditing(r)}>Permissions</button>}
            {canDelete && (
              <button className="btn danger" onClick={() => confirm(`Delete role ${r.name}?`) && remove.mutate(r.id)}>
                Delete
              </button>
            )}
          </div>
          <div className="chips">
            {r.permissions.length ? r.permissions.map((p) => <span key={p.id} className="chip">{p.name}</span>) : <span className="muted">No permissions</span>}
          </div>
        </div>
      ))}
      {editing && <PermissionsModal role={editing} onClose={() => setEditing(null)} onSaved={invalidate} />}
    </>
  );
}

function PermissionsModal({ role, onClose, onSaved }: { role: Role; onClose: () => void; onSaved: () => void }) {
  const perms = useQuery({ queryKey: ['permissions'], queryFn: permissionsApi.list });
  const [selected, setSelected] = useState(new Set(role.permissions.map((p) => p.id)));
  const save = useMutation({
    mutationFn: () => rolesApi.assignPermissions(role.id, [...selected]),
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });

  return (
    <Modal title={`Permissions for ${role.name}`} onClose={onClose}>
      <ErrorMessage error={perms.error ?? save.error} />
      {perms.data?.map((p) => (
        <label key={p.id} className="check">
          <input
            type="checkbox"
            checked={selected.has(p.id)}
            onChange={(e) => {
              const next = new Set(selected);
              if (e.target.checked) next.add(p.id); else next.delete(p.id);
              setSelected(next);
            }}
          />
          {p.name} <span className="muted">{p.description}</span>
        </label>
      ))}
      <p className="muted">At least one permission is required.</p>
      <button className="btn" disabled={selected.size === 0 || save.isPending} onClick={() => save.mutate()}>Save</button>
    </Modal>
  );
}
