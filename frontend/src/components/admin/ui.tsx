'use client';

import { X } from 'lucide-react';

/** Page heading with an optional action slot. */
export function AdminHeader({
  title,
  subtitle,
  action
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-extrabold">{title}</h1>
        {subtitle && <p className="text-ash mt-1 text-sm">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/** Lightweight modal used by the admin CRUD forms. */
export function Modal({
  open,
  title,
  onClose,
  children
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
    >
      <div
        className="card w-full max-w-lg p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-display text-xl font-bold">{title}</h2>
          <button className="text-ash hover:text-bone" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  children
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="label-caps text-ash mb-1 block">{label}</span>
      {children}
    </label>
  );
}

export function Badge({ tone, children }: { tone: string; children: React.ReactNode }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${tone}`}>{children}</span>
  );
}
