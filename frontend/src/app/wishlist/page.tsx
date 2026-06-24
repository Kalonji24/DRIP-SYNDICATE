'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import { formatZAR } from '@/lib/format';
import Spinner from '@/components/Spinner';
import type { WishlistItem } from '@/types';

export default function WishlistPage() {
  const { isAuthenticated } = useAuthStore();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    let active = true;
    (async () => {
      try {
        const { data } = await api.get<WishlistItem[]>('/wishlist');
        if (active) setItems(data);
      } catch (err) {
        if (active) setError(apiError(err));
      } finally {
        if (active) setLoading(false);
      }
    })();
    return () => {
      active = false;
    };
  }, [isAuthenticated]);

  async function remove(id: string) {
    const prev = items;
    setItems((list) => list.filter((i) => i.id !== id));
    try {
      await api.delete(`/wishlist/items/${id}`);
    } catch (err) {
      setError(apiError(err));
      setItems(prev); // rollback on failure
    }
  }

  if (!isAuthenticated) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-extrabold">Your wishlist</h1>
        <p className="text-ash mt-3">Sign in to save the drops you love.</p>
        <Link href="/login?redirect=/wishlist" className="btn-primary mt-8 inline-flex">
          Sign in
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-24 text-center">
        <h1 className="font-display text-4xl font-extrabold">Your wishlist is empty</h1>
        <p className="text-ash mt-3">Tap the heart on any product to save it here.</p>
        <Link href="/shop" className="btn-primary mt-8 inline-flex">
          Browse drops
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-4xl font-extrabold">Your wishlist</h1>
      {error && <p className="text-blood mt-4 text-sm">{error}</p>}

      <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div key={item.id} className="card group overflow-hidden">
            <Link href={`/product/${item.slug}`} className="relative block aspect-square bg-carbon">
              <Image
                src={item.imageUrl ?? `https://picsum.photos/seed/${item.productId}/500`}
                alt={item.productName}
                fill
                sizes="(max-width:768px) 50vw, 25vw"
                className="object-cover transition group-hover:scale-105"
              />
            </Link>
            <div className="p-4">
              <Link href={`/product/${item.slug}`} className="line-clamp-1 font-semibold">
                {item.productName}
              </Link>
              <div className="mt-2 flex items-center justify-between">
                <span className="font-semibold">{formatZAR(item.price)}</span>
                <button
                  aria-label="Remove from wishlist"
                  className="text-ash hover:text-blood"
                  onClick={() => remove(item.id)}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
