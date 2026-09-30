import { request } from './client';
import type { AdminUser, AuthUser, Permission, Role, UserPage } from './types';

interface Session {
  user: AuthUser;
  accessToken: string;
}

export const authApi = {
  login: (email: string, password: string) =>
    request<Session>('/auth/login', { method: 'POST', json: { email, password }, skipRefresh: true }),
  register: (input: { email: string; password: string; firstName?: string; lastName?: string }) =>
    request<{ user: AuthUser }>('/auth/register', { method: 'POST', json: input, skipRefresh: true }),
  logout: () => request('/auth/logout', { method: 'POST', skipRefresh: true }),
  logoutAll: () => request('/auth/logout-all', { method: 'POST' }),
  me: () => request<{ user: AuthUser }>('/auth/me').then((d) => d.user),
  changePassword: (currentPassword: string, newPassword: string) =>
    request('/auth/change-password', { method: 'POST', json: { currentPassword, newPassword } }),
};

export const usersApi = {
  list: (p: { page: number; pageSize: number; search?: string }) => {
    const q = new URLSearchParams({ page: String(p.page), pageSize: String(p.pageSize) });
    if (p.search) q.set('search', p.search);
    return request<UserPage>(`/users?${q}`);
  },
  update: (id: string, json: { firstName?: string; lastName?: string; isActive?: boolean }) =>
    request<{ user: AdminUser }>(`/users/${id}`, { method: 'PATCH', json }).then((d) => d.user),
  remove: (id: string) => request(`/users/${id}`, { method: 'DELETE' }),
  assignRoles: (id: string, roleIds: string[]) =>
    request<{ user: AdminUser }>(`/users/${id}/roles`, { method: 'PUT', json: { roleIds } }).then(
      (d) => d.user,
    ),
};

export const rolesApi = {
  list: () => request<{ roles: Role[] }>('/roles').then((d) => d.roles),
  create: (json: { name: string; description?: string }) =>
    request<{ role: Role }>('/roles', { method: 'POST', json }).then((d) => d.role),
  update: (id: string, json: { name?: string; description?: string }) =>
    request<{ role: Role }>(`/roles/${id}`, { method: 'PATCH', json }).then((d) => d.role),
  remove: (id: string) => request(`/roles/${id}`, { method: 'DELETE' }),
  assignPermissions: (id: string, permissionIds: string[]) =>
    request<{ role: Role }>(`/roles/${id}/permissions`, { method: 'PUT', json: { permissionIds } }).then(
      (d) => d.role,
    ),
};

export const permissionsApi = {
  list: () => request<{ permissions: Permission[] }>('/permissions').then((d) => d.permissions),
  create: (json: { name: string; resource: string; action: string; description?: string }) =>
    request<{ permission: Permission }>('/permissions', { method: 'POST', json }).then(
      (d) => d.permission,
    ),
  remove: (id: string) => request(`/permissions/${id}`, { method: 'DELETE' }),
};
