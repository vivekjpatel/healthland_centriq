import "server-only";

import type { SupabaseClient, User } from "@supabase/supabase-js";
import type { Database, Json } from "@/types/supabase";
import type {
  AssignBedInput,
  DischargeInput,
  PatientCreateInput,
  TransferBedInput,
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

export async function listPatients(supabase: AppSupabase) {
  const actor = await getActorContext(supabase);
  const { data, error } = await supabase
    .from("patients")
    .select("id,mrn,first_name,last_name,dob,created_at")
    .eq("organization_id", actor.organizationId)
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

  const { error: auditError } = await supabase.from("audit_events").insert({
    organization_id: actor.organizationId,
    event_type: "registration_created",
    patient_id: patient.id,
    actor_user_id: actor.user.id,
    payload: {
      mrn: input.mrn,
    } as Json,
  });

  if (auditError) throw new Error(auditError.message);

  return patient;
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
