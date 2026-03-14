"use client";

import { useState } from "react";
import {
  addAllergyAction,
  addCarePlanAction,
  addChargeAction,
  addClaimAction,
  addNoteAction,
  addOrderAction,
  addPaymentAction,
  addProblemAction,
  addVitalsAction,
  createEncounterAction,
  signNoteAction,
  updateClaimStatusAction,
  updateOrderStatusAction,
} from "@/actions/clinical-core";
import { FormPendingBridge } from "@/components/ui/form-pending-bridge";

type WorkspaceData = {
  patient: {
    id: string;
    mrn: string;
    first_name: string;
    last_name: string;
    dob: string;
  };
  encounters: Array<{ id: string; encounter_type: string; status: string; admitted_at: string; discharged_at: string | null }>;
  problems: Array<{ id: string; icd_code: string | null; description: string; status: string; onset_date: string | null }>;
  allergies: Array<{ id: string; allergen: string; reaction: string | null; severity: string | null; status: string }>;
  vitals: Array<{ id: string; vital_type: string; value: string; unit: string | null; recorded_at: string }>;
  notes: Array<{ id: string; note_type: string; status: string; content: string; authored_at: string; signed_at: string | null }>;
  orders: Array<{ id: string; order_type: string; priority: string; status: string; indication: string | null; instructions: string | null; created_at: string }>;
  charges: Array<{ id: string; cpt_code: string | null; description: string; total_amount: number; status: string }>;
  claims: Array<{ id: string; charge_id: string; payer: string; status: string; denial_reason: string | null }>;
  payments: Array<{ id: string; claim_id: string; amount: number; payment_method: string | null; posted_at: string }>;
  carePlans: Array<{ id: string; title: string; goal: string | null; intervention: string | null; outcome: string | null; status: string }>;
  events: Array<{ id: string; event_type: string; payload: unknown; occurred_at: string }>;
};

type TabKey = "overview" | "clinical" | "orders" | "revenue" | "audit";

const tabs: Array<{ key: TabKey; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "clinical", label: "Clinical Docs" },
  { key: "orders", label: "Orders" },
  { key: "revenue", label: "Revenue" },
  { key: "audit", label: "Audit" },
];

function payloadText(payload: unknown) {
  if (!payload) return "";
  if (typeof payload !== "object") return String(payload);
  return JSON.stringify(payload, null, 2);
}

export function PatientClinicalWorkbench({
  data,
  initialTab = "overview",
}: {
  data: WorkspaceData;
  initialTab?: TabKey;
}) {
  const { patient } = data;
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  return (
    <div className="grid gap-6">
      <section className="surface-card p-5">
        <div className="section-header">
          <div>
            <p className="chip w-fit">Patient Chart</p>
            <h1 className="mt-2 text-2xl font-semibold">
              {patient.first_name} {patient.last_name}
            </h1>
          </div>
          <div className="flex flex-wrap gap-2 text-sm">
            <span className="chip">MRN {patient.mrn}</span>
            <span className="chip">DOB {patient.dob}</span>
          </div>
        </div>
        <div className="tab-list mt-4" role="tablist" aria-label="Patient workbench tabs">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.key}
              className={`tab-btn ${activeTab === tab.key ? "tab-btn-active" : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </section>

      {activeTab === "overview" ? (
        <section className="grid gap-4 xl:grid-cols-3">
          <article className="surface-card p-4">
            <h2 className="text-base font-semibold">Encounters</h2>
            <form action={createEncounterAction} className="mt-3 grid gap-2">
              <FormPendingBridge />
              <input type="hidden" name="patientId" value={patient.id} />
              <select name="encounterType" className="app-input" required>
                <option value="">Encounter type</option>
                <option value="inpatient">Inpatient</option>
                <option value="outpatient">Outpatient</option>
                <option value="ed">Emergency</option>
                <option value="telehealth">Telehealth</option>
              </select>
              <button className="btn-primary" type="submit">Create Encounter</button>
            </form>
            <ul className="mt-3 grid gap-2 text-sm">
              {data.encounters.slice(0, 5).map((encounter) => (
                <li key={encounter.id} className="action-tile">
                  <p className="font-semibold">{encounter.encounter_type}</p>
                  <p className="text-[var(--text-muted)]">{encounter.status}</p>
                </li>
              ))}
            </ul>
          </article>

          <article className="surface-card p-4">
            <h2 className="text-base font-semibold">Problems</h2>
            <form action={addProblemAction} className="mt-3 grid gap-2">
              <FormPendingBridge />
              <input type="hidden" name="patientId" value={patient.id} />
              <input name="icdCode" className="app-input" placeholder="ICD code" />
              <input name="description" className="app-input" placeholder="Problem description" required />
              <input name="onsetDate" type="date" className="app-input" />
              <button className="btn-primary" type="submit">Add Problem</button>
            </form>
            <ul className="mt-3 grid gap-2 text-sm">
              {data.problems.slice(0, 5).map((problem) => (
                <li key={problem.id} className="action-tile">
                  <p className="font-semibold">{problem.description}</p>
                  <p className="text-[var(--text-muted)]">{problem.status}</p>
                </li>
              ))}
            </ul>
          </article>

          <article className="surface-card p-4">
            <h2 className="text-base font-semibold">Allergies</h2>
            <form action={addAllergyAction} className="mt-3 grid gap-2">
              <FormPendingBridge />
              <input type="hidden" name="patientId" value={patient.id} />
              <input name="allergen" className="app-input" placeholder="Allergen" required />
              <input name="reaction" className="app-input" placeholder="Reaction" />
              <select name="severity" className="app-input">
                <option value="">Severity</option>
                <option value="mild">Mild</option>
                <option value="moderate">Moderate</option>
                <option value="severe">Severe</option>
              </select>
              <button className="btn-primary" type="submit">Add Allergy</button>
            </form>
            <ul className="mt-3 grid gap-2 text-sm">
              {data.allergies.slice(0, 5).map((allergy) => (
                <li key={allergy.id} className="action-tile">
                  <p className="font-semibold">{allergy.allergen}</p>
                  <p className="text-[var(--text-muted)]">{allergy.severity ?? "n/a"}</p>
                </li>
              ))}
            </ul>
          </article>
        </section>
      ) : null}

      {activeTab === "clinical" ? (
        <section className="surface-card p-4">
          <h2 className="text-base font-semibold">Clinical Documentation</h2>
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <form action={addVitalsAction} className="grid gap-2">
              <FormPendingBridge />
              <input type="hidden" name="patientId" value={patient.id} />
              <input name="vitalType" className="app-input" placeholder="Vital type" required />
              <input name="value" className="app-input" placeholder="Value" required />
              <input name="unit" className="app-input" placeholder="Unit" />
              <button className="btn-primary" type="submit">Record Vital</button>
            </form>

            <form action={addCarePlanAction} className="grid gap-2">
              <FormPendingBridge />
              <input type="hidden" name="patientId" value={patient.id} />
              <input name="title" className="app-input" placeholder="Care plan title" required />
              <input name="goal" className="app-input" placeholder="Goal" />
              <input name="intervention" className="app-input" placeholder="Intervention" />
              <input name="outcome" className="app-input" placeholder="Outcome" />
              <button className="btn-primary" type="submit">Save Care Plan</button>
            </form>
          </div>

          <form action={addNoteAction} className="mt-3 grid gap-2">
            <FormPendingBridge />
            <input type="hidden" name="patientId" value={patient.id} />
            <select name="noteType" className="app-input" required>
              <option value="">Note type</option>
              <option value="progress">Progress</option>
              <option value="nursing">Nursing</option>
              <option value="physician">Physician</option>
              <option value="discharge">Discharge</option>
              <option value="care_plan">Care Plan</option>
            </select>
            <textarea name="content" rows={4} className="app-input" placeholder="Clinical note" required />
            <button className="btn-primary" type="submit">Create Note Draft</button>
          </form>

          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            <ul className="grid gap-2 text-sm">
              {data.notes.slice(0, 8).map((note) => (
                <li key={note.id} className="action-tile">
                  <div className="section-header">
                    <p className="font-semibold">{note.note_type}</p>
                    <span className="chip">{note.status}</span>
                  </div>
                  <p className="mt-1 text-[var(--text-muted)]">{note.content}</p>
                  {note.status !== "signed" ? (
                    <form action={signNoteAction} className="mt-2">
                      <FormPendingBridge />
                      <input type="hidden" name="patientId" value={patient.id} />
                      <input type="hidden" name="noteId" value={note.id} />
                      <button className="btn-ghost text-xs" type="submit">Sign Note</button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>

            <ul className="grid gap-2 text-sm">
              {data.vitals.slice(0, 8).map((vital) => (
                <li key={vital.id} className="action-tile">
                  <p className="font-semibold">{vital.vital_type}</p>
                  <p className="text-[var(--text-muted)]">
                    {vital.value} {vital.unit ?? ""}
                  </p>
                  <p className="text-[var(--text-muted)]">{new Date(vital.recorded_at).toLocaleString()}</p>
                </li>
              ))}
              {data.carePlans.slice(0, 5).map((plan) => (
                <li key={plan.id} className="action-tile">
                  <p className="font-semibold">Care Plan: {plan.title}</p>
                  <p className="text-[var(--text-muted)]">{plan.goal ?? "No goal"}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {activeTab === "orders" ? (
        <section className="surface-card p-4">
          <h2 className="text-base font-semibold">Physician Orders (CPOE)</h2>
          <form action={addOrderAction} className="mt-3 grid gap-2">
            <FormPendingBridge />
            <input type="hidden" name="patientId" value={patient.id} />
            <div className="grid gap-2 md:grid-cols-2">
              <select name="orderType" className="app-input" required>
                <option value="">Order type</option>
                <option value="medication">Medication</option>
                <option value="lab">Lab</option>
                <option value="imaging">Imaging</option>
                <option value="procedure">Procedure</option>
                <option value="treatment">Treatment</option>
              </select>
              <select name="priority" className="app-input" required>
                <option value="routine">Routine</option>
                <option value="urgent">Urgent</option>
                <option value="stat">STAT</option>
              </select>
            </div>
            <input name="indication" className="app-input" placeholder="Indication" />
            <textarea name="instructions" rows={3} className="app-input" placeholder="Instructions" />
            <button className="btn-primary" type="submit">Create Order</button>
          </form>

          <ul className="mt-3 grid gap-2 text-sm">
            {data.orders.slice(0, 12).map((order) => (
              <li key={order.id} className="action-tile">
                <div className="section-header">
                  <p className="font-semibold">{order.order_type}</p>
                  <span className="chip">{order.status}</span>
                </div>
                <p className="text-[var(--text-muted)]">Priority: {order.priority}</p>
                <form action={updateOrderStatusAction} className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                  <FormPendingBridge />
                  <input type="hidden" name="patientId" value={patient.id} />
                  <input type="hidden" name="orderId" value={order.id} />
                  <select name="status" className="app-input" defaultValue={order.status}>
                    <option value="signed">Signed</option>
                    <option value="acknowledged">Acknowledged</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="canceled">Canceled</option>
                  </select>
                  <input name="cancellationReason" className="app-input" placeholder="Cancel reason (if canceled)" />
                  <button className="btn-ghost text-xs" type="submit">Update</button>
                </form>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {activeTab === "revenue" ? (
        <section className="surface-card p-4">
          <h2 className="text-base font-semibold">Revenue Cycle</h2>
          <div className="mt-3 grid gap-3 xl:grid-cols-3">
            <form action={addChargeAction} className="grid gap-2">
              <FormPendingBridge />
              <input type="hidden" name="patientId" value={patient.id} />
              <input name="description" className="app-input" placeholder="Charge description" required />
              <input name="cptCode" className="app-input" placeholder="CPT code" />
              <input name="units" type="number" min="1" defaultValue="1" className="app-input" required />
              <input name="unitAmount" type="number" min="0" step="0.01" className="app-input" placeholder="Unit amount" required />
              <button className="btn-primary" type="submit">Create Charge</button>
            </form>

            <form action={addClaimAction} className="grid gap-2">
              <FormPendingBridge />
              <input type="hidden" name="patientId" value={patient.id} />
              <select name="chargeId" className="app-input" required>
                <option value="">Select charge</option>
                {data.charges.map((charge) => (
                  <option key={charge.id} value={charge.id}>{charge.description} (${charge.total_amount})</option>
                ))}
              </select>
              <input name="payer" className="app-input" placeholder="Payer" required />
              <button className="btn-primary" type="submit">Generate Claim</button>
            </form>

            <form action={addPaymentAction} className="grid gap-2">
              <FormPendingBridge />
              <input type="hidden" name="patientId" value={patient.id} />
              <select name="claimId" className="app-input" required>
                <option value="">Select claim</option>
                {data.claims.map((claim) => (
                  <option key={claim.id} value={claim.id}>{claim.payer} ({claim.status})</option>
                ))}
              </select>
              <input name="amount" type="number" step="0.01" className="app-input" placeholder="Payment amount" required />
              <input name="paymentMethod" className="app-input" placeholder="Payment method" />
              <input name="referenceNumber" className="app-input" placeholder="Reference" />
              <button className="btn-primary" type="submit">Post Payment</button>
            </form>
          </div>

          <div className="mt-3 grid gap-3 xl:grid-cols-2">
            <ul className="grid gap-2 text-sm">
              {data.claims.slice(0, 8).map((claim) => (
                <li key={claim.id} className="action-tile">
                  <div className="section-header">
                    <p className="font-semibold">{claim.payer}</p>
                    <span className="chip">{claim.status}</span>
                  </div>
                  <form action={updateClaimStatusAction} className="mt-2 grid gap-2 md:grid-cols-[1fr_1fr_auto]">
                    <FormPendingBridge />
                    <input type="hidden" name="patientId" value={patient.id} />
                    <input type="hidden" name="claimId" value={claim.id} />
                    <select name="status" className="app-input" defaultValue={claim.status === "draft" ? "submitted" : claim.status}>
                      <option value="submitted">Submitted</option>
                      <option value="paid">Paid</option>
                      <option value="partial">Partial</option>
                      <option value="denied">Denied</option>
                    </select>
                    <input name="denialReason" className="app-input" placeholder="Denial reason" />
                    <button className="btn-ghost text-xs" type="submit">Update</button>
                  </form>
                </li>
              ))}
            </ul>

            <ul className="grid gap-2 text-sm">
              {data.payments.slice(0, 8).map((payment) => (
                <li key={payment.id} className="action-tile">
                  <p className="font-semibold">${payment.amount.toFixed(2)}</p>
                  <p className="text-[var(--text-muted)]">
                    Claim {payment.claim_id.slice(0, 8)} · {payment.payment_method ?? "method n/a"}
                  </p>
                  <p className="text-[var(--text-muted)]">{new Date(payment.posted_at).toLocaleString()}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      ) : null}

      {activeTab === "audit" ? (
        <section className="surface-card p-4">
          <h2 className="text-base font-semibold">Audit Timeline</h2>
          <ul className="mt-3 grid gap-2 text-sm">
            {data.events.map((event) => (
              <li key={event.id} className="action-tile">
                <p className="font-semibold">{event.event_type.replaceAll("_", " ")}</p>
                <p className="text-[var(--text-muted)]">{new Date(event.occurred_at).toLocaleString()}</p>
                {event.payload ? (
                  <pre className="mt-2 overflow-x-auto rounded-lg border border-[var(--border)] bg-white p-2 text-xs">
                    {payloadText(event.payload)}
                  </pre>
                ) : null}
              </li>
            ))}
            {data.events.length === 0 ? (
              <li className="text-sm text-[var(--text-muted)]">No events found.</li>
            ) : null}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
