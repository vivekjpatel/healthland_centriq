"use client";

import { cn } from "@/lib/utils";

type GlobalLoaderProps = {
  open: boolean;
};

export function GlobalLoader({ open }: GlobalLoaderProps) {
  return (
    <div
      aria-hidden={!open}
      aria-busy={open}
      className={cn(
        "fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/30 backdrop-blur-[2px] transition-opacity duration-200",
        open ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0",
      )}
    >
      <div className="flex min-w-44 items-center justify-center gap-3 rounded-2xl border border-white/20 bg-white/90 px-5 py-4 shadow-2xl">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--secondary)] border-t-transparent" />
        <p className="text-sm font-medium text-slate-700">Processing...</p>
      </div>
    </div>
  );
}
