"use client";

import { useEffect, useState } from "react";
import { PatientIntakeForm } from "@/components/registration/patient-intake-form";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

type PatientIntakeModalProps = {
  triggerLabel?: string;
};

export function PatientIntakeModal({ triggerLabel = "Intake Patient" }: PatientIntakeModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;

    function onEsc(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);

  return (
    <>
      <Button type="button" onClick={() => setOpen(true)}>
        {triggerLabel}
      </Button>

      <Dialog
        open={open}
        onOpenChange={setOpen}
        title="New Patient Intake"
        description="Capture identity and insurance details."
      >
        <div className="mt-4 max-h-[72vh] overflow-y-auto pr-1">
          <PatientIntakeForm embedded showHeader={false} />
        </div>
      </Dialog>
    </>
  );
}
