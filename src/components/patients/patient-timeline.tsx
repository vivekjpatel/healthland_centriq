type TimelineEvent = {
  id: string;
  event_type: "registration_created" | "bed_assigned" | "bed_transferred" | "bed_discharged";
  payload: unknown;
  occurred_at: string;
};

type PatientTimelineProps = {
  patient: {
    id: string;
    mrn: string;
    first_name: string;
    last_name: string;
    dob: string;
  };
  events: TimelineEvent[];
};

const eventLabel: Record<TimelineEvent["event_type"], string> = {
  registration_created: "Registration Created",
  bed_assigned: "Bed Assigned",
  bed_transferred: "Bed Transferred",
  bed_discharged: "Patient Discharged",
};

function renderPayload(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  return JSON.stringify(payload, null, 2);
}

export function PatientTimeline({ patient, events }: PatientTimelineProps) {
  return (
    <div className="grid gap-5">
      <section className="surface-card p-5">
        <p className="chip w-fit">Patient Profile</p>
        <h1 className="mt-2 text-2xl font-semibold">
          {patient.first_name} {patient.last_name}
        </h1>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <p className="chip">MRN {patient.mrn}</p>
          <p className="chip">DOB {patient.dob}</p>
        </div>
      </section>

      <section className="surface-card p-5">
        <h2 className="text-lg font-semibold">ADT Timeline</h2>
        <p className="page-subtitle">Most recent events appear first for rapid handoff review.</p>
        <ul className="mt-3 grid gap-3">
          {events.map((event) => (
            <li key={event.id} className="rounded-xl border border-[var(--border)] bg-[var(--surface-muted)] p-3">
              <p className="text-sm font-semibold">{eventLabel[event.event_type]}</p>
              <p className="mt-0.5 text-xs text-[var(--text-muted)]">
                {new Date(event.occurred_at).toLocaleString()}
              </p>
              {event.payload ? (
                <pre className="mt-2 overflow-x-auto rounded-lg border border-[var(--border)] bg-white p-2 text-xs">
                  {renderPayload(event.payload)}
                </pre>
              ) : null}
            </li>
          ))}
          {events.length === 0 ? <li className="text-sm text-[var(--text-muted)]">No events found.</li> : null}
        </ul>
      </section>
    </div>
  );
}
