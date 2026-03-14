import { listBedBoard, listPatients, listUnassignedPatients } from "@/lib/phase1/service";
import { createClient } from "@/utils/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardDescription, CardHeader } from "@/components/ui/card";

export default async function DashboardPage() {
  const supabase = await createClient();
  const [patients, bedBoard, unassignedPatients] = await Promise.all([
    listPatients(supabase),
    listBedBoard(supabase),
    listUnassignedPatients(supabase),
  ]);

  const totalBeds = bedBoard.length;
  const occupiedBeds = bedBoard.filter((bed) => bed.status === "occupied").length;
  const occupancyRate = totalBeds === 0 ? 0 : Math.round((occupiedBeds / totalBeds) * 100);
  const assignableBeds = bedBoard.filter(
    (bed) => bed.status === "available" || bed.status === "reserved",
  ).length;

  return (
    <main className="grid gap-6">
      <Card className="p-6 hero-card">
        <CardHeader>
          <div>
            <Badge className="w-fit">Dashboard</Badge>
            <h2 className="page-title mt-2">Operations Snapshot</h2>
            <CardDescription>Live operational stats for patient flow and bed utilization.</CardDescription>
          </div>
        </CardHeader>
      </Card>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <article className="metric-card">
          <p className="metric-label">Total Patients</p>
          <p className="metric-value">{patients.length}</p>
          <p className="metric-note">Registered in organization</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Bed Occupancy</p>
          <p className="metric-value">
            {occupiedBeds}/{totalBeds}
          </p>
          <p className="metric-note">{occupancyRate}% occupied</p>
          <div className="kpi-bar" aria-hidden="true">
            <span style={{ width: `${occupancyRate}%` }} />
          </div>
        </article>
        <article className="metric-card">
          <p className="metric-label">Waiting For Bed</p>
          <p className="metric-value">{unassignedPatients.length}</p>
          <p className="metric-note">Patients pending assignment</p>
        </article>
        <article className="metric-card">
          <p className="metric-label">Assignable Beds</p>
          <p className="metric-value">{assignableBeds}</p>
          <p className="metric-note">Available or reserved</p>
        </article>
      </section>
    </main>
  );
}
