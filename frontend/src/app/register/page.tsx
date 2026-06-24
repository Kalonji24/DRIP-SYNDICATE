'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { api, apiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { AuthResponse } from '@/types';

export default function RegisterPage() {
  const router = useRouter();
  const { setSession } = useAuthStore();

  const [form, setForm] = useState({ fullName: '', email: '', phone: '', password: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post<AuthResponse>('/auth/register', {
        fullName: form.fullName,
        email: form.email,
        phone: form.phone || null,
        password: form.password
      });
      setSession(data);
      router.push('/account');
    } catch (err) {
      setError(apiError(err, 'Could not create account.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="font-display text-4xl font-extrabold">Join the Syndicate</h1>
      <p className="text-ash mt-2">Create an account for drop access.</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <input className="input" placeholder="Full name" value={form.fullName} onChange={set('fullName')} required />
        <input className="input" type="email" placeholder="Email" autoComplete="email" value={form.email} onChange={set('email')} required />
        <input className="input" placeholder="Phone (optional)" value={form.phone} onChange={set('phone')} />
        <input className="input" type="password" placeholder="Password (min 8 chars)" autoComplete="new-password" value={form.password} onChange={set('password')} required minLength={8} />
        {error && <p className="text-blood text-sm">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
      </form>

      <p className="mt-5 text-sm text-ash">
        Already a member?{' '}
        <Link href="/login" className="text-blood hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
