import { DashboardShell } from "@/components/dashboard/dashboard-shell";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const now = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
  }).format(new Date());

  return <DashboardShell now={now}>{children}</DashboardShell>;
}
