import Link from "next/link";
import { assignBedAction, dischargePatientAction } from "@/actions/bed-management";
import { TransferDialog } from "@/components/beds/transfer-dialog";
import { FormPendingBridge } from "@/components/ui/form-pending-bridge";

type PatientLite = {
  id: string;
  first_name: string;
  last_name: string;
  mrn: string;
};

type BedRow = {
  id: string;
  unit: string;
  room: string;
  bed_label: string;
  status: "available" | "occupied" | "cleaning" | "maintenance" | "reserved";
  acuity_level: string | null;
  patient?: PatientLite;
};

type BedBoardProps = {
  beds: BedRow[];
  unassignedPatients: Array<{ id: string; mrn: string; first_name: string; last_name: string }>;
};

const statuses: BedRow["status"][] = [
  "available",
  "occupied",
  "reserved",
  "cleaning",
  "maintenance",
];

const statusStyles: Record<BedRow["status"], string> = {
  available: "bg-emerald-50 text-emerald-700 border-emerald-200",
  occupied: "bg-sky-50 text-sky-700 border-sky-200",
  reserved: "bg-amber-50 text-amber-700 border-amber-200",
  cleaning: "bg-cyan-50 text-cyan-700 border-cyan-200",
  maintenance: "bg-rose-50 text-rose-700 border-rose-200",
};

export function BedBoard({ beds, unassignedPatients }: BedBoardProps) {
  const availableBeds = beds
    .filter((bed) => bed.status === "available" || bed.status === "reserved")
    .map((bed) => ({
      id: bed.id,
      label: `${bed.unit} ${bed.room}-${bed.bed_label}`,
    }));

  return (
    <div className="grid gap-6">
      <div className="surface-card p-6">
        <div className="section-header">
          <h2 className="text-lg font-semibold">Assign Patient to Bed</h2>
          <p className="chip">{availableBeds.length} assignable beds</p>
        </div>
        <form action={assignBedAction} className="mt-3 grid gap-3 lg:grid-cols-3">
          <FormPendingBridge />
          <select name="patientId" required className="app-input">
            <option value="">Select unassigned patient</option>
            {unassignedPatients.map((patient) => (
              <option key={patient.id} value={patient.id}>
                {patient.mrn} - {patient.first_name} {patient.last_name}
              </option>
            ))}
          </select>

          <select name="bedId" required className="app-input">
            <option value="">Select bed</option>
            {availableBeds.map((bed) => (
              <option key={bed.id} value={bed.id}>
                {bed.label}
              </option>
            ))}
          </select>

          <button className="btn-primary" type="submit">
            Assign
          </button>
        </form>
        {unassignedPatients.length === 0 ? (
          <p className="mt-3 text-sm text-[var(--text-muted)]">
            No unassigned patients available. Intake a new patient from the Patients page.
          </p>
        ) : null}
      </div>

      <div className="grid gap-4 xl:grid-cols-5">
        {statuses.map((status) => {
          const group = beds.filter((bed) => bed.status === status);
          return (
            <section key={status} className="surface-card p-4">
              <h3
                className={`mb-3 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${statusStyles[status]}`}
              >
                <span className="status-dot bg-current" />
                {status} ({group.length})
              </h3>
              <div className="grid gap-2">
                {group.map((bed) => (
                  <article key={bed.id} className="action-tile text-sm">
                    <p className="font-semibold">
                      {bed.unit} {bed.room}-{bed.bed_label}
                    </p>
                    <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                      Acuity: <span className="font-medium">{bed.acuity_level ?? "n/a"}</span>
                    </p>
                    {bed.patient ? (
                      <>
                        <p className="mt-3 text-xs">
                          <Link className="font-semibold text-[var(--secondary)] hover:underline" href={`/patients/${bed.patient.id}`}>
                            {bed.patient.first_name} {bed.patient.last_name}
                          </Link>{" "}
                          (MRN {bed.patient.mrn})
                        </p>
                        <div className="mt-3 grid gap-2">
                          <form action={dischargePatientAction}>
                            <FormPendingBridge />
                            <input type="hidden" name="patientId" value={bed.patient.id} />
                            <input type="hidden" name="bedId" value={bed.id} />
                            <button className="btn-danger w-full text-xs" type="submit">
                              Discharge
                            </button>
                          </form>
                          <TransferDialog
                            patientId={bed.patient.id}
                            currentBedId={bed.id}
                            availableBeds={availableBeds.filter((option) => option.id !== bed.id)}
                          />
                        </div>
                      </>
                    ) : (
                      <p className="mt-3 text-xs text-[var(--text-muted)]">No active assignment</p>
                    )}
                  </article>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
