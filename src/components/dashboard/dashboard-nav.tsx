"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", short: "DB", description: "Stats overview" },
  { href: "/patients", label: "Patients", short: "PT", description: "Manage and review" },
  { href: "/beds", label: "Beds", short: "BD", description: "Assignments and ADT" },
] as const;

type DashboardNavProps = {
  collapsed?: boolean;
};

export function DashboardNav({ collapsed = false }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className="grid gap-2" aria-label="Dashboard navigation">
      {navItems.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <Link
            key={item.href}
            href={item.href}
            title={collapsed ? item.label : undefined}
            aria-label={item.label}
            className={`sidebar-link ${isActive ? "sidebar-link-active" : ""} ${
              collapsed ? "sidebar-link-collapsed" : ""
            }`}
          >
            <span className={`sidebar-icon-pill ${isActive ? "sidebar-icon-pill-active" : ""}`}>
              {item.short}
            </span>
            <span className={collapsed ? "hidden" : "grid gap-0.5"}>
              <span className="text-sm font-semibold tracking-tight">{item.label}</span>
              <span className="text-xs text-[var(--text-muted)]">{item.description}</span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
