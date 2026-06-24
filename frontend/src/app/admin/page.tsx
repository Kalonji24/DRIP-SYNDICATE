'use client';

import { useEffect, useState } from 'react';
import {
  Boxes,
  DollarSign,
  Package,
  ShoppingBag,
  TrendingUp,
  Users
} from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { formatZAR } from '@/lib/format';
import Spinner from '@/components/Spinner';
import { AdminHeader } from '@/components/admin/ui';
import type { AdminAnalytics } from '@/types';

export default function AdminDashboard() {
  const [data, setData] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    (async () => {
      try {
        const res = await api.get<AdminAnalytics>('/admin/analytics/summary');
        if (active) setData(res.data);
      } catch (err) {
        if (active) setError(apiError(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    );
  }
  if (error || !data) {
    return <p className="text-blood text-sm">{error ?? 'Failed to load analytics.'}</p>;
  }

  const cards = [
    { label: 'Revenue', value: formatZAR(data.revenue), icon: DollarSign },
    { label: 'Orders', value: data.orderCount.toString(), icon: ShoppingBag },
    { label: 'Avg order value', value: formatZAR(data.averageOrderValue), icon: TrendingUp },
    { label: 'Customers', value: data.customers.toString(), icon: Users },
    { label: 'Products', value: data.products.toString(), icon: Package },
    { label: 'Low stock', value: data.lowStock.toString(), icon: Boxes }
  ];

  const maxRevenue = Math.max(1, ...data.revenueByDay.map((d) => d.revenue));

  return (
    <div>
      <AdminHeader title="Dashboard" subtitle="Trading snapshot for the last 30 days." />

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        {cards.map((c) => (
          <div key={c.label} className="card p-5">
            <div className="text-ash flex items-center gap-2">
              <c.icon size={16} />
              <span className="label-caps">{c.label}</span>
            </div>
            <p className="mt-3 font-display text-2xl font-extrabold">{c.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <div className="card p-6">
          <h2 className="font-display text-lg font-bold">Revenue by day</h2>
          {data.revenueByDay.length === 0 ? (
            <p className="text-ash mt-4 text-sm">No sales in the last 30 days.</p>
          ) : (
            <div className="mt-6 flex h-48 items-end gap-1">
              {data.revenueByDay.map((d) => (
                <div key={d.date} className="group flex flex-1 flex-col items-center justify-end">
                  <div
                    className="bg-blood/70 group-hover:bg-blood w-full rounded-t transition-all"
                    style={{ height: `${(d.revenue / maxRevenue) * 100}%` }}
                    title={`${d.date.slice(0, 10)} · ${formatZAR(d.revenue)}`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="card p-6">
          <h2 className="font-display text-lg font-bold">Top products</h2>
          {data.topProducts.length === 0 ? (
            <p className="text-ash mt-4 text-sm">No orders yet.</p>
          ) : (
            <ul className="mt-4 divide-y divide-white/10">
              {data.topProducts.map((p) => (
                <li key={p.product} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-medium">{p.product}</p>
                    <p className="text-ash text-xs">{p.units} sold</p>
                  </div>
                  <span className="font-semibold">{formatZAR(p.revenue)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
