'use client';

import Image from 'next/image';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Crop, Film, ImageUp, RefreshCw, Trash2, Upload } from 'lucide-react';
import { api, apiError } from '@/lib/api';
import Spinner from '@/components/Spinner';
import { AdminHeader, Field } from '@/components/admin/ui';

// MediaScope: 0 Banner, 1 Product, 2 Promo, 3 Category, 4 Other
const SCOPES = ['Banner', 'Product', 'Promo', 'Category', 'Other'];

interface MediaAsset {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  type: number; // 0 image, 1 video
  scope: number;
  sizeBytes: number;
  width?: number | null;
  height?: number | null;
  contentType?: string | null;
}

interface Banner {
  id: string;
  title: string;
  subtitle?: string | null;
  imageUrl: string;
  linkUrl?: string | null;
  position: number;
}

interface PromoVideo {
  id: string;
  title: string;
  videoUrl: string;
  posterUrl?: string | null;
  position: number;
}

const TABS = ['Library', 'Banners', 'Promo videos', 'Crop'] as const;

export default function AdminMediaPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('Library');

  return (
    <div>
      <AdminHeader title="Media center" subtitle="Images, videos, banners and promos — stored in Supabase Storage." />

      <div className="mb-6 flex gap-2 overflow-x-auto border-b border-white/10">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition ${
              tab === t ? 'border-blood text-bone' : 'text-ash border-transparent hover:text-bone'
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Library' && <Library />}
      {tab === 'Banners' && <Banners />}
      {tab === 'Promo videos' && <Promos />}
      {tab === 'Crop' && <CropTool />}
    </div>
  );
}

function bytes(n: number) {
  if (n < 1024) return `${n} B`;
  if (n < 1_048_576) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / 1_048_576).toFixed(1)} MB`;
}

/* ----------------------------- Library tab ----------------------------- */
function Library() {
  const [assets, setAssets] = useState<MediaAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scope, setScope] = useState(4);
  const [resizeWidth, setResizeWidth] = useState<number | ''>('');
  const replaceRef = useRef<HTMLInputElement>(null);
  const [replaceId, setReplaceId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<MediaAsset[]>('/admin/media');
      setAssets(data);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function uploadImage(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const rw = resizeWidth ? `&resizeWidth=${resizeWidth}` : '';
      await api.post(`/admin/media/images?scope=${scope}${rw}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function uploadVideo(file: File) {
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      await api.post('/admin/media/videos?scope=2', form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function doReplace(file: File) {
    if (!replaceId) return;
    setBusy(true);
    try {
      const form = new FormData();
      form.append('file', file);
      await api.put(`/admin/media/${replaceId}/replace`, form, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setReplaceId(null);
      await load();
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  async function del(id: string) {
    if (!confirm('Delete this asset permanently?')) return;
    try {
      await api.delete(`/admin/media/${id}`);
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <div>
      {error && <p className="text-blood mb-4 text-sm">{error}</p>}

      <div className="card mb-6 grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="Scope">
          <select className="input" value={scope} onChange={(e) => setScope(Number(e.target.value))}>
            {SCOPES.map((s, i) => (
              <option key={s} value={i}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Resize width (px, optional)">
          <input
            className="input"
            type="number"
            placeholder="e.g. 1200"
            value={resizeWidth}
            onChange={(e) => setResizeWidth(e.target.value ? Number(e.target.value) : '')}
          />
        </Field>
        <label className="flex flex-col">
          <span className="label-caps text-ash mb-1">Upload image</span>
          <span className="btn-primary inline-flex cursor-pointer items-center justify-center gap-2">
            <ImageUp size={16} /> Choose image
            <input
              type="file"
              accept="image/*"
              hidden
              onChange={(e) => e.target.files?.[0] && uploadImage(e.target.files[0])}
            />
          </span>
        </label>
        <label className="flex flex-col">
          <span className="label-caps text-ash mb-1">Upload video</span>
          <span className="btn-ghost inline-flex cursor-pointer items-center justify-center gap-2">
            <Film size={16} /> Choose video
            <input
              type="file"
              accept="video/*"
              hidden
              onChange={(e) => e.target.files?.[0] && uploadVideo(e.target.files[0])}
            />
          </span>
        </label>
      </div>

      {busy && <p className="text-ash mb-4 text-sm">Uploading…</p>}

      {/* hidden replace picker */}
      <input
        ref={replaceRef}
        type="file"
        accept="image/*"
        hidden
        onChange={(e) => e.target.files?.[0] && doReplace(e.target.files[0])}
      />

      {loading ? (
        <div className="flex justify-center py-20">
          <Spinner />
        </div>
      ) : assets.length === 0 ? (
        <p className="text-ash py-10 text-center text-sm">No media uploaded yet.</p>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {assets.map((a) => (
            <div key={a.id} className="card overflow-hidden">
              <div className="relative aspect-square bg-carbon">
                {a.type === 1 ? (
                  <video src={a.url} className="h-full w-full object-cover" muted />
                ) : (
                  <Image
                    src={a.thumbnailUrl ?? a.url}
                    alt=""
                    fill
                    sizes="200px"
                    className="object-cover"
                    unoptimized
                  />
                )}
              </div>
              <div className="p-3 text-xs">
                <p className="text-ash">
                  {SCOPES[a.scope]} · {bytes(a.sizeBytes)}
                  {a.width ? ` · ${a.width}×${a.height}` : ''}
                </p>
                <div className="mt-2 flex gap-2">
                  {a.type === 0 && (
                    <button
                      className="btn-ghost h-7 flex-1 px-2"
                      onClick={() => {
                        setReplaceId(a.id);
                        replaceRef.current?.click();
                      }}
                    >
                      <RefreshCw size={13} />
                    </button>
                  )}
                  <button
                    className="btn-ghost h-7 flex-1 px-2 hover:text-blood"
                    onClick={() => del(a.id)}
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ----------------------------- Banners tab ----------------------------- */
function Banners() {
  const [rows, setRows] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    imageUrl: '',
    linkUrl: '',
    position: 0,
    isActive: true
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<Banner[]>('/banners');
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

  async function create() {
    try {
      await api.post('/admin/media/banners', form);
      setForm({ title: '', subtitle: '', imageUrl: '', linkUrl: '', position: 0, isActive: true });
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  async function del(id: string) {
    try {
      await api.delete(`/admin/media/banners/${id}`);
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        {error && <p className="text-blood mb-4 text-sm">{error}</p>}
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <p className="text-ash text-sm">No active banners.</p>
        ) : (
          <ul className="space-y-4">
            {rows.map((b) => (
              <li key={b.id} className="card flex items-center gap-4 p-4">
                <div className="relative h-16 w-28 shrink-0 overflow-hidden rounded bg-carbon">
                  <Image src={b.imageUrl} alt={b.title} fill sizes="112px" className="object-cover" unoptimized />
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{b.title}</p>
                  <p className="text-ash text-xs">{b.subtitle}</p>
                </div>
                <span className="text-ash text-xs">#{b.position}</span>
                <button className="btn-ghost h-8 px-2 hover:text-blood" onClick={() => del(b.id)}>
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="card h-fit space-y-3 p-5">
        <p className="label-caps text-ash">New banner</p>
        <input
          className="input"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          className="input"
          placeholder="Subtitle"
          value={form.subtitle}
          onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
        />
        <input
          className="input"
          placeholder="Image URL"
          value={form.imageUrl}
          onChange={(e) => setForm({ ...form, imageUrl: e.target.value })}
        />
        <input
          className="input"
          placeholder="Link URL (optional)"
          value={form.linkUrl}
          onChange={(e) => setForm({ ...form, linkUrl: e.target.value })}
        />
        <input
          className="input"
          type="number"
          placeholder="Position"
          value={form.position}
          onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
        />
        <button className="btn-primary w-full" onClick={create} disabled={!form.title || !form.imageUrl}>
          <Upload size={15} className="mr-2 inline" /> Publish banner
        </button>
        <p className="text-ash text-xs">
          Tip: upload the artwork in the Library tab first, then paste its URL here.
        </p>
      </aside>
    </div>
  );
}

/* --------------------------- Promo videos tab -------------------------- */
function Promos() {
  const [rows, setRows] = useState<PromoVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: '',
    videoUrl: '',
    posterUrl: '',
    position: 0,
    isActive: true
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get<PromoVideo[]>('/promo-videos');
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

  async function create() {
    try {
      await api.post('/admin/media/promo-videos', form);
      setForm({ title: '', videoUrl: '', posterUrl: '', position: 0, isActive: true });
      await load();
    } catch (err) {
      setError(apiError(err));
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <div>
        {error && <p className="text-blood mb-4 text-sm">{error}</p>}
        {loading ? (
          <Spinner />
        ) : rows.length === 0 ? (
          <p className="text-ash text-sm">No promo videos yet.</p>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2">
            {rows.map((v) => (
              <li key={v.id} className="card overflow-hidden">
                <video
                  src={v.videoUrl}
                  poster={v.posterUrl ?? undefined}
                  controls
                  className="aspect-video w-full bg-black object-cover"
                />
                <div className="p-3">
                  <p className="font-semibold">{v.title}</p>
                  <p className="text-ash text-xs">Position #{v.position}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      <aside className="card h-fit space-y-3 p-5">
        <p className="label-caps text-ash">New promo video</p>
        <input
          className="input"
          placeholder="Title"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
        />
        <input
          className="input"
          placeholder="Video URL"
          value={form.videoUrl}
          onChange={(e) => setForm({ ...form, videoUrl: e.target.value })}
        />
        <input
          className="input"
          placeholder="Poster URL (optional)"
          value={form.posterUrl}
          onChange={(e) => setForm({ ...form, posterUrl: e.target.value })}
        />
        <input
          className="input"
          type="number"
          placeholder="Position"
          value={form.position}
          onChange={(e) => setForm({ ...form, position: Number(e.target.value) })}
        />
        <button className="btn-primary w-full" onClick={create} disabled={!form.title || !form.videoUrl}>
          <Upload size={15} className="mr-2 inline" /> Publish video
        </button>
        <p className="text-ash text-xs">Upload the file in Library, then paste its URL here.</p>
      </aside>
    </div>
  );
}

/* ------------------------------ Crop tab ------------------------------- */
function CropTool() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [rect, setRect] = useState({ x: 0, y: 0, width: 600, height: 600 });
  const [scope, setScope] = useState(4);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  function pick(f: File) {
    setFile(f);
    setPreview(URL.createObjectURL(f));
    setDone(null);
  }

  async function crop() {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post(
        `/admin/media/crop?x=${rect.x}&y=${rect.y}&width=${rect.width}&height=${rect.height}&scope=${scope}`,
        form,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      setDone(data.url);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="card p-5">
        <label className="btn-ghost inline-flex cursor-pointer items-center gap-2">
          <Crop size={16} /> Choose image
          <input
            type="file"
            accept="image/*"
            hidden
            onChange={(e) => e.target.files?.[0] && pick(e.target.files[0])}
          />
        </label>
        {preview && (
          <div className="relative mt-4 aspect-square overflow-hidden rounded bg-carbon">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="preview" className="h-full w-full object-contain" />
          </div>
        )}
      </div>

      <div className="card space-y-4 p-5">
        <p className="text-ash text-sm">
          Server-side crop (Supabase + ImageSharp). Enter the crop rectangle in source pixels.
        </p>
        <div className="grid grid-cols-2 gap-3">
          {(['x', 'y', 'width', 'height'] as const).map((k) => (
            <Field key={k} label={k.toUpperCase()}>
              <input
                className="input"
                type="number"
                value={rect[k]}
                onChange={(e) => setRect({ ...rect, [k]: Number(e.target.value) })}
              />
            </Field>
          ))}
        </div>
        <Field label="Scope">
          <select className="input" value={scope} onChange={(e) => setScope(Number(e.target.value))}>
            {SCOPES.map((s, i) => (
              <option key={s} value={i}>
                {s}
              </option>
            ))}
          </select>
        </Field>
        {error && <p className="text-blood text-sm">{error}</p>}
        <button className="btn-primary w-full" onClick={crop} disabled={!file || busy}>
          {busy ? 'Cropping…' : 'Crop & save to library'}
        </button>
        {done && (
          <div>
            <p className="mb-2 text-sm text-emerald-400">Cropped asset created.</p>
            <div className="relative aspect-square overflow-hidden rounded bg-carbon">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={done} alt="cropped" className="h-full w-full object-contain" />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
