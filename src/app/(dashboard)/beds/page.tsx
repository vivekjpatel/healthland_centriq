import Link from "next/link";
import { BedBoard } from "@/components/beds/bed-board";
import { listBedBoard, listUnassignedPatients } from "@/lib/phase1/service";
import { createClient } from "@/utils/supabase/server";

export default async function BedsPage() {
  const supabase = await createClient();
  const [beds, unassignedPatients] = await Promise.all([
    listBedBoard(supabase),
    listUnassignedPatients(supabase),
  ]);

  return (
    <main className="grid gap-6">
      <header className="section-header surface-card p-5">
        <div>
          <p className="chip w-fit">Inpatient Operations</p>
          <h1 className="page-title mt-2">Bed Management</h1>
          <p className="page-subtitle">Track occupancy, transfer flow, and discharge actions in real time.</p>
        </div>
        <Link href="/patients" className="btn-ghost text-sm">
          View Patients
        </Link>
      </header>

      <BedBoard beds={beds} unassignedPatients={unassignedPatients} />
    </main>
  );
}
