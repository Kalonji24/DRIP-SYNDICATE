'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2, Layers } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import { formatZAR } from '@/lib/format';
import Spinner from '@/components/Spinner';
import { AdminHeader, Badge, Field, Modal } from '@/components/admin/ui';
import type {
  AdminPaged,
  AdminProductRow,
  Category,
  UpsertProduct,
  UpsertVariant
} from '@/types';
import { PRODUCT_STATUS } from '@/types';

const EMPTY: UpsertProduct = {
  name: '',
  slug: '',
  description: '',
  price: 0,
  currency: 'ZAR',
  categoryId: '',
  status: 1,
  isFeatured: false
};

const STATUS_TONE = [
  'bg-ash/15 text-ash',
  'bg-emerald-500/15 text-emerald-300',
  'bg-amber-500/15 text-amber-300'
];

export default function AdminProductsPage() {
  const [rows, setRows] = useState<AdminProductRow[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editing, setEditing] = useState<UpsertProduct | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [stockFor, setStockFor] = useState<AdminProductRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [p, c] = await Promise.all([
        api.get<AdminPaged<AdminProductRow>>('/admin/products?pageSize=100'),
        api.get<Category[]>('/categories')
      ]);
      setRows(p.data.items);
      setCategories(c.data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function openCreate() {
    setEditId(null);
    setEditing({ ...EMPTY, categoryId: categories[0]?.id ?? '' });
  }

  async function openEdit(row: AdminProductRow) {
    // Hydrate the full product so the form has description etc.
    const { data } = await api.get(`/admin/products/${row.id}`);
    setEditId(row.id);
    setEditing({
      name: data.name,
      slug: data.slug,
      description: data.description ?? '',
      price: data.price,
      currency: data.currency ?? 'ZAR',
      categoryId: data.categoryId,
      status: data.status,
      isFeatured: data.isFeatured
    });
  }

  async function save() {
    if (!editing) return;
    try {
      if (editId) await api.put(`/admin/products/${editId}`, editing);
      else await api.post('/admin/products', editing);
      setEditing(null);
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function del(id: string) {
    if (!confirm('Archive this product? It will be soft-deleted.')) return;
    try {
      await api.delete(`/admin/products/${id}`);
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center py-32">
        <Spinner />
      </div>
    );
  }

  return (
    <div>
      <AdminHeader
        title="Products"
        subtitle={`${rows.length} products`}
        action={
          <button className="btn-primary inline-flex items-center gap-2" onClick={openCreate}>
            <Plus size={16} /> New product
          </button>
        }
      />

      {error && <p className="text-blood mb-4 text-sm">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-ash border-b border-white/10">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((r) => (
              <tr key={r.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <p className="font-medium">{r.name}</p>
                  <p className="text-ash text-xs">{r.slug}</p>
                </td>
                <td className="px-4 py-3">{formatZAR(r.price)}</td>
                <td className="px-4 py-3">
                  <Badge tone={STATUS_TONE[r.status] ?? STATUS_TONE[0]}>
                    {PRODUCT_STATUS[r.status]}
                  </Badge>
                </td>
                <td className="px-4 py-3">{r.isFeatured ? 'Yes' : '—'}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      className="btn-ghost h-8 px-2"
                      title="Variants & stock"
                      onClick={() => setStockFor(r)}
                    >
                      <Layers size={15} />
                    </button>
                    <button className="btn-ghost h-8 px-2" title="Edit" onClick={() => openEdit(r)}>
                      <Pencil size={15} />
                    </button>
                    <button
                      className="btn-ghost h-8 px-2 hover:text-blood"
                      title="Archive"
                      onClick={() => del(r.id)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create / edit modal */}
      <Modal
        open={!!editing}
        title={editId ? 'Edit product' : 'New product'}
        onClose={() => setEditing(null)}
      >
        {editing && (
          <div className="space-y-4">
            <Field label="Name">
              <input
                className="input"
                value={editing.name}
                onChange={(e) =>
                  setEditing({
                    ...editing,
                    name: e.target.value,
                    slug: editId
                      ? editing.slug
                      : e.target.value
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/^-|-$/g, '')
                  })
                }
              />
            </Field>
            <Field label="Slug">
              <input
                className="input"
                value={editing.slug}
                onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
              />
            </Field>
            <Field label="Description">
              <textarea
                className="input min-h-[80px]"
                value={editing.description ?? ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Price (ZAR)">
                <input
                  className="input"
                  type="number"
                  step="0.01"
                  value={editing.price}
                  onChange={(e) => setEditing({ ...editing, price: Number(e.target.value) })}
                />
              </Field>
              <Field label="Category">
                <select
                  className="input"
                  value={editing.categoryId}
                  onChange={(e) => setEditing({ ...editing, categoryId: e.target.value })}
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Status">
                <select
                  className="input"
                  value={editing.status}
                  onChange={(e) => setEditing({ ...editing, status: Number(e.target.value) })}
                >
                  {PRODUCT_STATUS.map((s, i) => (
                    <option key={s} value={i}>
                      {s}
                    </option>
                  ))}
                </select>
              </Field>
              <label className="mt-6 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={editing.isFeatured}
                  onChange={(e) => setEditing({ ...editing, isFeatured: e.target.checked })}
                />
                Featured on home
              </label>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={save}>
                {editId ? 'Save changes' : 'Create product'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Variants & stock modal */}
      {stockFor && (
        <VariantManager
          productId={stockFor.id}
          productName={stockFor.name}
          onClose={() => setStockFor(null)}
        />
      )}
    </div>
  );
}

const EMPTY_VARIANT: UpsertVariant = {
  sku: '',
  size: '',
  color: '',
  price: 0,
  stockOnHand: 0
};

interface VariantRow {
  id: string;
  sku: string;
  size?: string | null;
  color?: string | null;
  price: number;
  stockOnHand: number;
  available: number;
}

function VariantManager({
  productId,
  productName,
  onClose
}: {
  productId: string;
  productName: string;
  onClose: () => void;
}) {
  const [variants, setVariants] = useState<VariantRow[]>([]);
  const [adding, setAdding] = useState<UpsertVariant>(EMPTY_VARIANT);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/admin/products/${productId}`);
      setVariants(data.variants ?? []);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    load();
  }, [load]);

  async function addVariant() {
    try {
      await api.post(`/admin/products/${productId}/variants`, adding);
      setAdding(EMPTY_VARIANT);
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function adjust(variantId: string, delta: number) {
    try {
      await api.post(`/admin/products/variants/${variantId}/stock`, { delta, reason: 'manual' });
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <Modal open title={`Variants · ${productName}`} onClose={onClose}>
      {error && <p className="text-blood mb-3 text-sm">{error}</p>}
      {loading ? (
        <div className="flex justify-center py-8">
          <Spinner />
        </div>
      ) : (
        <>
          <ul className="divide-y divide-white/10">
            {variants.map((v) => (
              <li key={v.id} className="flex items-center justify-between gap-3 py-3 text-sm">
                <div>
                  <p className="font-medium">
                    {[v.size, v.color].filter(Boolean).join(' / ') || v.sku}
                  </p>
                  <p className="text-ash text-xs">
                    {v.sku} · {formatZAR(v.price)} · {v.available} available
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-ghost h-7 px-2" onClick={() => adjust(v.id, -1)}>
                    −
                  </button>
                  <span className="w-8 text-center tabular-nums">{v.stockOnHand}</span>
                  <button className="btn-ghost h-7 px-2" onClick={() => adjust(v.id, 1)}>
                    +
                  </button>
                </div>
              </li>
            ))}
            {variants.length === 0 && <p className="text-ash py-3 text-sm">No variants yet.</p>}
          </ul>

          <div className="mt-5 border-t border-white/10 pt-5">
            <p className="label-caps text-ash mb-3">Add variant</p>
            <div className="grid grid-cols-2 gap-3">
              <input
                className="input"
                placeholder="SKU"
                value={adding.sku}
                onChange={(e) => setAdding({ ...adding, sku: e.target.value })}
              />
              <input
                className="input"
                placeholder="Size"
                value={adding.size ?? ''}
                onChange={(e) => setAdding({ ...adding, size: e.target.value })}
              />
              <input
                className="input"
                placeholder="Color"
                value={adding.color ?? ''}
                onChange={(e) => setAdding({ ...adding, color: e.target.value })}
              />
              <input
                className="input"
                type="number"
                step="0.01"
                placeholder="Price"
                value={adding.price}
                onChange={(e) => setAdding({ ...adding, price: Number(e.target.value) })}
              />
              <input
                className="input col-span-2"
                type="number"
                placeholder="Initial stock"
                value={adding.stockOnHand}
                onChange={(e) => setAdding({ ...adding, stockOnHand: Number(e.target.value) })}
              />
            </div>
            <button className="btn-primary mt-3 w-full" onClick={addVariant}>
              Add variant
            </button>
          </div>
        </>
      )}
    </Modal>
  );
}
