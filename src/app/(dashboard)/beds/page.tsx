import Link from "next/link";
import { BedBoard } from "@/components/beds/bed-board";
import { listBedBoard, listUnassignedPatients } from "@/lib/phase1/service";
import { createClient } from "@/utils/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";

export default async function BedsPage() {
  const supabase = await createClient();
  const [beds, unassignedPatients] = await Promise.all([
    listBedBoard(supabase),
    listUnassignedPatients(supabase),
  ]);

  return (
    <main className="grid gap-6">
      <Card className="p-6 hero-card">
        <CardHeader>
          <div>
          <Badge className="w-fit">Inpatient Operations</Badge>
          <h1 className="page-title mt-2">Bed Management</h1>
          <p className="page-subtitle">Track occupancy, transfer flow, and discharge actions in real time.</p>
        </div>
          <Link href="/patients">
            <Button variant="outline" size="sm">View Patients</Button>
          </Link>
        </CardHeader>
      </Card>

      <BedBoard beds={beds} unassignedPatients={unassignedPatients} />
    </main>
  );
}
