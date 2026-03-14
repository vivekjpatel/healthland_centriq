import { transferBedAction } from "@/actions/bed-management";

type BedOption = {
  id: string;
  label: string;
};

type TransferDialogProps = {
  patientId: string;
  currentBedId: string;
  availableBeds: BedOption[];
};

export function TransferDialog({ patientId, currentBedId, availableBeds }: TransferDialogProps) {
  return (
    <details className="rounded-lg border border-[var(--border)] bg-white p-2">
      <summary className="cursor-pointer text-xs font-semibold text-[var(--secondary)]">Transfer Patient</summary>
      <form action={transferBedAction} className="mt-2 grid gap-2">
        <input type="hidden" name="patientId" value={patientId} />
        <input type="hidden" name="currentBedId" value={currentBedId} />
        <select name="targetBedId" required className="app-input text-sm">
          <option value="">Select target bed</option>
          {availableBeds.map((bed) => (
            <option key={bed.id} value={bed.id}>
              {bed.label}
            </option>
          ))}
        </select>
        <button type="submit" className="rounded-lg bg-[var(--secondary)] px-3 py-1.5 text-xs font-semibold text-white">
          Confirm Transfer
        </button>
      </form>
    </details>
  );
}
