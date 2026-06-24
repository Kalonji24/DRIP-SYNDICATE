'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { api, apiError } from '@/lib/api';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { formatZAR } from '@/lib/format';
import Spinner from '@/components/Spinner';
import type { CheckoutAddress, Order } from '@/types';

const VAT_RATE = 0.15;
const SHIPPING = 99;

const EMPTY: CheckoutAddress = {
  fullName: '',
  email: '',
  line1: '',
  line2: '',
  city: '',
  postalCode: '',
  country: 'South Africa'
};

export default function CheckoutPage() {
  const router = useRouter();
  const { isAuthenticated, email, fullName } = useAuthStore();
  const { cart, loading, fetch, reset } = useCartStore();

  const [address, setAddress] = useState<CheckoutAddress>(EMPTY);
  const [paymentMethod, setPaymentMethod] = useState('payfast');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isAuthenticated) fetch();
  }, [isAuthenticated, fetch]);

  // Prefill name/email from the session once.
  useEffect(() => {
    setAddress((a) => ({
      ...a,
      fullName: a.fullName || (fullName ?? ''),
      email: a.email || (email ?? '')
    }));
  }, [fullName, email]);

  const totals = useMemo(() => {
    const subtotal = cart?.subtotal ?? 0;
    const tax = Math.round(subtotal * VAT_RATE * 100) / 100;
    const shipping = subtotal > 0 ? SHIPPING : 0;
    return { subtotal, tax, shipping, total: subtotal + tax + shipping };
  }, [cart]);

  function set<K extends keyof CheckoutAddress>(key: K, value: CheckoutAddress[K]) {
    setAddress((a) => ({ ...a, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post<Order>('/orders/checkout', {
        address,
        paymentMethod
      });
      reset();
      router.push(`/account?order=${data.id}`);
    } catch (err) {
      setError(apiError(err, 'Checkout failed. Please review your details and try again.'));
    } finally {
      setBusy(false);
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-extrabold">Checkout</h1>
        <p className="text-ash mt-3">Sign in to complete your order.</p>
        <Link href="/login?redirect=/checkout" className="btn-primary mt-8 inline-flex">
          Sign in
        </Link>
      </div>
    );
  }

  if (loading && !cart) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-extrabold">Nothing to check out</h1>
        <p className="text-ash mt-3">Your cart is empty.</p>
        <Link href="/shop" className="btn-primary mt-8 inline-flex">
          Shop the latest
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-4xl font-extrabold">Checkout</h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_340px]">
        <form onSubmit={submit} className="space-y-4">
          <h2 className="label-caps text-ash">Shipping details</h2>

          <input
            className="input"
            placeholder="Full name"
            value={address.fullName}
            onChange={(e) => set('fullName', e.target.value)}
            required
          />
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={address.email}
            onChange={(e) => set('email', e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="Address line 1"
            value={address.line1}
            onChange={(e) => set('line1', e.target.value)}
            required
          />
          <input
            className="input"
            placeholder="Address line 2 (optional)"
            value={address.line2 ?? ''}
            onChange={(e) => set('line2', e.target.value)}
          />
          <div className="grid grid-cols-2 gap-4">
            <input
              className="input"
              placeholder="City"
              value={address.city}
              onChange={(e) => set('city', e.target.value)}
              required
            />
            <input
              className="input"
              placeholder="Postal code"
              value={address.postalCode}
              onChange={(e) => set('postalCode', e.target.value)}
              required
            />
          </div>
          <input
            className="input"
            placeholder="Country"
            value={address.country}
            onChange={(e) => set('country', e.target.value)}
            required
          />

          <h2 className="label-caps text-ash pt-4">Payment</h2>
          <select
            className="input"
            value={paymentMethod}
            onChange={(e) => setPaymentMethod(e.target.value)}
          >
            <option value="payfast">PayFast</option>
            <option value="yoco">Yoco</option>
            <option value="eft">Manual EFT</option>
          </select>
          <p className="text-ash text-xs">
            This demo records the order as pending payment. Wire your PSP webhook to mark it paid.
          </p>

          {error && <p className="text-blood text-sm">{error}</p>}

          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Placing order…' : `Pay ${formatZAR(totals.total)}`}
          </button>
        </form>

        <aside className="card h-fit p-6">
          <h2 className="label-caps text-ash">Summary</h2>
          <ul className="mt-4 space-y-3">
            {cart.items.map((i) => (
              <li key={i.id} className="flex justify-between gap-3 text-sm">
                <span className="text-ash">
                  {i.productName} × {i.quantity}
                </span>
                <span>{formatZAR(i.lineTotal)}</span>
              </li>
            ))}
          </ul>
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4 text-sm">
            <Row label="Subtotal" value={formatZAR(totals.subtotal)} />
            <Row label="VAT (15%)" value={formatZAR(totals.tax)} />
            <Row label="Shipping" value={formatZAR(totals.shipping)} />
            <div className="flex justify-between pt-2 text-base font-bold">
              <span>Total</span>
              <span>{formatZAR(totals.total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-ash">{label}</span>
      <span>{value}</span>
    </div>
  );
}
