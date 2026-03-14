"use client";

import { useState } from "react";
import Link from "next/link";
import { signOutAction } from "@/actions/auth";
import { DashboardNav } from "@/components/dashboard/dashboard-nav";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FormPendingBridge } from "@/components/ui/form-pending-bridge";

type DashboardShellProps = {
  now: string;
  userDisplayName: string;
  children: React.ReactNode;
};

export function DashboardShell({ now, userDisplayName, children }: DashboardShellProps) {
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.localStorage.getItem("dashboard_sidebar_collapsed") === "1";
  });

  function handleCollapseToggle() {
    setCollapsed((value) => {
      const next = !value;
      window.localStorage.setItem("dashboard_sidebar_collapsed", next ? "1" : "0");
      return next;
    });
  }

  return (
    <div className={`dashboard-grid ${collapsed ? "dashboard-grid-collapsed" : ""}`}>
      <aside className={`dashboard-sidebar ${collapsed ? "dashboard-sidebar-collapsed" : ""}`}>
        <div className="section-header">
          <Link href="/dashboard" className="block" title="Go to dashboard home">
            <Badge className="w-fit">{collapsed ? "HC" : "Healthland Centriq"}</Badge>
            {!collapsed ? (
              <>
                <h1 className="mt-3 text-xl font-bold leading-tight">Care Operations</h1>
                <p className="mt-1 text-sm text-[var(--text-muted)]">Intake and bed coordination.</p>
              </>
            ) : null}
          </Link>
          <Button
            type="button"
            onClick={handleCollapseToggle}
            className="sidebar-toggle"
            aria-expanded={!collapsed}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            variant="outline"
            size="xs"
          >
            {collapsed ? ">>" : "<<"}
          </Button>
        </div>
        <DashboardNav collapsed={collapsed} />
        {!collapsed ? (
          <form action={signOutAction} className="mt-auto">
            <FormPendingBridge />
            <Button type="submit" variant="outline" className="w-full justify-center">
              Logout
            </Button>
          </form>
        ) : (
          <form action={signOutAction} className="mt-auto">
            <FormPendingBridge />
            <Button type="submit" variant="outline" size="xs" className="w-full" title="Logout">
              LO
            </Button>
          </form>
        )}
      </aside>

      <section className="dashboard-main">
        <header className="dashboard-topbar">
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--text-muted)]">
              Hospital Operations Dashboard
            </p>
            <p className="mt-1 text-sm text-[var(--text-muted)]">{now}</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge className="hidden border border-[var(--border)] bg-transparent text-[var(--text-muted)] sm:inline-flex">
              {userDisplayName}
            </Badge>
            <Badge>Live operational view</Badge>
            <Link href="/patients" className="hidden lg:block">
              <Button variant="outline" size="sm">Patients</Button>
            </Link>
          </div>
        </header>

        <div className="dashboard-content">{children}</div>
      </section>
    </div>
  );
}
