"use client";

import { useState, useTransition } from "react";
import { deletePatientAction, type PatientActionResult } from "@/actions/patients";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { FormPendingBridge } from "@/components/ui/form-pending-bridge";

type PatientDeleteDialogProps = {
  patientId: string;
  patientName: string;
};

const initialState: PatientActionResult = {
  ok: true,
  message: "",
};

export function PatientDeleteDialog({ patientId, patientName }: PatientDeleteDialogProps) {
  const [open, setOpen] = useState(false);
  const [state, setState] = useState<PatientActionResult>(initialState);
  const [isPending, startTransition] = useTransition();

  async function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const nextState = await deletePatientAction(state, formData);
      setState(nextState);
      if (nextState.ok) {
        setOpen(false);
      }
    });
  }

  return (
    <>
      <Button type="button" variant="destructive" size="xs" onClick={() => setOpen(true)}>
        Delete
      </Button>
      <AlertDialog
        open={open}
        onOpenChange={setOpen}
        title="Archive patient?"
        description="This is a soft delete. The patient will be hidden from active lists."
      >
        <form action={handleSubmit} className="mt-4 grid gap-4">
          <FormPendingBridge />
          <input type="hidden" name="patientId" value={patientId} />
          <p className="text-sm text-[var(--text-muted)]">
            You are archiving <span className="font-semibold text-[var(--text-primary)]">{patientName}</span>.
            Related records are retained for audit history.
          </p>
          <div className="flex items-center gap-2">
            <Button type="submit" variant="destructive" disabled={isPending}>
              {isPending ? "Archiving..." : "Confirm Archive"}
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
      </AlertDialog>
    </>
  );
}
