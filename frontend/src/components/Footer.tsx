import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="border-t border-bone/10 bg-carbon">
      <div className="mx-auto max-w-7xl px-4 py-12 grid gap-8 md:grid-cols-4">
        <div>
          <div className="font-display text-xl font-extrabold">
            DRIP<span className="text-blood">·</span>SYNDICATE
          </div>
          <p className="mt-3 text-ash text-sm">
            Drop-based streetwear. Limited runs, sealed drops, zero restocks. Cape Town, ZA.
          </p>
        </div>
        <FooterCol title="Shop" links={[
          ['All', '/shop'], ['Hoodies', '/shop?category=hoodies'],
          ['Tees', '/shop?category=tees'], ['Sneakers', '/shop?category=sneakers']
        ]} />
        <FooterCol title="Account" links={[
          ['Sign in', '/login'], ['Register', '/register'],
          ['My orders', '/account'], ['Wishlist', '/wishlist']
        ]} />
        <FooterCol title="Support" links={[
          ['Contact', '/contact'], ['Shipping', '/contact'], ['Returns', '/contact']
        ]} />
      </div>
      <div className="border-t border-bone/10 py-5 text-center text-ash text-xs">
        © {new Date().getFullYear()} DRIP Syndicate · Softwise Solutions · POPIA compliant
      </div>
    </footer>
  );
}

function FooterCol({ title, links }: { title: string; links: [string, string][] }) {
  return (
    <div>
      <h4 className="label-caps text-blood mb-3">{title}</h4>
      <ul className="space-y-2 text-sm text-ash">
        {links.map(([label, href]) => (
          <li key={label}>
            <Link href={href} className="hover:text-bone transition-colors">{label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
