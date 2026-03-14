import Link from "next/link";
import { PatientRowActions } from "@/components/patients/patient-row-actions";
import { PatientIntakeModal } from "@/components/registration/patient-intake-modal";
import { listBedBoard, listPatients } from "@/lib/phase1/service";
import { createClient } from "@/utils/supabase/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableShell,
} from "@/components/ui/table";

export default async function PatientsPage() {
  const supabase = await createClient();
  const [patients, bedBoard] = await Promise.all([
    listPatients(supabase),
    listBedBoard(supabase),
  ]);

  const assignedPatientIds = new Set(
    bedBoard
      .map((bed) => bed.patient?.id)
      .filter((patientId): patientId is string => Boolean(patientId)),
  );

  return (
    <main className="grid gap-6">
      <Card className="p-6 hero-card">
        <CardHeader>
          <div>
            <Badge className="w-fit">Patient Management</Badge>
            <h2 className="page-title mt-2">Patient Directory</h2>
            <p className="page-subtitle">
              Register new patients and manage admission status from one page.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge>Intake + Manage</Badge>
            <PatientIntakeModal />
          </div>
        </CardHeader>
      </Card>

      <section className="surface-card p-5">
        <div className="section-header">
          <h3 className="text-lg font-semibold">All Patients</h3>
          <p className="chip">{patients.length} total</p>
        </div>
        <TableShell className="mt-3">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>MRN</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>DOB</TableHead>
                <TableHead>Admission</TableHead>
                <TableHead>View</TableHead>
                <TableHead>Actions</TableHead>
                <TableHead>Registered At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patients.map((patient) => (
                <TableRow key={patient.id}>
                  <TableCell className="font-mono">{patient.mrn}</TableCell>
                  <TableCell>{patient.first_name} {patient.last_name}</TableCell>
                  <TableCell>{patient.dob}</TableCell>
                  <TableCell>
                    <span className="chip">
                      {assignedPatientIds.has(patient.id) ? "Assigned bed" : "Waiting"}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Link className="btn-primary px-3 py-2 text-xs" href={`/patient/${patient.id}`}>
                      View Patient
                    </Link>
                  </TableCell>
                  <TableCell>
                    <PatientRowActions patient={patient} />
                  </TableCell>
                  <TableCell>{new Date(patient.created_at).toLocaleString()}</TableCell>
                </TableRow>
              ))}
              {patients.length === 0 ? (
                <TableRow>
                  <TableCell className="text-[var(--text-muted)]" colSpan={7}>
                    No patients registered yet. Use the intake modal to add the first patient.
                  </TableCell>
                </TableRow>
              ) : null}
            </TableBody>
          </Table>
        </TableShell>
      </section>
    </main>
  );
}
