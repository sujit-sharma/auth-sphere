import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { rolesApi, usersApi } from '../api/endpoints';
import type { AdminUser } from '../api/types';
import { useAuth } from '../auth/AuthContext';
import { ErrorMessage, Modal } from '../components/ui';

const PAGE_SIZE = 10;

export function Users() {
  const { hasPermission, user: me } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [editing, setEditing] = useState<AdminUser | null>(null);

  const users = useQuery({
    queryKey: ['users', page, query],
    queryFn: () => usersApi.list({ page, pageSize: PAGE_SIZE, search: query || undefined }),
    placeholderData: (prev) => prev,
  });
  const invalidate = () => qc.invalidateQueries({ queryKey: ['users'] });
  const toggle = useMutation({
    mutationFn: (u: AdminUser) => usersApi.update(u.id, { isActive: !u.isActive }),
    onSuccess: invalidate,
  });
  const remove = useMutation({ mutationFn: usersApi.remove, onSuccess: invalidate });

  const canWrite = hasPermission('users:write');
  const canDelete = hasPermission('users:delete');
  const pages = Math.max(1, Math.ceil((users.data?.total ?? 0) / PAGE_SIZE));

  return (
    <>
      <h2>Users</h2>
      <form
        className="row"
        onSubmit={(e) => {
          e.preventDefault();
          setPage(1);
          setQuery(search);
        }}
      >
        <input placeholder="Search email or name" value={search} onChange={(e) => setSearch(e.target.value)} />
        <button className="btn">Search</button>
      </form>
      <ErrorMessage error={users.error ?? toggle.error ?? remove.error} />
      <div className="card table-wrap">
        <table>
          <thead>
            <tr><th>Email</th><th>Name</th><th>Roles</th><th>Status</th><th>Last login</th><th /></tr>
          </thead>
          <tbody>
            {users.data?.users.map((u) => (
              <tr key={u.id}>
                <td>{u.email}</td>
                <td>{[u.firstName, u.lastName].filter(Boolean).join(' ') || '—'}</td>
                <td>{u.roles.map((r) => <span key={r.role.id} className="chip">{r.role.name}</span>)}</td>
                <td>{u.isActive ? 'Active' : 'Disabled'}</td>
                <td>{u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleString() : '—'}</td>
                <td className="actions">
                  {canWrite && <button className="btn secondary" onClick={() => setEditing(u)}>Roles</button>}
                  {canWrite && u.id !== me?.id && (
                    <button className="btn secondary" onClick={() => toggle.mutate(u)}>
                      {u.isActive ? 'Disable' : 'Enable'}
                    </button>
                  )}
                  {canDelete && u.id !== me?.id && (
                    <button
                      className="btn danger"
                      onClick={() => confirm(`Delete ${u.email}?`) && remove.mutate(u.id)}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {users.isLoading && <p className="muted">Loading…</p>}
      </div>
      <div className="row">
        <button className="btn secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span className="muted">Page {page} of {pages}</span>
        <button className="btn secondary" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</button>
      </div>
      {editing && <RolesModal user={editing} onClose={() => setEditing(null)} onSaved={invalidate} />}
    </>
  );
}

function RolesModal({ user, onClose, onSaved }: { user: AdminUser; onClose: () => void; onSaved: () => void }) {
  const roles = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list });
  const [selected, setSelected] = useState(new Set(user.roles.map((r) => r.role.id)));
  const save = useMutation({
    mutationFn: () => usersApi.assignRoles(user.id, [...selected]),
    onSuccess: () => {
      onSaved();
      onClose();
    },
  });

  return (
    <Modal title={`Roles for ${user.email}`} onClose={onClose}>
      <ErrorMessage error={roles.error ?? save.error} />
      {roles.data?.map((r) => (
        <label key={r.id} className="check">
          <input
            type="checkbox"
            checked={selected.has(r.id)}
            onChange={(e) => {
              const next = new Set(selected);
              if (e.target.checked) next.add(r.id); else next.delete(r.id);
              setSelected(next);
            }}
          />
          {r.name} <span className="muted">{r.description}</span>
        </label>
      ))}
      <p className="muted">At least one role is required.</p>
      <button className="btn" disabled={selected.size === 0 || save.isPending} onClick={() => save.mutate()}>Save</button>
    </Modal>
  );
}
