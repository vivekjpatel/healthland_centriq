"use client";

import { useActionState } from "react";
import { createPatientAction, type ActionResult } from "@/actions/registration";

const initialState: ActionResult = {
  ok: true,
  message: "",
};

export function PatientIntakeForm() {
  const [state, formAction, pending] = useActionState(createPatientAction, initialState);

  return (
    <form action={formAction} className="surface-card grid gap-4 p-5">
      <div className="section-header">
        <div>
          <h2 className="text-lg font-semibold">New Patient Intake</h2>
          <p className="page-subtitle">Capture identity and coverage in under a minute.</p>
        </div>
        <span className="chip">Step 1 of 2</span>
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Patient Identity</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Medical record number (MRN)</span>
          <input name="mrn" required className="app-input" placeholder="e.g. CAH-10452" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Date of Birth</span>
          <input name="dob" type="date" required className="app-input" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">First Name</span>
          <input name="firstName" required className="app-input" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Last Name</span>
          <input name="lastName" required className="app-input" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Sex at Birth</span>
          <select name="sexAtBirth" className="app-input">
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="intersex">Intersex</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Phone</span>
          <input name="phone" className="app-input" placeholder="+1 555 123 4567" />
        </label>
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Address</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1.5 md:col-span-2">
          <span className="text-sm font-medium">Address Line 1</span>
          <input name="addressLine1" className="app-input" placeholder="123 Main St" />
        </label>
        <label className="grid gap-1.5 md:col-span-2">
          <span className="text-sm font-medium">Address Line 2</span>
          <input name="addressLine2" className="app-input" placeholder="Apt, suite, unit (optional)" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">City</span>
          <input name="city" className="app-input" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">State</span>
          <input name="state" className="app-input" placeholder="CA" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Postal Code</span>
          <input name="postalCode" className="app-input" placeholder="94103" />
        </label>
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Insurance & Guarantor</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Insurance Payer</span>
          <input name="insurancePayer" className="app-input" placeholder="Medicare / BCBS" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Plan</span>
          <input name="insurancePlan" className="app-input" placeholder="Gold Plus" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Member ID</span>
          <input name="memberId" className="app-input" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Group Number</span>
          <input name="groupNumber" className="app-input" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Guarantor Name</span>
          <input name="guarantorName" className="app-input" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Guarantor Relationship</span>
          <input name="guarantorRelationship" className="app-input" placeholder="Self / Spouse / Parent" />
        </label>
      </div>

      <button type="submit" disabled={pending} className="btn-primary w-fit">
        {pending ? "Registering..." : "Register Patient"}
      </button>

      {state.message ? (
        <p
          aria-live="polite"
          className={`text-sm font-medium ${state.ok ? "text-emerald-700" : "text-[var(--danger)]"}`}
        >
          {state.message}
        </p>
      ) : null}
    </form>
  );
}
