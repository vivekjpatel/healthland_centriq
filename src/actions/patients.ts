"use server";

import { revalidatePath } from "next/cache";
import { deletePatientRecord, updatePatientRecord } from "@/lib/phase1/service";
import { patientDeleteSchema, patientUpdateSchema } from "@/lib/phase1/validation";
import { createClient } from "@/utils/supabase/server";

export type PatientActionResult = {
  ok: boolean;
  message: string;
};

const initialResult: PatientActionResult = {
  ok: true,
  message: "",
};

function revalidatePatientRoutes(patientId: string) {
  revalidatePath("/patients");
  revalidatePath("/dashboard");
  revalidatePath("/beds");
  revalidatePath(`/patients/${patientId}`);
  revalidatePath(`/patient/${patientId}`);
}

export async function updatePatientAction(
  prevState: PatientActionResult = initialResult,
  formData: FormData,
): Promise<PatientActionResult> {
  void prevState;
  try {
    const parsed = patientUpdateSchema.parse({
      patientId: formData.get("patientId"),
      mrn: formData.get("mrn"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      dob: formData.get("dob"),
      sexAtBirth: formData.get("sexAtBirth"),
      phone: formData.get("phone"),
      addressLine1: formData.get("addressLine1"),
      city: formData.get("city"),
      state: formData.get("state"),
      postalCode: formData.get("postalCode"),
      insurancePayer: formData.get("insurancePayer"),
      insurancePlan: formData.get("insurancePlan"),
      memberId: formData.get("memberId"),
    });

    const supabase = await createClient();
    await updatePatientRecord(supabase, parsed);
    revalidatePatientRoutes(parsed.patientId);

    return {
      ok: true,
      message: "Patient updated successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to update patient.",
    };
  }
}

export async function deletePatientAction(
  prevState: PatientActionResult = initialResult,
  formData: FormData,
): Promise<PatientActionResult> {
  void prevState;
  try {
    const parsed = patientDeleteSchema.parse({
      patientId: formData.get("patientId"),
    });

    const supabase = await createClient();
    await deletePatientRecord(supabase, parsed.patientId);
    revalidatePatientRoutes(parsed.patientId);

    return {
      ok: true,
      message: "Patient archived successfully.",
    };
  } catch (error) {
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Failed to delete patient.",
    };
  }
}
