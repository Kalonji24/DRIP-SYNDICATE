'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { api, apiError } from '@/lib/api';
import { useAuthStore } from '@/store/auth';
import type { AuthResponse } from '@/types';

function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const redirect = params.get('redirect') ?? '/account';
  const { setSession } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post<AuthResponse>('/auth/login', { email, password });
      setSession(data);
      router.push(redirect);
    } catch (err) {
      setError(apiError(err, 'Invalid email or password.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="font-display text-4xl font-extrabold">Sign in</h1>
      <p className="text-ash mt-2">Access drops, orders and the Syndicate.</p>

      <form onSubmit={submit} className="mt-8 space-y-4">
        <input
          className="input"
          type="email"
          placeholder="Email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        {error && <p className="text-blood text-sm">{error}</p>}
        <button className="btn-primary w-full" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <div className="mt-5 flex justify-between text-sm text-ash">
        <Link href="/forgot-password" className="hover:text-blood">
          Forgot password?
        </Link>
        <Link href="/register" className="hover:text-blood">
          Create account
        </Link>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
