/**
 * MandiKart — CatalogContext
 * 
 * Provides a global live product catalog so any screen can look up a product
 * by its ID without relying on mock data.
 * 
 * Auto-refreshes every 4 seconds to reflect farmer listings, status changes,
 * and price updates seamlessly in real-time.
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import { Product } from '../types';
import { supabase } from '../services/supabaseClient';

interface CatalogContextType {
  products: Product[];
  isLoading: boolean;
  getProductById: (id: string) => Product | undefined;
  refresh: (silent?: boolean) => Promise<void>;
}

const CatalogContext = createContext<CatalogContextType>({
  products: [],
  isLoading: false,
  getProductById: () => undefined,
  refresh: async () => {},
});

export function CatalogProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isMountedRef = useRef(true);
  const isRefreshingRef = useRef(false);

  const refresh = useCallback(async (silent: boolean = false) => {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;
    try {
      if (!silent) {
        setIsLoading(true);
      }
      const live = await apiClient.catalog.search({ fresh: true });
      if (isMountedRef.current && Array.isArray(live) && live.length > 0) {
        setProducts((prev) => {
          if (!prev || prev.length === 0) return live;
          const map = new Map<string, Product>();
          for (const item of live) {
            map.set(item.id, item);
          }
          for (const item of prev) {
            if (!map.has(item.id)) {
              map.set(item.id, item);
            }
          }
          return Array.from(map.values());
        });
      }
    } catch (err) {
      console.log('[CatalogContext] Refresh notice, keeping cached products:', err);
    } finally {
      isRefreshingRef.current = false;
      if (isMountedRef.current && !silent) {
        setIsLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    // 1. Initial immediate fetch
    refresh(false);

    // 2. Auto-refresh periodically to show newly approved/listed products
    const interval = setInterval(() => {
      if (!isRefreshingRef.current) {
        refresh(true);
      }
    }, 6000);

    // 3. Supabase Realtime channel for sub-second push updates when farmer adds/edits a crop
    const channel = supabase
      .channel('public_products_catalog_sync')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'products' },
        (payload) => {
          console.log('[CatalogContext] Live product change event:', payload.eventType);
          refresh(true);
        }
      )
      .subscribe();

    return () => {
      isMountedRef.current = false;
      clearInterval(interval);
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const getProductById = useCallback(
    (id: string): Product | undefined => {
      return products.find((p) => p.id === id);
    },
    [products]
  );

  return (
    <CatalogContext.Provider value={{ products, isLoading, getProductById, refresh }}>
      {children}
    </CatalogContext.Provider>
  );
}

export function useCatalog() {
  return useContext(CatalogContext);
}

