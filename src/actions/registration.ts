"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { createPatientRecord } from "@/lib/phase1/service";
import { patientCreateSchema } from "@/lib/phase1/validation";

export type ActionResult = {
  ok: boolean;
  message: string;
};

export async function createPatientAction(
  _prevState: ActionResult,
  formData: FormData,
): Promise<ActionResult> {
  try {
    const parsed = patientCreateSchema.parse({
      mrn: formData.get("mrn"),
      firstName: formData.get("firstName"),
      lastName: formData.get("lastName"),
      dob: formData.get("dob"),
      sexAtBirth: formData.get("sexAtBirth"),
      phone: formData.get("phone"),
      addressLine1: formData.get("addressLine1"),
      addressLine2: formData.get("addressLine2"),
      city: formData.get("city"),
      state: formData.get("state"),
      postalCode: formData.get("postalCode"),
      insurancePayer: formData.get("insurancePayer"),
      insurancePlan: formData.get("insurancePlan"),
      memberId: formData.get("memberId"),
      groupNumber: formData.get("groupNumber"),
      guarantorName: formData.get("guarantorName"),
      guarantorRelationship: formData.get("guarantorRelationship"),
    });

    const supabase = await createClient();
    await createPatientRecord(supabase, parsed);
    revalidatePath("/patients");
    revalidatePath("/dashboard");
    revalidatePath("/beds");

    return { ok: true, message: "Patient registered." };
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to register patient.";
    return { ok: false, message };
  }
}
