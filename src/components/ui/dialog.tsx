"use client";

import { createPortal } from "react-dom";
import type * as React from "react";
import { cn } from "@/lib/utils";

type DialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: React.ReactNode;
};

export function Dialog({ open, onOpenChange, title, description, children }: DialogProps) {
  if (typeof window === "undefined") return null;

  return createPortal(
    <div
      className={cn("app-modal-overlay", open ? "app-modal-open" : "")}
      aria-hidden={!open}
      onMouseDown={() => onOpenChange(false)}
    >
      <div
        className="app-modal-panel"
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="section-header">
          <div>
            <h2 className="text-lg font-semibold">{title}</h2>
            {description ? <p className="page-subtitle">{description}</p> : null}
          </div>
          <button type="button" className="btn-ghost text-xs" onClick={() => onOpenChange(false)}>
            Close
          </button>
        </div>
        {children}
      </div>
    </div>,
    document.body,
  );
}
