import { z } from "zod";

const optionalText = (max: number) =>
  z.string().trim().max(max).optional().transform((value) => value || null);

const optionalSexAtBirth = z
  .enum(["female", "male", "intersex", "unknown"])
  .optional()
  .or(z.literal(""))
  .transform((value) => (value ? value : null));

export const patientCreateSchema = z.object({
  mrn: z.string().trim().min(3).max(40),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  dob: z.string().date(),
  sexAtBirth: optionalSexAtBirth,
  phone: optionalText(30),
  addressLine1: optionalText(120),
  addressLine2: optionalText(120),
  city: optionalText(80),
  state: optionalText(40),
  postalCode: optionalText(20),
  insurancePayer: optionalText(120),
  insurancePlan: optionalText(120),
  memberId: optionalText(80),
  groupNumber: optionalText(80),
  guarantorName: optionalText(120),
  guarantorRelationship: optionalText(60),
}).transform((input) => {
  const addressJson = input.addressLine1 || input.addressLine2 || input.city || input.state || input.postalCode
    ? {
        line1: input.addressLine1,
        line2: input.addressLine2,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
      }
    : null;

  const insuranceJson =
    input.insurancePayer ||
    input.insurancePlan ||
    input.memberId ||
    input.groupNumber ||
    input.guarantorName ||
    input.guarantorRelationship
      ? {
          payer: input.insurancePayer,
          plan: input.insurancePlan,
          member_id: input.memberId,
          group_number: input.groupNumber,
          guarantor_name: input.guarantorName,
          guarantor_relationship: input.guarantorRelationship,
        }
      : null;

  return {
    mrn: input.mrn,
    firstName: input.firstName,
    lastName: input.lastName,
    dob: input.dob,
    sexAtBirth: input.sexAtBirth,
    phone: input.phone,
    addressJson,
    insuranceJson,
  };
});

export const patientUpdateSchema = z.object({
  patientId: z.string().uuid(),
  mrn: z.string().trim().min(3).max(40),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  dob: z.string().date(),
  sexAtBirth: optionalSexAtBirth,
  phone: optionalText(30),
  addressLine1: optionalText(120),
  city: optionalText(80),
  state: optionalText(40),
  postalCode: optionalText(20),
  insurancePayer: optionalText(120),
  insurancePlan: optionalText(120),
  memberId: optionalText(80),
}).transform((input) => {
  const addressJson = input.addressLine1 || input.city || input.state || input.postalCode
    ? {
        line1: input.addressLine1,
        city: input.city,
        state: input.state,
        postal_code: input.postalCode,
      }
    : null;

  const insuranceJson = input.insurancePayer || input.insurancePlan || input.memberId
    ? {
        payer: input.insurancePayer,
        plan: input.insurancePlan,
        member_id: input.memberId,
      }
    : null;

  return {
    patientId: input.patientId,
    mrn: input.mrn,
    firstName: input.firstName,
    lastName: input.lastName,
    dob: input.dob,
    sexAtBirth: input.sexAtBirth,
    phone: input.phone,
    addressJson,
    insuranceJson,
  };
});

export const patientDeleteSchema = z.object({
  patientId: z.string().uuid(),
});

export const assignBedSchema = z.object({
  patientId: z.string().uuid(),
  bedId: z.string().uuid(),
});

export const transferBedSchema = z.object({
  patientId: z.string().uuid(),
  currentBedId: z.string().uuid(),
  targetBedId: z.string().uuid(),
});

export const dischargeSchema = z.object({
  patientId: z.string().uuid(),
  bedId: z.string().uuid(),
});

export const encounterCreateSchema = z.object({
  patientId: z.string().uuid(),
  encounterType: z.enum(["inpatient", "outpatient", "ed", "telehealth"]),
});

export const problemCreateSchema = z.object({
  patientId: z.string().uuid(),
  icdCode: z.string().trim().max(20).optional().transform((value) => value || null),
  description: z.string().trim().min(3).max(250),
  onsetDate: z.string().trim().optional().transform((value) => value || null),
});

export const allergyCreateSchema = z.object({
  patientId: z.string().uuid(),
  allergen: z.string().trim().min(2).max(120),
  reaction: z.string().trim().max(160).optional().transform((value) => value || null),
  severity: z
    .enum(["mild", "moderate", "severe"])
    .optional()
    .or(z.literal(""))
    .transform((value) => (value ? value : null)),
});

export const vitalsCreateSchema = z.object({
  patientId: z.string().uuid(),
  vitalType: z.string().trim().min(2).max(80),
  value: z.string().trim().min(1).max(80),
  unit: z.string().trim().max(20).optional().transform((value) => value || null),
});

export const carePlanCreateSchema = z.object({
  patientId: z.string().uuid(),
  title: z.string().trim().min(3).max(120),
  goal: z.string().trim().max(500).optional().transform((value) => value || null),
  intervention: z.string().trim().max(500).optional().transform((value) => value || null),
  outcome: z.string().trim().max(500).optional().transform((value) => value || null),
});

export const noteCreateSchema = z.object({
  patientId: z.string().uuid(),
  noteType: z.enum(["progress", "nursing", "physician", "discharge", "care_plan"]),
  content: z.string().trim().min(3).max(2000),
});

export const signNoteSchema = z.object({
  patientId: z.string().uuid(),
  noteId: z.string().uuid(),
});

export const orderCreateSchema = z.object({
  patientId: z.string().uuid(),
  orderType: z.enum(["medication", "lab", "imaging", "procedure", "treatment"]),
  priority: z.enum(["routine", "urgent", "stat"]),
  indication: z.string().trim().max(500).optional().transform((value) => value || null),
  instructions: z.string().trim().max(1000).optional().transform((value) => value || null),
});

export const orderStatusSchema = z.object({
  patientId: z.string().uuid(),
  orderId: z.string().uuid(),
  status: z.enum(["signed", "acknowledged", "in_progress", "completed", "canceled"]),
  cancellationReason: z.string().trim().max(300).optional().transform((value) => value || null),
});

export const chargeCreateSchema = z.object({
  patientId: z.string().uuid(),
  description: z.string().trim().min(3).max(160),
  cptCode: z.string().trim().max(20).optional().transform((value) => value || null),
  units: z.coerce.number().int().min(1).max(999),
  unitAmount: z.coerce.number().min(0),
});

export const claimCreateSchema = z.object({
  patientId: z.string().uuid(),
  chargeId: z.string().uuid(),
  payer: z.string().trim().min(2).max(120),
});

export const claimStatusSchema = z.object({
  patientId: z.string().uuid(),
  claimId: z.string().uuid(),
  status: z.enum(["submitted", "paid", "denied", "partial"]),
  denialReason: z.string().trim().max(400).optional().transform((value) => value || null),
});

export const paymentCreateSchema = z.object({
  patientId: z.string().uuid(),
  claimId: z.string().uuid(),
  amount: z.coerce.number().positive(),
  paymentMethod: z.string().trim().max(40).optional().transform((value) => value || null),
  referenceNumber: z.string().trim().max(80).optional().transform((value) => value || null),
});

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type PatientUpdateInput = z.infer<typeof patientUpdateSchema>;
export type PatientDeleteInput = z.infer<typeof patientDeleteSchema>;
export type AssignBedInput = z.infer<typeof assignBedSchema>;
export type TransferBedInput = z.infer<typeof transferBedSchema>;
export type DischargeInput = z.infer<typeof dischargeSchema>;
export type EncounterCreateInput = z.infer<typeof encounterCreateSchema>;
export type ProblemCreateInput = z.infer<typeof problemCreateSchema>;
export type AllergyCreateInput = z.infer<typeof allergyCreateSchema>;
export type VitalsCreateInput = z.infer<typeof vitalsCreateSchema>;
export type CarePlanCreateInput = z.infer<typeof carePlanCreateSchema>;
export type NoteCreateInput = z.infer<typeof noteCreateSchema>;
export type SignNoteInput = z.infer<typeof signNoteSchema>;
export type OrderCreateInput = z.infer<typeof orderCreateSchema>;
export type OrderStatusInput = z.infer<typeof orderStatusSchema>;
export type ChargeCreateInput = z.infer<typeof chargeCreateSchema>;
export type ClaimCreateInput = z.infer<typeof claimCreateSchema>;
export type ClaimStatusInput = z.infer<typeof claimStatusSchema>;
export type PaymentCreateInput = z.infer<typeof paymentCreateSchema>;
