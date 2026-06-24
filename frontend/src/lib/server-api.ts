// Server-side fetch helpers for React Server Components (catalog/SEO pages).
// Uses the public API base URL; tolerates the backend being unreachable at
// build time by returning a fallback instead of throwing.

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8080/api/v1';

export async function getJson<T>(
  path: string,
  fallback: T,
  revalidate = 60
): Promise<T> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      next: { revalidate },
      headers: { 'Content-Type': 'application/json' }
    });
    if (!res.ok) return fallback;
    return (await res.json()) as T;
  } catch {
    return fallback;
  }
}

export async function getJsonOrNull<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${BASE_URL}${path}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}
