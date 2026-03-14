import Link from "next/link";
import { PatientTimeline } from "@/components/patients/patient-timeline";
import { getPatientTimeline } from "@/lib/phase1/service";
import { createClient } from "@/utils/supabase/server";

type PatientPageProps = {
  params: Promise<{ patientId: string }>;
};

export default async function PatientPage({ params }: PatientPageProps) {
  const { patientId } = await params;
  const supabase = await createClient();
  const timeline = await getPatientTimeline(supabase, patientId);

  return (
    <main className="grid max-w-5xl gap-6">
      <div>
        <Link href="/patients" className="text-sm font-medium text-[var(--secondary)] hover:underline">
          Back to patient directory
        </Link>
      </div>
      <PatientTimeline patient={timeline.patient} events={timeline.events} />
    </main>
  );
}
