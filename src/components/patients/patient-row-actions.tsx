import { PatientDeleteDialog } from "@/components/patients/patient-delete-dialog";
import { PatientFormModal, type EditablePatient } from "@/components/patients/patient-form-modal";

type PatientRowActionsProps = {
  patient: EditablePatient;
};

export function PatientRowActions({ patient }: PatientRowActionsProps) {
  return (
    <div className="flex items-center gap-2">
      <PatientFormModal patient={patient} />
      <PatientDeleteDialog patientId={patient.id} patientName={`${patient.first_name} ${patient.last_name}`} />
    </div>
  );
}
