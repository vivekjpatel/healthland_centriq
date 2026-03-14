"use client";

import { useMemo, useState, useTransition } from "react";
import { updatePatientAction, type PatientActionResult } from "@/actions/patients";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { FormPendingBridge } from "@/components/ui/form-pending-bridge";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

type JsonRecord = Record<string, unknown>;

export type EditablePatient = {
  id: string;
  mrn: string;
  first_name: string;
  last_name: string;
  dob: string;
  sex_at_birth: string | null;
  phone: string | null;
  address: unknown;
  insurance: unknown;
};

type PatientFormModalProps = {
  patient: EditablePatient;
};

const initialState: PatientActionResult = {
  ok: true,
  message: "",
};

function asRecord(value: unknown): JsonRecord {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }

  return value as JsonRecord;
}

function readText(record: JsonRecord, key: string): string {
  const value = record[key];
  return typeof value === "string" ? value : "";
}

export function PatientFormModal({ patient }: PatientFormModalProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<PatientActionResult>(initialState);
  const [isPending, startTransition] = useTransition();

  const address = useMemo(() => asRecord(patient.address), [patient.address]);
  const insurance = useMemo(() => asRecord(patient.insurance), [patient.insurance]);

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const nextState = await updatePatientAction(state, formData);
      setState(nextState);
      if (nextState.ok) {
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button type="button" variant="outline" size="xs" onClick={() => setOpen(true)}>
        Edit
      </Button>
      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="Edit Patient"
        description="Update demographic and coverage details."
      >
        <form action={handleSubmit} className="mt-4 grid max-h-[72vh] gap-4 overflow-y-auto pr-1">
          <FormPendingBridge />
          <input type="hidden" name="patientId" value={patient.id} />

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Medical record number (MRN)</span>
              <Input name="mrn" defaultValue={patient.mrn} required />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Date of Birth</span>
              <Input name="dob" type="date" defaultValue={patient.dob} required />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">First Name</span>
              <Input name="firstName" defaultValue={patient.first_name} required />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Last Name</span>
              <Input name="lastName" defaultValue={patient.last_name} required />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Sex at Birth</span>
              <Select name="sexAtBirth" defaultValue={patient.sex_at_birth ?? ""}>
                <option value="">Select</option>
                <option value="female">Female</option>
                <option value="male">Male</option>
                <option value="intersex">Intersex</option>
                <option value="unknown">Unknown</option>
              </Select>
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Phone</span>
              <Input name="phone" defaultValue={patient.phone ?? ""} />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5 md:col-span-2">
              <span className="text-sm font-medium">Address Line 1</span>
              <Input name="addressLine1" defaultValue={readText(address, "line1")} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">City</span>
              <Input name="city" defaultValue={readText(address, "city")} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">State</span>
              <Input name="state" defaultValue={readText(address, "state")} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Postal Code</span>
              <Input name="postalCode" defaultValue={readText(address, "postal_code")} />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Insurance Payer</span>
              <Input name="insurancePayer" defaultValue={readText(insurance, "payer")} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Plan</span>
              <Input name="insurancePlan" defaultValue={readText(insurance, "plan")} />
            </label>
            <label className="grid gap-1.5">
              <span className="text-sm font-medium">Member ID</span>
              <Input name="memberId" defaultValue={readText(insurance, "member_id")} />
            </label>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={isPending}>
              Cancel
            </Button>
          </div>

          {state.message ? (
            <p
              aria-live="polite"
              className={`text-sm font-medium ${state.ok ? "text-emerald-700" : "text-[var(--danger)]"}`}
            >
              {state.message}
            </p>
          ) : null}
        </form>
      </Dialog>
    </>
  );
}
