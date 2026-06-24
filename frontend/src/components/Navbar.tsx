'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { ShoppingBag, Heart, User, Menu, X, Search } from 'lucide-react';
import { useAuthStore } from '@/store/auth';
import { useCartStore } from '@/store/cart';

const NAV = [
  { href: '/shop', label: 'Shop' },
  { href: '/shop?category=hoodies', label: 'Hoodies' },
  { href: '/shop?category=tees', label: 'Tees' },
  { href: '/shop?category=sneakers', label: 'Sneakers' },
  { href: '/contact', label: 'Contact' }
];

export default function Navbar() {
  const { isAuthenticated, isAdmin } = useAuthStore();
  const { count, fetch } = useCartStore();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (isAuthenticated) fetch();
  }, [isAuthenticated, fetch]);

  return (
    <header className="sticky top-0 z-50 bg-ink/95 backdrop-blur border-b border-bone/10">
      {/* Drop ticker */}
      <div className="bg-blood text-bone overflow-hidden">
        <div className="flex whitespace-nowrap animate-marquee py-1.5 text-xs font-semibold uppercase tracking-[0.2em]">
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i} className="flex">
              {Array.from({ length: 6 }).map((__, j) => (
                <span key={j} className="mx-6">
                  Next drop loading · Sealed runs · No restocks
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>

      <nav className="mx-auto max-w-7xl px-4 h-16 flex items-center justify-between">
        <button
          className="md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>

        <Link href="/" className="font-display text-2xl font-extrabold tracking-tight">
          DRIP<span className="text-blood">·</span>SYNDICATE
        </Link>

        <ul className="hidden md:flex items-center gap-7 label-caps">
          {NAV.map((n) => (
            <li key={n.label}>
              <Link href={n.href} className="hover:text-blood transition-colors">
                {n.label}
              </Link>
            </li>
          ))}
        </ul>

        <div className="flex items-center gap-4">
          <Link href="/shop" aria-label="Search" className="hover:text-blood">
            <Search size={20} />
          </Link>
          <Link href="/wishlist" aria-label="Wishlist" className="hover:text-blood">
            <Heart size={20} />
          </Link>
          <Link
            href={isAuthenticated ? '/account' : '/login'}
            aria-label="Account"
            className="hover:text-blood"
          >
            <User size={20} />
          </Link>
          {isAdmin && (
            <Link href="/admin" className="label-caps hidden sm:inline hover:text-blood">
              Admin
            </Link>
          )}
          <Link href="/cart" aria-label="Cart" className="relative hover:text-blood">
            <ShoppingBag size={20} />
            {count > 0 && (
              <span className="absolute -top-2 -right-2 bg-blood text-bone text-[10px] font-bold rounded-full h-4 min-w-4 px-1 flex items-center justify-center">
                {count}
              </span>
            )}
          </Link>
        </div>
      </nav>

      {/* Mobile menu */}
      {open && (
        <ul className="md:hidden border-t border-bone/10 px-4 py-4 space-y-3 label-caps">
          {NAV.map((n) => (
            <li key={n.label}>
              <Link href={n.href} onClick={() => setOpen(false)} className="block py-1">
                {n.label}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </header>
  );
}
