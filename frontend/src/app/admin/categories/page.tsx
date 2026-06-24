'use client';

import { useCallback, useEffect, useState } from 'react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import Spinner from '@/components/Spinner';
import { AdminHeader, Field, Modal } from '@/components/admin/ui';
import type { Category } from '@/types';

interface UpsertCategory {
  name: string;
  slug: string;
  description?: string | null;
  parentId?: string | null;
  imageUrl?: string | null;
  position: number;
}

const EMPTY: UpsertCategory = {
  name: '',
  slug: '',
  description: '',
  parentId: null,
  imageUrl: '',
  position: 0
};

export default function AdminCategoriesPage() {
  const [rows, setRows] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState<UpsertCategory | null>(null);
  const [editId, setEditId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Category[]>('/categories');
      setRows(data);
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
    setEditing({ ...EMPTY, position: rows.length });
  }

  function openEdit(c: Category) {
    setEditId(c.id);
    setEditing({
      name: c.name,
      slug: c.slug,
      description: c.description ?? '',
      parentId: c.parentId ?? null,
      imageUrl: c.imageUrl ?? '',
      position: c.position
    });
  }

  async function save() {
    if (!editing) return;
    try {
      const body = { ...editing, parentId: editing.parentId || null };
      if (editId) await api.put(`/admin/categories/${editId}`, body);
      else await api.post('/admin/categories', body);
      setEditing(null);
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function del(id: string) {
    if (!confirm('Delete this category?')) return;
    try {
      await api.delete(`/admin/categories/${id}`);
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
        title="Categories"
        subtitle={`${rows.length} categories`}
        action={
          <button className="btn-primary inline-flex items-center gap-2" onClick={openCreate}>
            <Plus size={16} /> New category
          </button>
        }
      />
      {error && <p className="text-blood mb-4 text-sm">{error}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="text-ash border-b border-white/10">
            <tr>
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Position</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {rows.map((c) => (
              <tr key={c.id} className="hover:bg-white/5">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="text-ash px-4 py-3">{c.slug}</td>
                <td className="px-4 py-3">{c.position}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button className="btn-ghost h-8 px-2" onClick={() => openEdit(c)}>
                      <Pencil size={15} />
                    </button>
                    <button
                      className="btn-ghost h-8 px-2 hover:text-blood"
                      onClick={() => del(c.id)}
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

      <Modal
        open={!!editing}
        title={editId ? 'Edit category' : 'New category'}
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
                className="input min-h-[70px]"
                value={editing.description ?? ''}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
              />
            </Field>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Parent">
                <select
                  className="input"
                  value={editing.parentId ?? ''}
                  onChange={(e) => setEditing({ ...editing, parentId: e.target.value || null })}
                >
                  <option value="">None (top level)</option>
                  {rows
                    .filter((c) => c.id !== editId)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </Field>
              <Field label="Position">
                <input
                  className="input"
                  type="number"
                  value={editing.position}
                  onChange={(e) => setEditing({ ...editing, position: Number(e.target.value) })}
                />
              </Field>
            </div>
            <Field label="Image URL">
              <input
                className="input"
                value={editing.imageUrl ?? ''}
                onChange={(e) => setEditing({ ...editing, imageUrl: e.target.value })}
              />
            </Field>
            <div className="flex justify-end gap-3 pt-2">
              <button className="btn-ghost" onClick={() => setEditing(null)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={save}>
                {editId ? 'Save changes' : 'Create'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
