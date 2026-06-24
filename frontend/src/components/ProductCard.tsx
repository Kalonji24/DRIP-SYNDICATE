'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Star } from 'lucide-react';
import { formatZAR } from '@/lib/format';
import type { ProductListItem } from '@/types';

const FALLBACK = 'https://picsum.photos/seed/drip/600/750';

export default function ProductCard({ product }: { product: ProductListItem }) {
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden bg-carbon">
        <Image
          src={product.primaryImageUrl || FALLBACK}
          alt={product.name}
          fill
          sizes="(max-width: 768px) 50vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {product.isFeatured && (
          <span className="absolute top-3 left-3 bg-blood text-bone label-caps px-2 py-1">
            Drop
          </span>
        )}
      </div>
      <div className="pt-3">
        <h3 className="font-semibold leading-tight group-hover:text-blood transition-colors">
          {product.name}
        </h3>
        <div className="mt-1 flex items-center justify-between">
          <span className="text-bone">{formatZAR(product.price)}</span>
          {product.ratingCount > 0 && (
            <span className="flex items-center gap-1 text-ash text-sm">
              <Star size={14} className="fill-blood text-blood" />
              {product.ratingAverage.toFixed(1)}
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
