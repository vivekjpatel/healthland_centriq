import Link from "next/link";
import { PatientIntakeForm } from "@/components/registration/patient-intake-form";
import { listBedBoard, listPatients } from "@/lib/phase1/service";
import { createClient } from "@/utils/supabase/server";

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
      <section className="surface-card p-5">
        <div className="section-header">
          <div>
            <p className="chip w-fit">Patient Management</p>
            <h2 className="page-title mt-2">Patient Directory</h2>
            <p className="page-subtitle">
              Register new patients and manage admission status from one page.
            </p>
          </div>
          <p className="chip">Intake + Manage</p>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <section className="surface-card p-5">
          <div className="section-header">
            <h3 className="text-lg font-semibold">All Patients</h3>
            <p className="chip">{patients.length} total</p>
          </div>
          <div className="mt-3 table-shell">
            <table className="app-table">
              <thead>
                <tr>
                  <th>MRN</th>
                  <th>Name</th>
                  <th>DOB</th>
                  <th>Admission</th>
                  <th>Registered At</th>
                </tr>
              </thead>
              <tbody>
                {patients.map((patient) => (
                  <tr key={patient.id}>
                    <td className="font-mono">{patient.mrn}</td>
                    <td>
                      <Link
                        href={`/patients/${patient.id}`}
                        className="font-medium text-[var(--secondary)] hover:underline"
                      >
                        {patient.first_name} {patient.last_name}
                      </Link>
                    </td>
                    <td>{patient.dob}</td>
                    <td>
                      <span className="chip">
                        {assignedPatientIds.has(patient.id) ? "Assigned bed" : "Waiting"}
                      </span>
                    </td>
                    <td>{new Date(patient.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {patients.length === 0 ? (
                  <tr>
                    <td className="text-[var(--text-muted)]" colSpan={5}>
                      No patients registered yet. Use the intake form to add the first patient.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          </div>
        </section>

        <PatientIntakeForm />
      </section>

      <section className="surface-card p-5">
        <div className="section-header">
          <h3 className="text-lg font-semibold">Management Actions</h3>
          <p className="chip">Fast Access</p>
        </div>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <Link href="/beds" className="action-tile text-sm">
            <p className="font-semibold">Go to Bed Management</p>
            <p className="text-[var(--text-muted)]">Assign, transfer, and discharge patients.</p>
          </Link>
          <Link href="/dashboard" className="action-tile text-sm">
            <p className="font-semibold">View Dashboard Stats</p>
            <p className="text-[var(--text-muted)]">Check census and occupancy KPIs.</p>
          </Link>
        </div>
      </section>
    </main>
  );
}
