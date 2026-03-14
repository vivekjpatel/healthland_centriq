"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navItems = [
  { href: "/dashboard", label: "Dashboard", description: "Stats overview" },
  { href: "/patients", label: "Patients", description: "Manage and review" },
  { href: "/beds", label: "Beds", description: "Assignments and ADT" },
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
            className={`sidebar-link ${isActive ? "sidebar-link-active" : ""}`}
          >
            <span className="text-sm font-semibold">{collapsed ? item.label.slice(0, 1) : item.label}</span>
            {!collapsed ? (
              <span className="text-xs text-[var(--text-muted)]">{item.description}</span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
