"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/utils/supabase/server";
import {
  addAllergyRecord,
  addProblemRecord,
  createChargeRecord,
  createClaimRecord,
  createClinicalNoteRecord,
  createEncounterRecord,
  createOrderRecord,
  postPaymentRecord,
  recordVitalsEntry,
  signClinicalNoteRecord,
  updateClaimStatusRecord,
  updateOrderStatusRecord,
  upsertCarePlanRecord,
} from "@/lib/phase1/service";
import {
  allergyCreateSchema,
  carePlanCreateSchema,
  chargeCreateSchema,
  claimCreateSchema,
  claimStatusSchema,
  encounterCreateSchema,
  noteCreateSchema,
  orderCreateSchema,
  orderStatusSchema,
  paymentCreateSchema,
  problemCreateSchema,
  signNoteSchema,
  vitalsCreateSchema,
} from "@/lib/phase1/validation";

function revalidatePatientScopes(patientId: string) {
  revalidatePath("/dashboard");
  revalidatePath("/patients");
  revalidatePath("/beds");
  revalidatePath(`/patients/${patientId}`);
}

export async function createEncounterAction(formData: FormData): Promise<void> {
  const parsed = encounterCreateSchema.parse({
    patientId: formData.get("patientId"),
    encounterType: formData.get("encounterType"),
  });

  const supabase = await createClient();
  await createEncounterRecord(supabase, parsed);
  revalidatePatientScopes(parsed.patientId);
}

export async function addProblemAction(formData: FormData): Promise<void> {
  const parsed = problemCreateSchema.parse({
    patientId: formData.get("patientId"),
    icdCode: formData.get("icdCode"),
    description: formData.get("description"),
    onsetDate: formData.get("onsetDate"),
  });

  const supabase = await createClient();
  await addProblemRecord(supabase, parsed);
  revalidatePatientScopes(parsed.patientId);
}

export async function addAllergyAction(formData: FormData): Promise<void> {
  const parsed = allergyCreateSchema.parse({
    patientId: formData.get("patientId"),
    allergen: formData.get("allergen"),
    reaction: formData.get("reaction"),
    severity: formData.get("severity"),
  });

  const supabase = await createClient();
  await addAllergyRecord(supabase, parsed);
  revalidatePatientScopes(parsed.patientId);
}

export async function addVitalsAction(formData: FormData): Promise<void> {
  const parsed = vitalsCreateSchema.parse({
    patientId: formData.get("patientId"),
    vitalType: formData.get("vitalType"),
    value: formData.get("value"),
    unit: formData.get("unit"),
  });

  const supabase = await createClient();
  await recordVitalsEntry(supabase, parsed);
  revalidatePatientScopes(parsed.patientId);
}

export async function addCarePlanAction(formData: FormData): Promise<void> {
  const parsed = carePlanCreateSchema.parse({
    patientId: formData.get("patientId"),
    title: formData.get("title"),
    goal: formData.get("goal"),
    intervention: formData.get("intervention"),
    outcome: formData.get("outcome"),
  });

  const supabase = await createClient();
  await upsertCarePlanRecord(supabase, parsed);
  revalidatePatientScopes(parsed.patientId);
}

export async function addNoteAction(formData: FormData): Promise<void> {
  const parsed = noteCreateSchema.parse({
    patientId: formData.get("patientId"),
    noteType: formData.get("noteType"),
    content: formData.get("content"),
  });

  const supabase = await createClient();
  await createClinicalNoteRecord(supabase, parsed);
  revalidatePatientScopes(parsed.patientId);
}

export async function signNoteAction(formData: FormData): Promise<void> {
  const parsed = signNoteSchema.parse({
    patientId: formData.get("patientId"),
    noteId: formData.get("noteId"),
  });

  const supabase = await createClient();
  await signClinicalNoteRecord(supabase, parsed);
  revalidatePatientScopes(parsed.patientId);
}

export async function addOrderAction(formData: FormData): Promise<void> {
  const parsed = orderCreateSchema.parse({
    patientId: formData.get("patientId"),
    orderType: formData.get("orderType"),
    priority: formData.get("priority"),
    indication: formData.get("indication"),
    instructions: formData.get("instructions"),
  });

  const supabase = await createClient();
  await createOrderRecord(supabase, parsed);
  revalidatePatientScopes(parsed.patientId);
}

export async function updateOrderStatusAction(formData: FormData): Promise<void> {
  const parsed = orderStatusSchema.parse({
    patientId: formData.get("patientId"),
    orderId: formData.get("orderId"),
    status: formData.get("status"),
    cancellationReason: formData.get("cancellationReason"),
  });

  const supabase = await createClient();
  await updateOrderStatusRecord(supabase, parsed);
  revalidatePatientScopes(parsed.patientId);
}

export async function addChargeAction(formData: FormData): Promise<void> {
  const parsed = chargeCreateSchema.parse({
    patientId: formData.get("patientId"),
    description: formData.get("description"),
    cptCode: formData.get("cptCode"),
    units: formData.get("units"),
    unitAmount: formData.get("unitAmount"),
  });

  const supabase = await createClient();
  await createChargeRecord(supabase, parsed);
  revalidatePatientScopes(parsed.patientId);
}

export async function addClaimAction(formData: FormData): Promise<void> {
  const parsed = claimCreateSchema.parse({
    patientId: formData.get("patientId"),
    chargeId: formData.get("chargeId"),
    payer: formData.get("payer"),
  });

  const supabase = await createClient();
  await createClaimRecord(supabase, parsed);
  revalidatePatientScopes(parsed.patientId);
}

export async function updateClaimStatusAction(formData: FormData): Promise<void> {
  const parsed = claimStatusSchema.parse({
    patientId: formData.get("patientId"),
    claimId: formData.get("claimId"),
    status: formData.get("status"),
    denialReason: formData.get("denialReason"),
  });

  const supabase = await createClient();
  await updateClaimStatusRecord(supabase, parsed);
  revalidatePatientScopes(parsed.patientId);
}

export async function addPaymentAction(formData: FormData): Promise<void> {
  const parsed = paymentCreateSchema.parse({
    patientId: formData.get("patientId"),
    claimId: formData.get("claimId"),
    amount: formData.get("amount"),
    paymentMethod: formData.get("paymentMethod"),
    referenceNumber: formData.get("referenceNumber"),
  });

  const supabase = await createClient();
  await postPaymentRecord(supabase, parsed);
  revalidatePatientScopes(parsed.patientId);
}
