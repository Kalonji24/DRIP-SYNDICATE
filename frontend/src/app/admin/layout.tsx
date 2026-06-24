'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  BarChart3,
  Boxes,
  FolderTree,
  Image as ImageIcon,
  Package,
  ShoppingBag,
  Users
} from 'lucide-react';
import { useAuthStore } from '@/store/auth';

const NAV = [
  { href: '/admin', label: 'Dashboard', icon: BarChart3, exact: true },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/categories', label: 'Categories', icon: FolderTree },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/inventory', label: 'Inventory', icon: Boxes },
  { href: '/admin/media', label: 'Media', icon: ImageIcon },
  { href: '/admin/users', label: 'Users', icon: Users }
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isAdmin } = useAuthStore();
  const [ready, setReady] = useState(false);

  // Guard runs after hydration so the persisted session is available.
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login?redirect=/admin');
      return;
    }
    if (!isAdmin) {
      router.replace('/');
      return;
    }
    setReady(true);
  }, [isAuthenticated, isAdmin, router]);

  if (!ready) return null;

  return (
    <div className="mx-auto grid max-w-7xl gap-8 px-4 py-8 lg:grid-cols-[220px_1fr]">
      <aside className="lg:sticky lg:top-24 lg:h-fit">
        <p className="label-caps text-ash mb-4">Control room</p>
        <nav className="flex gap-2 overflow-x-auto lg:flex-col">
          {NAV.map(({ href, label, icon: Icon, exact }) => {
            const active = exact ? pathname === href : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 whitespace-nowrap rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active ? 'bg-blood text-white' : 'text-ash hover:bg-white/5 hover:text-bone'
                }`}
              >
                <Icon size={17} />
                {label}
              </Link>
            );
          })}
        </nav>
      </aside>
      <main className="min-w-0">{children}</main>
    </div>
  );
}
