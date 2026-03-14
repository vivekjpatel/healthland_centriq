import Link from "next/link";
import { PatientClinicalWorkbench } from "@/components/patients/patient-clinical-workbench";
import { getPatientClinicalWorkspace } from "@/lib/phase1/service";
import { createClient } from "@/utils/supabase/server";

type PatientPageProps = {
  params: Promise<{ patientId: string }>;
  searchParams: Promise<{ tab?: string }>;
};

const allowedTabs = new Set(["overview", "clinical", "orders", "revenue", "audit"]);

export default async function PatientPage({ params, searchParams }: PatientPageProps) {
  const { patientId } = await params;
  const { tab } = await searchParams;
  const initialTab = tab && allowedTabs.has(tab) ? tab : "overview";
  const supabase = await createClient();
  const workspace = await getPatientClinicalWorkspace(supabase, patientId);

  return (
    <main className="grid max-w-5xl gap-6">
      <div>
        <Link href="/patients" className="text-sm font-medium text-[var(--secondary)] hover:underline">
          Back to patient directory
        </Link>
      </div>
      <PatientClinicalWorkbench
        data={workspace}
        initialTab={initialTab as "overview" | "clinical" | "orders" | "revenue" | "audit"}
      />
    </main>
  );
}
