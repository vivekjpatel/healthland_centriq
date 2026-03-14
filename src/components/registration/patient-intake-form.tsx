"use client";

import { useActionState } from "react";
import { createPatientAction, type ActionResult } from "@/actions/registration";
import { FormPendingBridge } from "@/components/ui/form-pending-bridge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type PatientIntakeFormProps = {
  embedded?: boolean;
  showHeader?: boolean;
};

const initialState: ActionResult = {
  ok: true,
  message: "",
};

export function PatientIntakeForm({ embedded = false, showHeader = true }: PatientIntakeFormProps) {
  const [state, formAction, pending] = useActionState(createPatientAction, initialState);

  return (
    <form action={formAction} className={embedded ? "grid gap-4" : "surface-card grid gap-4 p-5"}>
      <FormPendingBridge />
      {showHeader ? (
        <div className="section-header">
          <div>
            <h2 className={`font-semibold ${embedded ? "text-base" : "text-lg"}`}>New Patient Intake</h2>
            <p className="page-subtitle">Capture identity and coverage in under a minute.</p>
          </div>
          <span className="chip">Step 1 of 2</span>
        </div>
      ) : null}

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Patient Identity</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Medical record number (MRN)</span>
          <Input name="mrn" required placeholder="e.g. CAH-10452" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Date of Birth</span>
          <Input name="dob" type="date" required />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">First Name</span>
          <Input name="firstName" required />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Last Name</span>
          <Input name="lastName" required />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Sex at Birth</span>
          <Select name="sexAtBirth">
            <option value="">Select</option>
            <option value="female">Female</option>
            <option value="male">Male</option>
            <option value="intersex">Intersex</option>
            <option value="unknown">Unknown</option>
          </Select>
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Phone</span>
          <Input name="phone" placeholder="+1 555 123 4567" />
        </label>
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Address</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1.5 md:col-span-2">
          <span className="text-sm font-medium">Address Line 1</span>
          <Input name="addressLine1" placeholder="123 Main St" />
        </label>
        <label className="grid gap-1.5 md:col-span-2">
          <span className="text-sm font-medium">Address Line 2</span>
          <Input name="addressLine2" placeholder="Apt, suite, unit (optional)" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">City</span>
          <Input name="city" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">State</span>
          <Input name="state" placeholder="CA" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Postal Code</span>
          <Input name="postalCode" placeholder="94103" />
        </label>
      </div>

      <div className="grid gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-muted)]">Insurance & Guarantor</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Insurance Payer</span>
          <Input name="insurancePayer" placeholder="Medicare / BCBS" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Plan</span>
          <Input name="insurancePlan" placeholder="Gold Plus" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Member ID</span>
          <Input name="memberId" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Group Number</span>
          <Input name="groupNumber" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Guarantor Name</span>
          <Input name="guarantorName" />
        </label>
        <label className="grid gap-1.5">
          <span className="text-sm font-medium">Guarantor Relationship</span>
          <Input name="guarantorRelationship" placeholder="Self / Spouse / Parent" />
        </label>
      </div>

      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Registering..." : "Register Patient"}
      </Button>

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
