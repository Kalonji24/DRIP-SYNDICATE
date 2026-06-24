import ProductCard from './ProductCard';
import type { ProductListItem } from '@/types';

export default function ProductGrid({ products }: { products: ProductListItem[] }) {
  if (products.length === 0) {
    return <p className="text-ash py-16 text-center">No products found.</p>;
  }
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-x-4 gap-y-8">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} />
      ))}
    </div>
  );
}
