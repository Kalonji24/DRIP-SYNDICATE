'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCartStore } from '@/store/cart';
import { useAuthStore } from '@/store/auth';
import { formatZAR } from '@/lib/format';
import Spinner from '@/components/Spinner';

export default function CartPage() {
  const { isAuthenticated } = useAuthStore();
  const { cart, loading, error, fetch, update, remove } = useCartStore();

  useEffect(() => {
    if (isAuthenticated) fetch();
  }, [isAuthenticated, fetch]);

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-extrabold">Your cart</h1>
        <p className="text-ash mt-3">Sign in to view the items in your cart.</p>
        <Link href="/login?redirect=/cart" className="btn-primary mt-8 inline-flex">
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

  const items = cart?.items ?? [];

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-extrabold">Your cart is empty</h1>
        <p className="text-ash mt-3">No drops in the bag yet.</p>
        <Link href="/shop" className="btn-primary mt-8 inline-flex">
          Shop the latest
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-4xl font-extrabold">Your cart</h1>
      {error && <p className="text-blood mt-4 text-sm">{error}</p>}

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_320px]">
        <ul className="divide-y divide-white/10">
          {items.map((item) => (
            <li key={item.id} className="flex gap-4 py-5">
              <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-lg bg-carbon">
                <Image
                  src={item.imageUrl ?? `https://picsum.photos/seed/${item.productVariantId}/200`}
                  alt={item.productName}
                  fill
                  sizes="96px"
                  className="object-cover"
                />
              </div>

              <div className="flex flex-1 flex-col">
                <div className="flex justify-between gap-4">
                  <div>
                    <p className="font-semibold">{item.productName}</p>
                    <p className="text-ash text-sm">
                      {[item.size, item.color].filter(Boolean).join(' · ') || 'One size'}
                    </p>
                  </div>
                  <p className="font-semibold">{formatZAR(item.lineTotal)}</p>
                </div>

                <div className="mt-auto flex items-center justify-between pt-3">
                  <div className="flex items-center gap-3">
                    <button
                      aria-label="Decrease quantity"
                      className="btn-ghost h-8 w-8 p-0"
                      disabled={item.quantity <= 1}
                      onClick={() => update(item.id, item.quantity - 1)}
                    >
                      <Minus size={16} />
                    </button>
                    <span className="w-6 text-center tabular-nums">{item.quantity}</span>
                    <button
                      aria-label="Increase quantity"
                      className="btn-ghost h-8 w-8 p-0"
                      disabled={item.quantity >= 10}
                      onClick={() => update(item.id, item.quantity + 1)}
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <button
                    className="text-ash hover:text-blood inline-flex items-center gap-1 text-sm"
                    onClick={() => remove(item.id)}
                  >
                    <Trash2 size={15} /> Remove
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>

        <aside className="card h-fit p-6">
          <h2 className="label-caps text-ash">Order summary</h2>
          <div className="mt-4 flex justify-between text-sm">
            <span className="text-ash">Subtotal</span>
            <span className="font-semibold">{formatZAR(cart?.subtotal ?? 0)}</span>
          </div>
          <p className="text-ash mt-2 text-xs">
            VAT (15%) and shipping are calculated at checkout.
          </p>
          <Link href="/checkout" className="btn-primary mt-6 w-full">
            Checkout
          </Link>
          <Link href="/shop" className="btn-ghost mt-3 w-full">
            Continue shopping
          </Link>
        </aside>
      </div>
    </div>
  );
}
