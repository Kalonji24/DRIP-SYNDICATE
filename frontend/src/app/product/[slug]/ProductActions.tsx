'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Heart, ShoppingBag, Check } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';
import { formatZAR } from '@/lib/format';
import type { ProductDetail, Variant } from '@/types';

export default function ProductActions({ product }: { product: ProductDetail }) {
  const router = useRouter();
  const { isAuthenticated } = useAuthStore();
  const { add } = useCartStore();

  const inStock = product.variants.filter((v) => v.available > 0);
  const [variant, setVariant] = useState<Variant | null>(inStock[0] ?? null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleAdd() {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/product/${product.slug}`);
      return;
    }
    if (!variant) return;
    setBusy(true);
    setError(null);
    try {
      await add(variant.id, 1);
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function handleWishlist() {
    if (!isAuthenticated) {
      router.push(`/login?redirect=/product/${product.slug}`);
      return;
    }
    try {
      await api.post('/wishlist/items', { productId: product.id });
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <div className="mt-7">
      {/* Variant picker */}
      {product.variants.length > 0 && (
        <div className="mb-5">
          <p className="label-caps text-ash mb-2">Select size</p>
          <div className="flex flex-wrap gap-2">
            {product.variants.map((v) => {
              const disabled = v.available <= 0;
              const active = variant?.id === v.id;
              return (
                <button
                  key={v.id}
                  disabled={disabled}
                  onClick={() => setVariant(v)}
                  className={`px-4 py-2 border text-sm font-semibold transition-colors ${
                    active ? 'border-blood text-blood' : 'border-bone/20 hover:border-bone'
                  } ${disabled ? 'opacity-30 line-through cursor-not-allowed' : ''}`}
                >
                  {v.size ?? v.sku}
                </button>
              );
            })}
          </div>
          {variant && (
            <p className="text-ash text-sm mt-2">
              {formatZAR(variant.price)} ·{' '}
              {variant.available > 0 ? `${variant.available} left` : 'Sold out'}
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3">
        <button
          onClick={handleAdd}
          disabled={busy || !variant}
          className="btn-primary flex-1"
        >
          {done ? (
            <>
              <Check size={18} /> Added
            </>
          ) : (
            <>
              <ShoppingBag size={18} /> Add to cart
            </>
          )}
        </button>
        <button onClick={handleWishlist} className="btn-ghost" aria-label="Add to wishlist">
          <Heart size={18} />
        </button>
      </div>

      {error && <p className="text-blood text-sm mt-3">{error}</p>}
    </div>
  );
}
