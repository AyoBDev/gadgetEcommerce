'use client';

import { createContext, useContext, useCallback, useSyncExternalStore } from 'react';

const WISHLIST_KEY = 'jaysmart:wishlist';
const COMPARE_KEY = 'jaysmart:compare';
const COMPARE_MAX = 4;

type StoreContextValue = {
  wishlist: number[];
  compare: number[];
  isHydrated: boolean;
  toggleWishlist: (id: number) => void;
  toggleCompare: (id: number) => void;
  isInWishlist: (id: number) => boolean;
  isInCompare: (id: number) => boolean;
  clearWishlist: () => void;
  clearCompare: () => void;
  compareMax: number;
};

const StoreContext = createContext<StoreContextValue | null>(null);

// --- localStorage-backed external store -------------------------------------
// Using useSyncExternalStore keeps reads SSR-safe (server snapshot is empty)
// and lets multiple components share the same source of truth without prop
// drilling or effect-driven state syncing.

const listeners = new Set<() => void>();
const EMPTY: number[] = [];
// Cache parsed arrays so getSnapshot returns a stable reference between reads
// (required by useSyncExternalStore to avoid infinite loops).
const cache = new Map<string, { raw: string | null; value: number[] }>();

function subscribe(callback: () => void): () => void {
  listeners.add(callback);
  const onStorage = (e: StorageEvent) => {
    if (e.key === WISHLIST_KEY || e.key === COMPARE_KEY) callback();
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(callback);
    window.removeEventListener('storage', onStorage);
  };
}

function readIds(key: string): number[] {
  if (typeof window === 'undefined') return EMPTY;
  const raw = localStorage.getItem(key);
  const cached = cache.get(key);
  if (cached && cached.raw === raw) return cached.value;
  let value: number[] = EMPTY;
  try {
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    if (Array.isArray(parsed)) value = parsed.filter((n): n is number => typeof n === 'number');
  } catch {
    value = EMPTY;
  }
  cache.set(key, { raw, value });
  return value;
}

function writeIds(key: string, ids: number[]): void {
  localStorage.setItem(key, JSON.stringify(ids));
  cache.set(key, { raw: localStorage.getItem(key), value: ids });
  listeners.forEach((l) => l());
}

function useStoredIds(key: string): number[] {
  return useSyncExternalStore(
    subscribe,
    () => readIds(key),
    () => EMPTY, // server snapshot
  );
}

function useHydrated(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true, // client
    () => false, // server
  );
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const wishlist = useStoredIds(WISHLIST_KEY);
  const compare = useStoredIds(COMPARE_KEY);
  const isHydrated = useHydrated();

  const toggleWishlist = useCallback((id: number) => {
    const current = readIds(WISHLIST_KEY);
    writeIds(WISHLIST_KEY, current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }, []);

  const toggleCompare = useCallback((id: number) => {
    const current = readIds(COMPARE_KEY);
    if (current.includes(id)) {
      writeIds(COMPARE_KEY, current.filter((x) => x !== id));
    } else if (current.length < COMPARE_MAX) {
      writeIds(COMPARE_KEY, [...current, id]);
    }
  }, []);

  const isInWishlist = useCallback((id: number) => wishlist.includes(id), [wishlist]);
  const isInCompare = useCallback((id: number) => compare.includes(id), [compare]);
  const clearWishlist = useCallback(() => writeIds(WISHLIST_KEY, []), []);
  const clearCompare = useCallback(() => writeIds(COMPARE_KEY, []), []);

  return (
    <StoreContext.Provider
      value={{
        wishlist,
        compare,
        isHydrated,
        toggleWishlist,
        toggleCompare,
        isInWishlist,
        isInCompare,
        clearWishlist,
        clearCompare,
        compareMax: COMPARE_MAX,
      }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within a StoreProvider');
  return ctx;
}
