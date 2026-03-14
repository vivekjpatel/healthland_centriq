import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/supabase";
import type {
  AllergyCreateInput,
  AssignBedInput,
  CarePlanCreateInput,
  ChargeCreateInput,
  ClaimCreateInput,
  ClaimStatusInput,
  DischargeInput,
  EncounterCreateInput,
  NoteCreateInput,
  OrderCreateInput,
  OrderStatusInput,
  PaymentCreateInput,
  PatientCreateInput,
  PatientUpdateInput,
  ProblemCreateInput,
  SignNoteInput,
  TransferBedInput,
  VitalsCreateInput,
} from "@/lib/phase1/validation";

type AppSupabase = SupabaseClient<Database>;

type ActorContext = {
  user: User;
  organizationId: string;
  role: Database["public"]["Tables"]["user_profiles"]["Row"]["role"];
};

function debugAuthLog(message: string, details?: Record<string, unknown>) {
  if (process.env.NODE_ENV === "production") return;

  if (details) {
    console.info(`[auth-debug] ${message}`, details);
    return;
  }

  console.info(`[auth-debug] ${message}`);
}

async function getActorContext(supabase: AppSupabase): Promise<ActorContext> {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Unauthorized");
  }

  debugAuthLog("Supabase auth session validated.", { userId: user.id });

  const { data: profiles, error: profileError } = await supabase
    .from("user_profiles")
    .select("organization_id, role")
    .eq("user_id", user.id)
    .limit(1);

  if (profileError) {
    throw new Error(`Failed to load user profile: ${profileError.message}`);
  }

  const profile = profiles?.[0];

  if (!profile) {
    throw new Error(
      `User profile not found for authenticated user ${user.id}. Ensure public.user_profiles has this user_id.`,
    );
  }
  debugAuthLog("Supabase database query successful for user_profiles.", {
    userId: user.id,
    organizationId: profile.organization_id,
    role: profile.role,
  });

  return {
    user,
    organizationId: profile.organization_id,
    role: profile.role,
  };
}

async function ensurePatientInOrg(
  supabase: AppSupabase,
  organizationId: string,
  patientId: string,
) {
  const { data, error } = await supabase
    .from("patients")
    .select("id")
    .eq("organization_id", organizationId)
    .eq("id", patientId)
    .is("deleted_at", null)
    .single();

  if (error || !data) {
    throw new Error("Patient not found in organization scope.");
  }
}

async function logAuditEvent(
  supabase: AppSupabase,
  actor: ActorContext,
  eventType: Database["public"]["Tables"]["audit_events"]["Row"]["event_type"],
  patientId: string | null,
  payload?: Json,
) {
  const { error } = await supabase.from("audit_events").insert({
    organization_id: actor.organizationId,
    event_type: eventType,
    patient_id: patientId,
    actor_user_id: actor.user.id,
    payload: payload ?? null,
  });

  if (error) throw new Error(error.message);
}

export async function listPatients(supabase: AppSupabase) {
  const actor = await getActorContext(supabase);
  const { data, error } = await supabase
    .from("patients")
    .select("id,mrn,first_name,last_name,dob,sex_at_birth,phone,address,insurance,created_at")
    .eq("organization_id", actor.organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) throw new Error(error.message);
  return data;
}

export async function listUnassignedPatients(supabase: AppSupabase) {
  const actor = await getActorContext(supabase);

  const { data: activeAssignments, error: assignmentError } = await supabase
    .from("bed_assignments")
    .select("patient_id")
    .eq("organization_id", actor.organizationId)
    .is("discharged_at", null);

  if (assignmentError) throw new Error(assignmentError.message);

  const assignedPatientIds = activeAssignments.map((assignment) => assignment.patient_id);

  let query = supabase
    .from("patients")
    .select("id,mrn,first_name,last_name")
    .eq("organization_id", actor.organizationId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (assignedPatientIds.length > 0) {
    const inFilter = `(${assignedPatientIds.map((id) => `"${id}"`).join(",")})`;
    query = query.not("id", "in", inFilter);
  }

  const { data, error } = await query;

  if (error) throw new Error(error.message);
  return data;
}

export async function createPatientRecord(
  supabase: AppSupabase,
  input: PatientCreateInput,
) {
  const actor = await getActorContext(supabase);
  const { data: patient, error } = await supabase
    .from("patients")
    .insert({
      organization_id: actor.organizationId,
      mrn: input.mrn,
      first_name: input.firstName,
      last_name: input.lastName,
      dob: input.dob,
      sex_at_birth: input.sexAtBirth,
      phone: input.phone,
      address: input.addressJson,
      insurance: input.insuranceJson,
      created_by: actor.user.id,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Duplicate MRN for this organization.");
    }
    throw new Error(error.message);
  }

  await logAuditEvent(supabase, actor, "registration_created", patient.id, {
    mrn: input.mrn,
  } as Json);

  return patient;
}

export async function updatePatientRecord(
  supabase: AppSupabase,
  input: PatientUpdateInput,
) {
  const actor = await getActorContext(supabase);
  const { data, error } = await supabase
    .from("patients")
    .update({
      mrn: input.mrn,
      first_name: input.firstName,
      last_name: input.lastName,
      dob: input.dob,
      sex_at_birth: input.sexAtBirth,
      phone: input.phone,
      address: input.addressJson,
      insurance: input.insuranceJson,
    })
    .eq("organization_id", actor.organizationId)
    .eq("id", input.patientId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("Duplicate MRN for this organization.");
    }
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Patient not found in organization scope.");
  }

  await logAuditEvent(supabase, actor, "registration_created", input.patientId, {
    action: "patient_updated",
    mrn: input.mrn,
  } as Json);

  return data;
}

export async function deletePatientRecord(supabase: AppSupabase, patientId: string) {
  const actor = await getActorContext(supabase);
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id")
    .eq("organization_id", actor.organizationId)
    .eq("id", patientId)
    .is("deleted_at", null)
    .single();

  if (patientError || !patient) {
    throw new Error("Patient not found in organization scope.");
  }

  const { data: activeAssignments, error: activeAssignmentsError } = await supabase
    .from("bed_assignments")
    .select("id,bed_id")
    .eq("organization_id", actor.organizationId)
    .eq("patient_id", patientId)
    .is("discharged_at", null);

  if (activeAssignmentsError) {
    throw new Error(activeAssignmentsError.message);
  }

  const bedIds = activeAssignments.map((assignment) => assignment.bed_id);

  if (activeAssignments.length > 0) {
    const { error: dischargeError } = await supabase
      .from("bed_assignments")
      .update({ discharged_at: new Date().toISOString() })
      .eq("organization_id", actor.organizationId)
      .eq("patient_id", patientId)
      .is("discharged_at", null);

    if (dischargeError) {
      throw new Error(dischargeError.message);
    }
  }

  if (bedIds.length > 0) {
    const { error: releaseBedsError } = await supabase
      .from("beds")
      .update({ status: "available" })
      .eq("organization_id", actor.organizationId)
      .in("id", bedIds);

    if (releaseBedsError) {
      throw new Error(releaseBedsError.message);
    }
  }

  const { data, error } = await supabase
    .from("patients")
    .update({
      deleted_at: new Date().toISOString(),
      deleted_by: actor.user.id,
    })
    .eq("organization_id", actor.organizationId)
    .eq("id", patientId)
    .is("deleted_at", null)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    throw new Error("Patient not found in organization scope.");
  }

  return data;
}

export async function listBedBoard(supabase: AppSupabase) {
  const actor = await getActorContext(supabase);

  const { data: beds, error } = await supabase
    .from("beds")
    .select("id,unit,room,bed_label,status,acuity_level")
    .eq("organization_id", actor.organizationId)
    .order("unit", { ascending: true })
    .order("room", { ascending: true })
    .order("bed_label", { ascending: true });

  if (error) throw new Error(error.message);

  const { data: assignments, error: assignmentsError } = await supabase
    .from("bed_assignments")
    .select("patient_id,bed_id,patients(id,first_name,last_name,mrn)")
    .eq("organization_id", actor.organizationId)
    .is("discharged_at", null);

  if (assignmentsError) throw new Error(assignmentsError.message);

  const assignmentMap = new Map(
    assignments.map((assignment) => [assignment.bed_id, assignment]),
  );

  return beds.map((bed) => {
    const assignment = assignmentMap.get(bed.id);
    const patient = Array.isArray(assignment?.patients)
      ? assignment?.patients[0]
      : assignment?.patients;

    return {
      ...bed,
      patient,
    };
  });
}

async function performAdt(
  supabase: AppSupabase,
  action: "assign" | "transfer" | "discharge",
  args: { patientId: string; bedId: string; targetBedId?: string },
) {
  const actor = await getActorContext(supabase);
  const { error } = await supabase.rpc("perform_adt_action", {
    p_action: action,
    p_org_id: actor.organizationId,
    p_patient_id: args.patientId,
    p_bed_id: args.bedId,
    p_actor_id: actor.user.id,
    p_target_bed_id: args.targetBedId ?? null,
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function assignBed(supabase: AppSupabase, input: AssignBedInput) {
  return performAdt(supabase, "assign", {
    patientId: input.patientId,
    bedId: input.bedId,
  });
}

export async function transferBed(
  supabase: AppSupabase,
  input: TransferBedInput,
) {
  return performAdt(supabase, "transfer", {
    patientId: input.patientId,
    bedId: input.currentBedId,
    targetBedId: input.targetBedId,
  });
}

export async function dischargePatient(
  supabase: AppSupabase,
  input: DischargeInput,
) {
  return performAdt(supabase, "discharge", {
    patientId: input.patientId,
    bedId: input.bedId,
  });
}

export async function getPatientTimeline(supabase: AppSupabase, patientId: string) {
  const actor = await getActorContext(supabase);
  const { data: patient, error: patientError } = await supabase
    .from("patients")
    .select("id,mrn,first_name,last_name,dob")
    .eq("organization_id", actor.organizationId)
    .eq("id", patientId)
    .is("deleted_at", null)
    .single();

  if (patientError) throw new Error(patientError.message);

  const { data: events, error } = await supabase
    .from("audit_events")
    .select("id,event_type,payload,occurred_at")
    .eq("organization_id", actor.organizationId)
    .eq("patient_id", patientId)
    .order("occurred_at", { ascending: false });

  if (error) throw new Error(error.message);

  return { patient, events };
}

export async function createEncounterRecord(
  supabase: AppSupabase,
  input: EncounterCreateInput,
) {
  const actor = await getActorContext(supabase);
  await ensurePatientInOrg(supabase, actor.organizationId, input.patientId);

  const { data, error } = await supabase
    .from("encounters")
    .insert({
      organization_id: actor.organizationId,
      patient_id: input.patientId,
      encounter_type: input.encounterType,
      created_by: actor.user.id,
    })
    .select("id,encounter_type,status,admitted_at")
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent(supabase, actor, "encounter_created", input.patientId, {
    encounter_id: data.id,
    encounter_type: data.encounter_type,
  } as Json);

  return data;
}

export async function addProblemRecord(supabase: AppSupabase, input: ProblemCreateInput) {
  const actor = await getActorContext(supabase);
  await ensurePatientInOrg(supabase, actor.organizationId, input.patientId);

  const { data, error } = await supabase
    .from("patient_problems")
    .insert({
      organization_id: actor.organizationId,
      patient_id: input.patientId,
      icd_code: input.icdCode,
      description: input.description,
      onset_date: input.onsetDate,
      created_by: actor.user.id,
    })
    .select("id,description,status")
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent(supabase, actor, "problem_added", input.patientId, {
    problem_id: data.id,
    description: data.description,
  } as Json);

  return data;
}

export async function addAllergyRecord(supabase: AppSupabase, input: AllergyCreateInput) {
  const actor = await getActorContext(supabase);
  await ensurePatientInOrg(supabase, actor.organizationId, input.patientId);

  const { data, error } = await supabase
    .from("patient_allergies")
    .insert({
      organization_id: actor.organizationId,
      patient_id: input.patientId,
      allergen: input.allergen,
      reaction: input.reaction,
      severity: input.severity,
      created_by: actor.user.id,
    })
    .select("id,allergen,severity")
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent(supabase, actor, "allergy_added", input.patientId, {
    allergy_id: data.id,
    allergen: data.allergen,
  } as Json);

  return data;
}

export async function recordVitalsEntry(supabase: AppSupabase, input: VitalsCreateInput) {
  const actor = await getActorContext(supabase);
  await ensurePatientInOrg(supabase, actor.organizationId, input.patientId);

  const { data, error } = await supabase
    .from("patient_vitals")
    .insert({
      organization_id: actor.organizationId,
      patient_id: input.patientId,
      vital_type: input.vitalType,
      value: input.value,
      unit: input.unit,
      recorded_by: actor.user.id,
    })
    .select("id,vital_type,value,unit,recorded_at")
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent(supabase, actor, "vitals_recorded", input.patientId, {
    vital_id: data.id,
    type: data.vital_type,
    value: data.value,
    unit: data.unit,
  } as Json);

  return data;
}

export async function upsertCarePlanRecord(
  supabase: AppSupabase,
  input: CarePlanCreateInput,
) {
  const actor = await getActorContext(supabase);
  await ensurePatientInOrg(supabase, actor.organizationId, input.patientId);

  const { data, error } = await supabase
    .from("care_plans")
    .insert({
      organization_id: actor.organizationId,
      patient_id: input.patientId,
      title: input.title,
      goal: input.goal,
      intervention: input.intervention,
      outcome: input.outcome,
      updated_by: actor.user.id,
    })
    .select("id,title,status,updated_at")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function createClinicalNoteRecord(
  supabase: AppSupabase,
  input: NoteCreateInput,
) {
  const actor = await getActorContext(supabase);
  await ensurePatientInOrg(supabase, actor.organizationId, input.patientId);

  const { data, error } = await supabase
    .from("clinical_notes")
    .insert({
      organization_id: actor.organizationId,
      patient_id: input.patientId,
      note_type: input.noteType,
      content: input.content,
      status: "draft",
      authored_by: actor.user.id,
    })
    .select("id,note_type,status,authored_at")
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent(supabase, actor, "note_created", input.patientId, {
    note_id: data.id,
    note_type: data.note_type,
  } as Json);

  return data;
}

export async function signClinicalNoteRecord(supabase: AppSupabase, input: SignNoteInput) {
  const actor = await getActorContext(supabase);
  await ensurePatientInOrg(supabase, actor.organizationId, input.patientId);

  const { data, error } = await supabase
    .from("clinical_notes")
    .update({
      status: "signed",
      signed_at: new Date().toISOString(),
    })
    .eq("organization_id", actor.organizationId)
    .eq("patient_id", input.patientId)
    .eq("id", input.noteId)
    .select("id,status,signed_at")
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent(supabase, actor, "note_signed", input.patientId, {
    note_id: data.id,
    signed_at: data.signed_at,
  } as Json);

  return data;
}

export async function createOrderRecord(supabase: AppSupabase, input: OrderCreateInput) {
  const actor = await getActorContext(supabase);
  await ensurePatientInOrg(supabase, actor.organizationId, input.patientId);

  const { data, error } = await supabase
    .from("physician_orders")
    .insert({
      organization_id: actor.organizationId,
      patient_id: input.patientId,
      order_type: input.orderType,
      priority: input.priority,
      indication: input.indication,
      instructions: input.instructions,
      ordered_by: actor.user.id,
      status: "draft",
    })
    .select("id,order_type,priority,status,created_at")
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent(supabase, actor, "order_created", input.patientId, {
    order_id: data.id,
    order_type: data.order_type,
    priority: data.priority,
  } as Json);

  return data;
}

export async function updateOrderStatusRecord(
  supabase: AppSupabase,
  input: OrderStatusInput,
) {
  const actor = await getActorContext(supabase);
  await ensurePatientInOrg(supabase, actor.organizationId, input.patientId);

  const updatePayload: Database["public"]["Tables"]["physician_orders"]["Update"] = {
    status: input.status,
    updated_at: new Date().toISOString(),
    cancellation_reason: input.status === "canceled" ? input.cancellationReason : null,
  };

  if (input.status === "signed") updatePayload.signed_by = actor.user.id;
  if (input.status === "acknowledged") updatePayload.acknowledged_by = actor.user.id;
  if (input.status === "completed") updatePayload.completed_by = actor.user.id;
  if (input.status === "canceled") updatePayload.canceled_by = actor.user.id;

  const { data, error } = await supabase
    .from("physician_orders")
    .update(updatePayload)
    .eq("organization_id", actor.organizationId)
    .eq("patient_id", input.patientId)
    .eq("id", input.orderId)
    .select("id,status,updated_at")
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent(supabase, actor, "order_updated", input.patientId, {
    order_id: data.id,
    status: data.status,
  } as Json);

  return data;
}

export async function createChargeRecord(supabase: AppSupabase, input: ChargeCreateInput) {
  const actor = await getActorContext(supabase);
  await ensurePatientInOrg(supabase, actor.organizationId, input.patientId);

  const totalAmount = Number((input.units * input.unitAmount).toFixed(2));
  const { data, error } = await supabase
    .from("charges")
    .insert({
      organization_id: actor.organizationId,
      patient_id: input.patientId,
      cpt_code: input.cptCode,
      description: input.description,
      units: input.units,
      unit_amount: input.unitAmount,
      total_amount: totalAmount,
      created_by: actor.user.id,
    })
    .select("id,description,total_amount,status")
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent(supabase, actor, "charge_created", input.patientId, {
    charge_id: data.id,
    total_amount: data.total_amount,
  } as Json);

  return data;
}

export async function createClaimRecord(supabase: AppSupabase, input: ClaimCreateInput) {
  const actor = await getActorContext(supabase);
  await ensurePatientInOrg(supabase, actor.organizationId, input.patientId);

  const { data, error } = await supabase
    .from("claims")
    .insert({
      organization_id: actor.organizationId,
      patient_id: input.patientId,
      charge_id: input.chargeId,
      payer: input.payer,
      created_by: actor.user.id,
    })
    .select("id,payer,status,created_at")
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent(supabase, actor, "claim_created", input.patientId, {
    claim_id: data.id,
    payer: data.payer,
  } as Json);

  return data;
}

export async function updateClaimStatusRecord(
  supabase: AppSupabase,
  input: ClaimStatusInput,
) {
  const actor = await getActorContext(supabase);
  await ensurePatientInOrg(supabase, actor.organizationId, input.patientId);

  const isTerminal = input.status === "paid" || input.status === "denied" || input.status === "partial";

  const { data, error } = await supabase
    .from("claims")
    .update({
      status: input.status,
      denial_reason: input.status === "denied" ? input.denialReason : null,
      submitted_at: input.status === "submitted" ? new Date().toISOString() : null,
      adjudicated_at: isTerminal ? new Date().toISOString() : null,
    })
    .eq("organization_id", actor.organizationId)
    .eq("patient_id", input.patientId)
    .eq("id", input.claimId)
    .select("id,status,denial_reason")
    .single();

  if (error) throw new Error(error.message);
  return data;
}

export async function postPaymentRecord(supabase: AppSupabase, input: PaymentCreateInput) {
  const actor = await getActorContext(supabase);
  await ensurePatientInOrg(supabase, actor.organizationId, input.patientId);

  const { data, error } = await supabase
    .from("payments")
    .insert({
      organization_id: actor.organizationId,
      patient_id: input.patientId,
      claim_id: input.claimId,
      amount: input.amount,
      payment_method: input.paymentMethod,
      reference_number: input.referenceNumber,
      posted_by: actor.user.id,
    })
    .select("id,amount,posted_at")
    .single();

  if (error) throw new Error(error.message);

  await logAuditEvent(supabase, actor, "payment_posted", input.patientId, {
    payment_id: data.id,
    amount: data.amount,
  } as Json);

  return data;
}

export async function getPatientClinicalWorkspace(
  supabase: AppSupabase,
  patientId: string,
) {
  const actor = await getActorContext(supabase);
  await ensurePatientInOrg(supabase, actor.organizationId, patientId);

  const [patientRes, encountersRes, problemsRes, allergiesRes, vitalsRes, notesRes, ordersRes, chargesRes, claimsRes, paymentsRes, carePlansRes, eventsRes] =
    await Promise.all([
      supabase
        .from("patients")
        .select("id,mrn,first_name,last_name,dob")
        .eq("organization_id", actor.organizationId)
        .eq("id", patientId)
        .is("deleted_at", null)
        .single(),
      supabase
        .from("encounters")
        .select("id,encounter_type,status,admitted_at,discharged_at")
        .eq("organization_id", actor.organizationId)
        .eq("patient_id", patientId)
        .order("admitted_at", { ascending: false })
        .limit(10),
      supabase
        .from("patient_problems")
        .select("id,icd_code,description,status,onset_date,resolved_date,created_at")
        .eq("organization_id", actor.organizationId)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("patient_allergies")
        .select("id,allergen,reaction,severity,status,created_at")
        .eq("organization_id", actor.organizationId)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("patient_vitals")
        .select("id,vital_type,value,unit,recorded_at")
        .eq("organization_id", actor.organizationId)
        .eq("patient_id", patientId)
        .order("recorded_at", { ascending: false })
        .limit(20),
      supabase
        .from("clinical_notes")
        .select("id,note_type,status,content,authored_at,signed_at")
        .eq("organization_id", actor.organizationId)
        .eq("patient_id", patientId)
        .order("authored_at", { ascending: false })
        .limit(20),
      supabase
        .from("physician_orders")
        .select("id,order_type,priority,status,indication,instructions,created_at,updated_at")
        .eq("organization_id", actor.organizationId)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("charges")
        .select("id,cpt_code,description,units,unit_amount,total_amount,status,created_at")
        .eq("organization_id", actor.organizationId)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("claims")
        .select("id,charge_id,payer,claim_number,status,denial_reason,submitted_at,adjudicated_at,created_at")
        .eq("organization_id", actor.organizationId)
        .eq("patient_id", patientId)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("payments")
        .select("id,claim_id,amount,payment_method,reference_number,posted_at")
        .eq("organization_id", actor.organizationId)
        .eq("patient_id", patientId)
        .order("posted_at", { ascending: false })
        .limit(20),
      supabase
        .from("care_plans")
        .select("id,title,goal,intervention,outcome,status,updated_at")
        .eq("organization_id", actor.organizationId)
        .eq("patient_id", patientId)
        .order("updated_at", { ascending: false })
        .limit(10),
      supabase
        .from("audit_events")
        .select("id,event_type,payload,occurred_at")
        .eq("organization_id", actor.organizationId)
        .eq("patient_id", patientId)
        .order("occurred_at", { ascending: false })
        .limit(30),
    ]);

  if (patientRes.error) throw new Error(patientRes.error.message);
  if (encountersRes.error) throw new Error(encountersRes.error.message);
  if (problemsRes.error) throw new Error(problemsRes.error.message);
  if (allergiesRes.error) throw new Error(allergiesRes.error.message);
  if (vitalsRes.error) throw new Error(vitalsRes.error.message);
  if (notesRes.error) throw new Error(notesRes.error.message);
  if (ordersRes.error) throw new Error(ordersRes.error.message);
  if (chargesRes.error) throw new Error(chargesRes.error.message);
  if (claimsRes.error) throw new Error(claimsRes.error.message);
  if (paymentsRes.error) throw new Error(paymentsRes.error.message);
  if (carePlansRes.error) throw new Error(carePlansRes.error.message);
  if (eventsRes.error) throw new Error(eventsRes.error.message);

  return {
    patient: patientRes.data,
    encounters: encountersRes.data,
    problems: problemsRes.data,
    allergies: allergiesRes.data,
    vitals: vitalsRes.data,
    notes: notesRes.data,
    orders: ordersRes.data,
    charges: chargesRes.data,
    claims: claimsRes.data,
    payments: paymentsRes.data,
    carePlans: carePlansRes.data,
    events: eventsRes.data,
  };
}
