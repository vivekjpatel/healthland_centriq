import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { assignBed, dischargePatient, transferBed } from "@/lib/phase1/service";
import {
  assignBedSchema,
  dischargeSchema,
  transferBedSchema,
} from "@/lib/phase1/validation";

const actionSchemaMap = {
  assign: assignBedSchema,
  transfer: transferBedSchema,
  discharge: dischargeSchema,
} as const;

export async function POST(request: Request) {
  try {
    const json = (await request.json()) as { action?: string };
    const supabase = await createClient();

    if (json.action === "assign") {
      const parsed = actionSchemaMap.assign.parse(json);
      await assignBed(supabase, parsed);
      return NextResponse.json({ ok: true });
    }

    if (json.action === "transfer") {
      const parsed = actionSchemaMap.transfer.parse(json);
      await transferBed(supabase, parsed);
      return NextResponse.json({ ok: true });
    }

    if (json.action === "discharge") {
      const parsed = actionSchemaMap.discharge.parse(json);
      await dischargePatient(supabase, parsed);
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json(
      { ok: false, message: "Invalid action. Use assign|transfer|discharge." },
      { status: 400 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "ADT action failed";
    return NextResponse.json({ ok: false, message }, { status: 400 });
  }
}
