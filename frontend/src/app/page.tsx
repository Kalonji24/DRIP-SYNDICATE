import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { getJson } from '@/lib/server-api';
import ProductGrid from '@/components/ProductGrid';
import type { Banner, Paged, ProductListItem } from '@/types';

export const revalidate = 60;

export default async function HomePage() {
  const [banners, featured] = await Promise.all([
    getJson<Banner[]>('/banners', []),
    getJson<Paged<ProductListItem>>('/products?featured=true&pageSize=8', {
      items: [], page: 1, pageSize: 8, totalCount: 0,
      totalPages: 0, hasNext: false, hasPrevious: false
    })
  ]);

  const hero = banners[0];

  return (
    <>
      {/* HERO */}
      <section className="relative h-[78vh] min-h-[520px] flex items-end overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `linear-gradient(to top, rgba(11,11,15,0.95), rgba(11,11,15,0.25)), url(${
              hero?.imageUrl ??
              'https://images.unsplash.com/photo-1523398002811-999ca8dec234?w=1600&q=80'
            })`
          }}
        />
        <div className="relative mx-auto max-w-7xl px-4 pb-16 w-full">
          <span className="label-caps text-blood">{hero?.subtitle ?? 'Drop 001 — Live now'}</span>
          <h1 className="font-display text-5xl md:text-7xl font-extrabold leading-[0.95] mt-3 max-w-3xl">
            {hero?.title ?? 'STREET. POWER. IDENTITY.'}
          </h1>
          <div className="mt-8 flex gap-4">
            <Link href="/shop" className="btn-primary">
              Shop the drop <ArrowRight size={18} />
            </Link>
            <Link href="/shop?category=sneakers" className="btn-ghost">
              Sneakers
            </Link>
          </div>
        </div>
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-4 py-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-3xl font-extrabold">The Drop</h2>
          <Link href="/shop" className="label-caps text-ash hover:text-blood flex items-center gap-1">
            View all <ArrowRight size={14} />
          </Link>
        </div>
        <ProductGrid products={featured.items} />
      </section>

      {/* MANIFESTO */}
      <section className="border-y border-bone/10 bg-carbon">
        <div className="mx-auto max-w-7xl px-4 py-16 grid md:grid-cols-3 gap-8">
          {[
            ['Sealed runs', 'Every drop is a fixed quantity. When it’s gone, it’s gone — no restocks.'],
            ['Built in SA', 'Designed and shipped from Cape Town. Priced in Rand, made for the streets.'],
            ['Members first', 'Drop access, early reservations and queue priority for the Syndicate.']
          ].map(([t, d]) => (
            <div key={t}>
              <h3 className="font-display text-xl font-bold text-blood">{t}</h3>
              <p className="mt-2 text-ash">{d}</p>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
