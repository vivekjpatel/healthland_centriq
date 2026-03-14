"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { GlobalLoader } from "@/components/ui/global-loader";

type LoadingContextValue = {
  isLoading: boolean;
  startLoading: () => void;
  stopLoading: () => void;
  withLoading: <T>(task: Promise<T>) => Promise<T>;
};

const LoadingContext = createContext<LoadingContextValue | null>(null);

function shouldTrackFetch(input: RequestInfo | URL): boolean {
  const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;

  if (!url) return false;
  if (url.includes("_next/static") || url.includes("_next/image")) return false;

  return true;
}

export function LoadingProvider({ children }: { children: ReactNode }) {
  const [loadingCount, setLoadingCount] = useState(0);

  const startLoading = useCallback(() => {
    setLoadingCount((count) => count + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setLoadingCount((count) => (count > 0 ? count - 1 : 0));
  }, []);

  const withLoading = useCallback(
    async <T,>(task: Promise<T>) => {
      startLoading();
      try {
        return await task;
      } finally {
        stopLoading();
      }
    },
    [startLoading, stopLoading],
  );

  useEffect(() => {
    if (typeof window === "undefined") return;

    const originalFetch = window.fetch.bind(window);

    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      if (!shouldTrackFetch(input) || init?.headers && new Headers(init.headers).get("x-skip-global-loader") === "1") {
        return originalFetch(input, init);
      }

      startLoading();
      try {
        return await originalFetch(input, init);
      } finally {
        stopLoading();
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [startLoading, stopLoading]);

  const isLoading = loadingCount > 0;

  useEffect(() => {
    if (typeof document === "undefined") return;

    const prevOverflow = document.body.style.overflow;
    if (isLoading) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = prevOverflow || "";
    }

    return () => {
      document.body.style.overflow = prevOverflow;
    };
  }, [isLoading]);

  const value = useMemo(
    () => ({ isLoading, startLoading, stopLoading, withLoading }),
    [isLoading, startLoading, stopLoading, withLoading],
  );

  return (
    <LoadingContext.Provider value={value}>
      {children}
      <GlobalLoader open={isLoading} />
    </LoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const ctx = useContext(LoadingContext);
  if (!ctx) {
    throw new Error("useGlobalLoading must be used within LoadingProvider");
  }

  return ctx;
}
