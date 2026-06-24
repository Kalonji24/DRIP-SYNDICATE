'use client';

import { useCallback, useEffect, useState } from 'react';
import { Search } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { formatDate } from '@/lib/format';
import Spinner from '@/components/Spinner';
import { AdminHeader, Badge } from '@/components/admin/ui';
import type { AdminPaged, AdminUserRow } from '@/types';

const ROLES = ['admin', 'support', 'catalog', 'customer'];
const STATUSES = ['active', 'locked', 'deactivated'];

const STATUS_TONE: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-300',
  locked: 'bg-amber-500/15 text-amber-300',
  deactivated: 'bg-blood/15 text-blood'
};

export default function AdminUsersPage() {
  const [rows, setRows] = useState<AdminUserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = q ? `&q=${encodeURIComponent(q)}` : '';
      const { data } = await api.get<AdminPaged<AdminUserRow>>(`/admin/users?pageSize=100${qs}`);
      setRows(data.items);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [q]);

  useEffect(() => {
    load();
  }, [load]);

  async function assignRole(id: string, role: string) {
    if (!role) return;
    try {
      await api.post(`/admin/users/${id}/roles`, { role });
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function setStatus(id: string, status: string) {
    try {
      await api.patch(`/admin/users/${id}/status`, { status });
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <div>
      <AdminHeader title="Users" subtitle="Manage roles and account status." />
      {error && <p className="text-blood mb-4 text-sm">{error}</p>}

      <div className="relative mb-4 max-w-sm">
        <Search className="text-ash absolute left-3 top-1/2 -translate-y-1/2" size={16} />
        <input
          className="input pl-9"
          placeholder="Search name or email"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      {loading ? (
        <div className="flex justify-center py-32">
          <Spinner />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-ash border-b border-white/10">
              <tr>
                <th className="px-4 py-3 font-medium">User</th>
                <th className="px-4 py-3 font-medium">Roles</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Manage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((u) => (
                <tr key={u.id} className="hover:bg-white/5">
                  <td className="px-4 py-3">
                    <p className="font-medium">{u.fullName}</p>
                    <p className="text-ash text-xs">{u.email}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {u.roles.map((r) => (
                        <Badge key={r} tone="bg-white/10 text-bone">
                          {r}
                        </Badge>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge tone={STATUS_TONE[u.status] ?? 'bg-ash/15 text-ash'}>{u.status}</Badge>
                  </td>
                  <td className="text-ash px-4 py-3">{formatDate(u.createdAt)}</td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      <select
                        className="input h-8 w-auto py-0 text-xs"
                        defaultValue=""
                        onChange={(e) => {
                          assignRole(u.id, e.target.value);
                          e.target.value = '';
                        }}
                      >
                        <option value="">+ role</option>
                        {ROLES.map((r) => (
                          <option key={r} value={r}>
                            {r}
                          </option>
                        ))}
                      </select>
                      <select
                        className="input h-8 w-auto py-0 text-xs"
                        value={u.status}
                        onChange={(e) => setStatus(u.id, e.target.value)}
                      >
                        {STATUSES.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
