import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { permissionsApi } from '../api/endpoints';
import { useAuth } from '../auth/AuthContext';
import { ErrorMessage, Field } from '../components/ui';

export function Permissions() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const perms = useQuery({ queryKey: ['permissions'], queryFn: permissionsApi.list });
  const [resource, setResource] = useState('');
  const [action, setAction] = useState('');
  const [description, setDescription] = useState('');
  const invalidate = () => qc.invalidateQueries({ queryKey: ['permissions'] });

  const create = useMutation({
    mutationFn: () =>
      permissionsApi.create({
        name: `${resource}:${action}`,
        resource,
        action,
        description: description || undefined,
      }),
    onSuccess: () => {
      setResource('');
      setAction('');
      setDescription('');
      invalidate();
    },
  });
  const remove = useMutation({ mutationFn: permissionsApi.remove, onSuccess: invalidate });
  const canWrite = hasPermission('roles:write');

  const submit = (e: FormEvent) => {
    e.preventDefault();
    create.mutate();
  };

  return (
    <>
      <h2>Permissions</h2>
      {canWrite && (
        <form className="card row" onSubmit={submit}>
          <Field label="Resource"><input value={resource} onChange={(e) => setResource(e.target.value)} required maxLength={50} /></Field>
          <Field label="Action"><input value={action} onChange={(e) => setAction(e.target.value)} required maxLength={50} /></Field>
          <Field label="Description"><input value={description} onChange={(e) => setDescription(e.target.value)} maxLength={255} /></Field>
          <button className="btn" disabled={create.isPending}>Create</button>
        </form>
      )}
      <ErrorMessage error={perms.error ?? create.error ?? remove.error} />
      <div className="card table-wrap">
        <table>
          <thead><tr><th>Name</th><th>Resource</th><th>Action</th><th>Description</th><th /></tr></thead>
          <tbody>
            {perms.data?.map((p) => (
              <tr key={p.id}>
                <td><code>{p.name}</code></td>
                <td>{p.resource}</td>
                <td>{p.action}</td>
                <td>{p.description}</td>
                <td className="actions">
                  {canWrite && (
                    <button className="btn danger" onClick={() => confirm(`Delete ${p.name}?`) && remove.mutate(p.id)}>
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
