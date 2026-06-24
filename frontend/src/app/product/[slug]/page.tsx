import { notFound } from 'next/navigation';
import Image from 'next/image';
import { Star } from 'lucide-react';
import type { Metadata } from 'next';
import { getJsonOrNull, getJson } from '@/lib/server-api';
import { formatZAR, formatDate } from '@/lib/format';
import ProductActions from './ProductActions';
import type { ProductDetail, Review } from '@/types';

export const revalidate = 30;

export async function generateMetadata({
  params
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getJsonOrNull<ProductDetail>(`/products/${slug}`);
  if (!product) return { title: 'Not found' };
  return {
    title: product.name,
    description: product.description ?? `${product.name} — DRIP Syndicate`
  };
}

export default async function ProductPage({
  params
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const product = await getJsonOrNull<ProductDetail>(`/products/${slug}`);
  if (!product) notFound();

  const reviews = await getJson<Review[]>(`/products/${product.id}/reviews`, []);
  const gallery = product.images.length
    ? product.images
    : [{ id: 'fallback', url: 'https://picsum.photos/seed/drip/900/1100', thumbnailUrl: null, position: 0, alt: product.name }];

  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="grid lg:grid-cols-2 gap-10">
        {/* Gallery */}
        <div className="grid grid-cols-1 gap-3">
          {gallery.map((img) => (
            <div key={img.id} className="relative aspect-[4/5] bg-carbon overflow-hidden">
              <Image
                src={img.url}
                alt={img.alt ?? product.name}
                fill
                sizes="(max-width: 1024px) 100vw, 50vw"
                className="object-cover"
                priority={img.position === 0}
              />
            </div>
          ))}
        </div>

        {/* Info + actions */}
        <div className="lg:sticky lg:top-28 self-start">
          <p className="label-caps text-blood">{product.categoryName}</p>
          <h1 className="font-display text-4xl font-extrabold mt-2">{product.name}</h1>

          <div className="mt-3 flex items-center gap-3">
            <span className="text-2xl">{formatZAR(product.price)}</span>
            {product.ratingCount > 0 && (
              <span className="flex items-center gap-1 text-ash text-sm">
                <Star size={15} className="fill-blood text-blood" />
                {product.ratingAverage.toFixed(1)} ({product.ratingCount})
              </span>
            )}
          </div>

          {product.description && (
            <p className="mt-5 text-ash leading-relaxed">{product.description}</p>
          )}

          <ProductActions product={product} />
        </div>
      </div>

      {/* Reviews */}
      <section className="mt-20 border-t border-bone/10 pt-10">
        <h2 className="font-display text-2xl font-bold mb-6">
          Reviews {reviews.length > 0 && <span className="text-ash">({reviews.length})</span>}
        </h2>
        {reviews.length === 0 ? (
          <p className="text-ash">No reviews yet. Be the first after your drop lands.</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {reviews.map((r) => (
              <div key={r.id} className="card p-5">
                <div className="flex items-center justify-between">
                  <div className="flex gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star
                        key={i}
                        size={14}
                        className={i < r.rating ? 'fill-blood text-blood' : 'text-bone/20'}
                      />
                    ))}
                  </div>
                  {r.verifiedPurchase && (
                    <span className="label-caps text-green-500">Verified</span>
                  )}
                </div>
                {r.title && <p className="font-semibold mt-2">{r.title}</p>}
                {r.body && <p className="text-ash mt-1 text-sm">{r.body}</p>}
                <p className="text-ash/60 text-xs mt-3">
                  {r.author} · {formatDate(r.createdAt)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
