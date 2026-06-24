'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { formatZAR, formatDate } from '@/lib/format';
import Spinner from '@/components/Spinner';
import type { Order } from '@/types';

const STATUS_TONE: Record<string, string> = {
  Paid: 'bg-emerald-500/15 text-emerald-300',
  Pending: 'bg-amber-500/15 text-amber-300',
  Shipped: 'bg-sky-500/15 text-sky-300',
  Delivered: 'bg-emerald-500/15 text-emerald-300',
  Cancelled: 'bg-blood/15 text-blood',
  Refunded: 'bg-ash/15 text-ash'
};

function AccountInner() {
  const router = useRouter();
  const { isAuthenticated, fullName, email, clear } = useAuthStore();
  const resetCart = useCartStore((s) => s.reset);

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?redirect=/account');
      return;
    }
    let active = true;
    (async () => {
      try {
        const { data } = await api.get<Order[]>('/orders');
        if (active) setOrders(data);
      } catch (err) {
        if (active) setError(apiError(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isAuthenticated, router]);

  function logout() {
    clear();
    resetCart();
    router.push('/');
  }

  if (!isAuthenticated) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-4xl font-extrabold">{fullName ?? 'Your account'}</h1>
          <p className="text-ash mt-1">{email}</p>
        </div>
        <button className="btn-ghost inline-flex items-center gap-2" onClick={logout}>
          <LogOut size={16} /> Sign out
        </button>
      </div>

      <h2 className="label-caps text-ash mt-12">Order history</h2>

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : error ? (
        <p className="text-blood mt-4 text-sm">{error}</p>
      ) : orders.length === 0 ? (
        <div className="card mt-4 p-8 text-center">
          <p className="text-ash">No orders yet.</p>
          <Link href="/shop" className="btn-primary mt-5 inline-flex">
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-4 space-y-4">
          {orders.map((o) => (
            <li key={o.id} className="card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{o.number}</p>
                  <p className="text-ash text-sm">{formatDate(o.createdAt)}</p>
                </div>
                <span
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${
                    STATUS_TONE[o.status] ?? 'bg-ash/15 text-ash'
                  }`}
                >
                  {o.status}
                </span>
              </div>
              <ul className="mt-4 space-y-1 border-t border-white/10 pt-4 text-sm">
                {o.items.map((it, idx) => (
                  <li key={idx} className="flex justify-between gap-3">
                    <span className="text-ash">
                      {it.name} × {it.quantity}
                    </span>
                    <span>{formatZAR(it.lineTotal)}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex justify-between border-t border-white/10 pt-3 font-bold">
                <span>Total</span>
                <span>{formatZAR(o.total)}</span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense fallback={null}>
      <AccountInner />
    </Suspense>
  );
}
