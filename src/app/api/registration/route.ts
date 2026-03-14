import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { createPatientRecord } from "@/lib/phase1/service";
import { patientCreateSchema } from "@/lib/phase1/validation";

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const parsed = patientCreateSchema.parse({
      ...json,
      addressJson:
        typeof json.addressJson === "string"
          ? json.addressJson
          : json.addressJson
            ? JSON.stringify(json.addressJson)
            : "",
      insuranceJson:
        typeof json.insuranceJson === "string"
          ? json.insuranceJson
          : json.insuranceJson
            ? JSON.stringify(json.insuranceJson)
            : "",
    });
    const supabase = await createClient();
    const data = await createPatientRecord(supabase, parsed);
    return NextResponse.json({ ok: true, data }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
