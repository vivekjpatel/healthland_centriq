"use client";

import { useState } from "react";
import Link from "next/link";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";

type DashboardShellProps = {
  now: string;
  children: React.ReactNode;
};

export function DashboardShell({ now, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`dashboard-grid ${collapsed ? "dashboard-grid-collapsed" : ""}`}>
      <aside className={`dashboard-sidebar ${collapsed ? "dashboard-sidebar-collapsed" : ""}`}>
        <div className="section-header">
          <Link href="/dashboard" className="block">
            <p className="chip w-fit">Centriq</p>
            {!collapsed ? (
              <>
                <h1 className="mt-3 text-xl font-bold leading-tight">Care Operations</h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Intake and bed coordination.</p>
              </>
            ) : null}
          </Link>
          <button
            type="button"
            onClick={() => setCollapsed((value) => !value)}
            className="sidebar-toggle"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? ">" : "<"}
          </button>
        </div>
        <DashboardNav collapsed={collapsed} />
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">
              Hospital Operations Dashboard
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{now}</p>
          </div>
          <div className="chip">Live operational view</div>
        </header>

        <div className="dashboard-content">{children}</div>
      </section>
    </div>
  );
}
