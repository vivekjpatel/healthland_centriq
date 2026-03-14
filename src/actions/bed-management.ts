"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import { assignBed, dischargePatient, transferBed } from "@/lib/phase1/service";
import {
  assignBedSchema,
  dischargeSchema,
  transferBedSchema,
} from "@/lib/phase1/validation";

export async function assignBedAction(formData: FormData): Promise<void> {
  try {
    const parsed = assignBedSchema.parse({
      patientId: formData.get("patientId"),
      bedId: formData.get("bedId"),
    });

    const supabase = await createClient();
    await assignBed(supabase, parsed);
    revalidatePath("/beds");
    revalidatePath("/dashboard");
    revalidatePath("/patients");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to assign bed.";
    throw new Error(message);
  }
}

export async function transferBedAction(formData: FormData): Promise<void> {
  try {
    const parsed = transferBedSchema.parse({
      patientId: formData.get("patientId"),
      currentBedId: formData.get("currentBedId"),
      targetBedId: formData.get("targetBedId"),
    });

    const supabase = await createClient();
    await transferBed(supabase, parsed);
    revalidatePath("/beds");
    revalidatePath("/dashboard");
    revalidatePath("/patients");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to transfer bed.";
    throw new Error(message);
  }
}

export async function dischargePatientAction(formData: FormData): Promise<void> {
  try {
    const parsed = dischargeSchema.parse({
      patientId: formData.get("patientId"),
      bedId: formData.get("bedId"),
    });

    const supabase = await createClient();
    await dischargePatient(supabase, parsed);
    revalidatePath("/beds");
    revalidatePath("/dashboard");
    revalidatePath("/patients");
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to discharge patient.";
    throw new Error(message);
  }
}
