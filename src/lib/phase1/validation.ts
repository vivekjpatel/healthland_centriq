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

export type PatientCreateInput = z.infer<typeof patientCreateSchema>;
export type AssignBedInput = z.infer<typeof assignBedSchema>;
export type TransferBedInput = z.infer<typeof transferBedSchema>;
export type DischargeInput = z.infer<typeof dischargeSchema>;
