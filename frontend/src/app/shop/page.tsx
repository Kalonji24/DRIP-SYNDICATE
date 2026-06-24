import Link from 'next/link';
import { getJson } from '@/lib/server-api';
import ProductGrid from '@/components/ProductGrid';
import type { Category, Paged, ProductListItem } from '@/types';

export const revalidate = 30;

const SORTS = [
  ['newest', 'Newest'],
  ['price-asc', 'Price ↑'],
  ['price-desc', 'Price ↓'],
  ['rating', 'Top rated']
] as const;

export default async function ShopPage({
  searchParams
}: {
  searchParams: Promise<{ category?: string; sort?: string; q?: string; page?: string }>;
}) {
  const sp = await searchParams;
  const category = sp.category ?? '';
  const sort = sp.sort ?? 'newest';
  const page = Number(sp.page ?? '1');
  const q = sp.q ?? '';

  const query = new URLSearchParams();
  if (category) query.set('category', category);
  query.set('sort', sort);
  query.set('page', String(page));
  query.set('pageSize', '12');

  const emptyPaged: Paged<ProductListItem> = {
    items: [], page: 1, pageSize: 12, totalCount: 0,
    totalPages: 0, hasNext: false, hasPrevious: false
  };

  // If a search term is present, hit the search endpoint; otherwise the catalog.
  const [categories, data] = await Promise.all([
    getJson<Category[]>('/categories', []),
    q
      ? getJson<ProductListItem[]>(`/search?q=${encodeURIComponent(q)}`, []).then(
          (items): Paged<ProductListItem> => ({
            ...emptyPaged,
            items,
            totalCount: items.length
          })
        )
      : getJson<Paged<ProductListItem>>(`/products?${query.toString()}`, emptyPaged)
  ]);

  const buildHref = (patch: Record<string, string>) => {
    const next = new URLSearchParams();
    if (category) next.set('category', category);
    next.set('sort', sort);
    Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
    return `/shop?${next.toString()}`;
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <header className="mb-8">
        <h1 className="font-display text-4xl font-extrabold">
          {q ? `Results for “${q}”` : category ? category.toUpperCase() : 'All Products'}
        </h1>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-8">
        <Link
          href="/shop"
          className={`label-caps px-3 py-2 border ${
            !category ? 'border-blood text-blood' : 'border-bone/20 text-ash hover:text-bone'
          }`}
        >
          All
        </Link>
        {categories.map((c) => (
          <Link
            key={c.id}
            href={`/shop?category=${c.slug}&sort=${sort}`}
            className={`label-caps px-3 py-2 border ${
              category === c.slug
                ? 'border-blood text-blood'
                : 'border-bone/20 text-ash hover:text-bone'
            }`}
          >
            {c.name}
          </Link>
        ))}

        <div className="ml-auto flex gap-2">
          {SORTS.map(([value, label]) => (
            <Link
              key={value}
              href={buildHref({ sort: value })}
              className={`text-sm px-3 py-2 ${
                sort === value ? 'text-blood' : 'text-ash hover:text-bone'
              }`}
            >
              {label}
            </Link>
          ))}
        </div>
      </div>

      <ProductGrid products={data.items} />

      {/* Pagination */}
      {!q && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-12">
          {data.hasPrevious && (
            <Link href={buildHref({ page: String(page - 1) })} className="btn-ghost">
              Prev
            </Link>
          )}
          <span className="text-ash text-sm">
            Page {data.page} / {data.totalPages}
          </span>
          {data.hasNext && (
            <Link href={buildHref({ page: String(page + 1) })} className="btn-ghost">
              Next
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
