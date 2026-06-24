'use client';

import { useState } from 'react';
import { Mail, MapPin, Phone } from 'lucide-react';
import { api, apiError } from '@/lib/api';

interface ContactForm {
  name: string;
  email: string;
  subject: string;
  message: string;
}

const EMPTY: ContactForm = { name: '', email: '', subject: '', message: '' };

export default function ContactPage() {
  const [form, setForm] = useState<ContactForm>(EMPTY);
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function set<K extends keyof ContactForm>(key: K, value: ContactForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/contact', form);
      setSent(true);
      setForm(EMPTY);
    } catch (err) {
      setError(apiError(err, 'Could not send your message. Try again.'));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="font-display text-4xl font-extrabold">Get in touch</h1>
      <p className="text-ash mt-2">
        Questions about a drop, an order, or a collab? Reach the Syndicate.
      </p>

      <div className="mt-10 grid gap-10 lg:grid-cols-[1fr_320px]">
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <input
              className="input"
              placeholder="Name"
              value={form.name}
              onChange={(e) => set('name', e.target.value)}
              required
            />
            <input
              className="input"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={(e) => set('email', e.target.value)}
              required
            />
          </div>
          <input
            className="input"
            placeholder="Subject"
            value={form.subject}
            onChange={(e) => set('subject', e.target.value)}
            required
          />
          <textarea
            className="input min-h-[160px] resize-y"
            placeholder="Your message"
            value={form.message}
            onChange={(e) => set('message', e.target.value)}
            required
          />
          {error && <p className="text-blood text-sm">{error}</p>}
          {sent && (
            <p className="text-sm text-emerald-400">
              Message sent — we&apos;ll get back to you shortly.
            </p>
          )}
          <button className="btn-primary" disabled={busy}>
            {busy ? 'Sending…' : 'Send message'}
          </button>
        </form>

        <aside className="card h-fit space-y-5 p-6">
          <Detail icon={<Mail size={18} />} label="Email" value="hello@dripsyndicate.com" />
          <Detail icon={<Phone size={18} />} label="WhatsApp" value="+27 73 522 4964" />
          <Detail icon={<MapPin size={18} />} label="Base" value="Cape Town, South Africa" />
        </aside>
      </div>
    </div>
  );
}

function Detail({
  icon,
  label,
  value
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <span className="text-blood mt-0.5">{icon}</span>
      <div>
        <p className="label-caps text-ash">{label}</p>
        <p className="font-medium">{value}</p>
      </div>
    </div>
  );
}
