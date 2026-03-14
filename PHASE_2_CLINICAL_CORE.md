# Phase 2 Clinical Core: EHR, CPOE, and Nursing Notes

## 1. Feature Overview
This phase delivers core clinical operations for CAH inpatient and ED settings:
- Electronic Health Records (EHR): problem list, allergies, meds, vitals, encounter charting.
- Physician Order Entry (CPOE): medication, lab, imaging, and procedure orders.
- Clinical Documentation: structured nursing notes and physician progress notes.

CAH focus:
- Rapid chart retrieval for low-staff shifts.
- Clear handoff documentation across nurses, ED, and on-call physicians.
- Safety controls for allergies, duplicate orders, and high-risk medication checks.

## 2. Supabase Schema (DDL + HIPAA-Oriented RLS)
```sql
create table if not exists encounters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  encounter_type text not null check (encounter_type in ('ed','inpatient','outpatient')),
  attending_provider_id uuid,
  admit_time timestamptz,
  discharge_time timestamptz,
  status text not null check (status in ('open','closed')),
  created_at timestamptz not null default now()
);

create table if not exists clinical_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  encounter_id uuid not null references encounters(id),
  patient_id uuid not null references patients(id),
  note_type text not null check (note_type in ('nursing','physician','handoff','care_plan')),
  body text not null,
  authored_by uuid not null references auth.users(id),
  authored_at timestamptz not null default now(),
  amended_at timestamptz
);

create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  encounter_id uuid not null references encounters(id),
  patient_id uuid not null references patients(id),
  order_type text not null check (order_type in ('medication','lab','imaging','procedure')),
  order_text text not null,
  priority text not null check (priority in ('routine','urgent','stat')),
  status text not null check (status in ('pending','active','completed','cancelled')),
  placed_by uuid not null references auth.users(id),
  placed_at timestamptz not null default now()
);

create table if not exists medication_administration (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  order_id uuid not null references orders(id),
  administered_by uuid not null references auth.users(id),
  administered_at timestamptz not null,
  dose text not null,
  route text,
  notes text
);

alter table encounters enable row level security;
alter table clinical_notes enable row level security;
alter table orders enable row level security;
alter table medication_administration enable row level security;

create policy org_scoped_encounters on encounters
for all using (organization_id = (select organization_id from user_profiles where user_id = auth.uid()))
with check (organization_id = (select organization_id from user_profiles where user_id = auth.uid()));

create policy org_scoped_notes on clinical_notes
for all using (organization_id = (select organization_id from user_profiles where user_id = auth.uid()))
with check (organization_id = (select organization_id from user_profiles where user_id = auth.uid()));

create policy physician_nurse_order_write on orders
for insert with check (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
  and (select role from user_profiles where user_id = auth.uid()) in ('admin','physician','nurse')
);
create policy org_scoped_order_read on orders
for select using (organization_id = (select organization_id from user_profiles where user_id = auth.uid()));

create policy mar_nurse_write on medication_administration
for insert with check (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
  and (select role from user_profiles where user_id = auth.uid()) in ('admin','nurse')
);
create policy mar_org_read on medication_administration
for select using (organization_id = (select organization_id from user_profiles where user_id = auth.uid()));
```

## 3. Next.js Architecture (App Router)
```txt
src/
  app/
    (dashboard)/patients/[patientId]/chart/page.tsx
    (dashboard)/encounters/[encounterId]/orders/page.tsx
    (dashboard)/encounters/[encounterId]/notes/page.tsx
    api/orders/route.ts
    api/notes/route.ts
  components/
    chart/problem-list.tsx
    orders/cpoe-order-form.tsx
    notes/nursing-note-editor.tsx
    notes/physician-note-editor.tsx
  actions/
    ehr.ts
    cpoe.ts
    notes.ts
```
Guidance:
- Use Server Components for chart summaries and order timelines.
- Keep write paths in Server Actions with role checks at action + RLS layers.
- Expose API routes only for integration/webhook use, not primary UI mutations.

## 4. Specific Implementation Prompts (for Coding LLM)
1. Implement `chart/page.tsx` server loader that fetches demographics, active encounter, allergies, active meds, and recent notes in parallel.
2. Build `cpoe-order-form.tsx` with type-specific sections (med/lab/imaging/procedure), STAT toggle, and duplicate-order warning UI.
3. Implement `placeOrder` and `cancelOrder` actions with physician/nurse role guard and conflict checks.
4. Build `nursing-note-editor.tsx` with SBAR template and shift-signoff metadata.
5. Add medication administration record (MAR) flow: pending med orders, barcode field input, and administer action.
6. Add immutable note versioning: on amendment, archive previous text in `clinical_note_versions` table and display history.
