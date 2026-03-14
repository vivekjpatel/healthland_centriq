import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { createClient } from "@/utils/supabase/server";

type DashboardLayoutProps = {
  children: React.ReactNode;
};

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const now = new Intl.DateTimeFormat("en-US", {
    dateStyle: "full",
  }).format(new Date());

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  const metadata = data.user?.user_metadata;
  const userDisplayName =
    metadata?.full_name ??
    metadata?.name ??
    data.user?.email ??
    "Care Team Member";

  return (
    <DashboardShell now={now} userDisplayName={userDisplayName}>
      {children}
    </DashboardShell>
  );
}
