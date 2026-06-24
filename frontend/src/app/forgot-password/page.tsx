'use client';

import Link from 'next/link';
import { useState } from 'react';
import { api, apiError } from '@/lib/api';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [devToken, setDevToken] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const { data } = await api.post<{ message: string; devToken?: string }>(
        '/auth/forgot-password',
        { email }
      );
      setSent(true);
      // In non-production the API returns a devToken to ease testing.
      setDevToken(data.devToken ?? null);
    } catch (err) {
      setError(apiError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <h1 className="font-display text-4xl font-extrabold">Reset password</h1>

      {sent ? (
        <div className="mt-6 card p-6">
          <p className="text-ash">
            If an account exists for <span className="text-bone">{email}</span>, a reset link
            has been sent.
          </p>
          {devToken && (
            <p className="mt-4 text-xs break-all text-ash">
              <span className="text-blood label-caps">Dev token:</span> {devToken}
            </p>
          )}
        </div>
      ) : (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <input
            className="input"
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          {error && <p className="text-blood text-sm">{error}</p>}
          <button className="btn-primary w-full" disabled={busy}>
            {busy ? 'Sending…' : 'Send reset link'}
          </button>
        </form>
      )}

      <p className="mt-5 text-sm text-ash">
        <Link href="/login" className="hover:text-blood">
          Back to sign in
        </Link>
      </p>
    </div>
  );
}
