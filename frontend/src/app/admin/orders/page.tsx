'use client';

import { useCallback, useEffect, useState } from 'react';
import { api, apiError } from '@/lib/api';
import { formatZAR, formatDate } from '@/lib/format';
import Spinner from '@/components/Spinner';
import { AdminHeader, Badge } from '@/components/admin/ui';
import type { AdminOrderRow, AdminPaged } from '@/types';
import { ORDER_STATUS } from '@/types';

const TONE = [
  'bg-ash/15 text-ash', // Created
  'bg-emerald-500/15 text-emerald-300', // Paid
  'bg-sky-500/15 text-sky-300', // Fulfilled
  'bg-sky-500/15 text-sky-300', // Shipped
  'bg-emerald-500/15 text-emerald-300', // Delivered
  'bg-blood/15 text-blood', // Cancelled
  'bg-amber-500/15 text-amber-300', // Refunded
  'bg-amber-500/15 text-amber-300' // Returned
];

export default function AdminOrdersPage() {
  const [rows, setRows] = useState<AdminOrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<number | ''>('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const qs = filter === '' ? '' : `&status=${filter}`;
      const { data } = await api.get<AdminPaged<AdminOrderRow>>(
        `/admin/orders?pageSize=100${qs}`
      );
      setRows(data.items);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  async function setStatus(id: string, status: number) {
    try {
      await api.patch(`/admin/orders/${id}/status`, { status });
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <div>
      <AdminHeader
        title="Orders"
        subtitle="Manage fulfilment and order status."
        action={
          <select
            className="input w-auto"
            value={filter}
            onChange={(e) => setFilter(e.target.value === '' ? '' : Number(e.target.value))}
          >
            <option value="">All statuses</option>
            {ORDER_STATUS.map((s, i) => (
              <option key={s} value={i}>
                {s}
              </option>
            ))}
          </select>
        }
      />
      {error && <p className="text-blood mb-4 text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-32">
          <Spinner />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-ash border-b border-white/10">
              <tr>
                <th className="px-4 py-3 font-medium">Order</th>
                <th className="px-4 py-3 font-medium">Customer</th>
                <th className="px-4 py-3 font-medium">Date</th>
                <th className="px-4 py-3 font-medium">Total</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {rows.map((o) => (
                <tr key={o.id} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{o.number}</td>
                  <td className="text-ash px-4 py-3">{o.email}</td>
                  <td className="text-ash px-4 py-3">{formatDate(o.createdAt)}</td>
                  <td className="px-4 py-3">{formatZAR(o.total)}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Badge tone={TONE[o.status] ?? TONE[0]}>{ORDER_STATUS[o.status]}</Badge>
                      <select
                        className="input h-8 w-auto py-0 text-xs"
                        value={o.status}
                        onChange={(e) => setStatus(o.id, Number(e.target.value))}
                      >
                        {ORDER_STATUS.map((s, i) => (
                          <option key={s} value={i}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-ash px-4 py-10 text-center">
                    No orders found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
