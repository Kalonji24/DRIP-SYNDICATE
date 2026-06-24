'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertTriangle, Minus, Plus } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { formatZAR } from '@/lib/format';
import Spinner from '@/components/Spinner';
import { AdminHeader, Badge } from '@/components/admin/ui';
import type { AdminPaged, AdminProductRow } from '@/types';

const LOW_STOCK = 10;

interface InvRow {
  variantId: string;
  productName: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  price: number;
  stockOnHand: number;
  available: number;
}

export default function AdminInventoryPage() {
  const [rows, setRows] = useState<InvRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [onlyLow, setOnlyLow] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<AdminPaged<AdminProductRow>>('/admin/products?pageSize=100');
      // Hydrate each product to read its variants (admin product detail includes variants).
      const detailed = await Promise.all(
        data.items.map((p) => api.get(`/admin/products/${p.id}`).then((r) => r.data))
      );
      const flat: InvRow[] = detailed.flatMap((p: any) =>
        (p.variants ?? []).map((v: any) => ({
          variantId: v.id,
          productName: p.name,
          sku: v.sku,
          size: v.size,
          color: v.color,
          price: v.price,
          stockOnHand: v.stockOnHand,
          available: v.available
        }))
      );
      flat.sort((a, b) => a.available - b.available);
      setRows(flat);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function adjust(variantId: string, delta: number) {
    try {
      await api.post(`/admin/products/variants/${variantId}/stock`, { delta, reason: 'inventory' });
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  const view = onlyLow ? rows.filter((r) => r.available < LOW_STOCK) : rows;
  const lowCount = rows.filter((r) => r.available < LOW_STOCK).length;

  return (
    <div>
      <AdminHeader
        title="Inventory"
        subtitle={`${rows.length} variants · ${lowCount} low on stock`}
        action={
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={onlyLow}
              onChange={(e) => setOnlyLow(e.target.checked)}
            />
            Low stock only
          </label>
        }
      />
      {error && <p className="text-blood mb-4 text-sm">{error}</p>}

      {loading ? (
        <div className="flex justify-center py-32">
          <Spinner />
        </div>
      ) : (
        <div className="card overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-ash border-b border-white/10">
              <tr>
                <th className="px-4 py-3 font-medium">Product</th>
                <th className="px-4 py-3 font-medium">Variant</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Price</th>
                <th className="px-4 py-3 font-medium">Available</th>
                <th className="px-4 py-3 text-right font-medium">Adjust</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {view.map((r) => (
                <tr key={r.variantId} className="hover:bg-white/5">
                  <td className="px-4 py-3 font-medium">{r.productName}</td>
                  <td className="text-ash px-4 py-3">
                    {[r.size, r.color].filter(Boolean).join(' / ') || '—'}
                  </td>
                  <td className="text-ash px-4 py-3">{r.sku}</td>
                  <td className="px-4 py-3">{formatZAR(r.price)}</td>
                  <td className="px-4 py-3">
                    {r.available < LOW_STOCK ? (
                      <Badge tone="bg-blood/15 text-blood">
                        <span className="inline-flex items-center gap-1">
                          <AlertTriangle size={12} /> {r.available}
                        </span>
                      </Badge>
                    ) : (
                      <span>{r.available}</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button className="btn-ghost h-7 px-2" onClick={() => adjust(r.variantId, -1)}>
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center tabular-nums">{r.stockOnHand}</span>
                      <button className="btn-ghost h-7 px-2" onClick={() => adjust(r.variantId, 1)}>
                        <Plus size={14} />
                      </button>
                      <button
                        className="btn-ghost h-7 px-2 text-xs"
                        onClick={() => adjust(r.variantId, 10)}
                      >
                        +10
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {view.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-ash px-4 py-10 text-center">
                    Nothing to show.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
