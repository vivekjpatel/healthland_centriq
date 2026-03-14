# Phase 1 Foundation: Patient Registration and Bed Management

## 1. Feature Overview
This phase delivers two MVP-critical capabilities for a Critical Access Hospital (CAH):
- Patient Registration & Demographics: fast intake, insurance capture, guarantor details, and identity verification.
- Bed Management: real-time bed status, admissions, discharges, and transfers (ADT) for low-bed-capacity operations.

CAH workflow priorities:
- Minimize intake time at front desk and ED.
- Maintain accurate census for 25-bed-or-fewer facilities.
- Ensure role-based access and full auditability for HIPAA.

## 2. Supabase Schema (DDL + HIPAA-Oriented RLS)
```sql
-- Required extension
create extension if not exists "pgcrypto";

create table if not exists organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  npi text,
  created_at timestamptz not null default now()
);

create table if not exists user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references organizations(id),
  role text not null check (role in ('admin','registrar','nurse','physician','billing','auditor')),
  created_at timestamptz not null default now()
);

create table if not exists patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  mrn text not null,
  first_name text not null,
  last_name text not null,
  dob date not null,
  sex_at_birth text,
  phone text,
  address jsonb,
  insurance jsonb,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, mrn)
);

create table if not exists beds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  unit text not null,
  room text not null,
  bed_label text not null,
  status text not null check (status in ('available','occupied','cleaning','maintenance','reserved')),
  acuity_level text,
  unique (organization_id, unit, room, bed_label)
);

create table if not exists bed_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid not null references patients(id),
  bed_id uuid not null references beds(id),
  assigned_at timestamptz not null default now(),
  discharged_at timestamptz,
  assigned_by uuid not null references auth.users(id)
);

alter table organizations enable row level security;
alter table user_profiles enable row level security;
alter table patients enable row level security;
alter table beds enable row level security;
alter table bed_assignments enable row level security;

create policy org_scoped_select_patients on patients
for select using (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
);
create policy org_scoped_write_patients on patients
for all using (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
)
with check (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
);

create policy org_scoped_select_beds on beds
for select using (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
);
create policy nurse_registrar_bed_write on beds
for update using (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
  and (select role from user_profiles where user_id = auth.uid()) in ('admin','nurse','registrar')
);

create policy org_scoped_assignments on bed_assignments
for all using (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
)
with check (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
);
```

## 3. Next.js Architecture (App Router)
```txt
src/
  app/
    (auth)/sign-in/page.tsx
    (dashboard)/registration/page.tsx
    (dashboard)/beds/page.tsx
    api/registration/route.ts
    api/adt/route.ts
  components/
    registration/patient-intake-form.tsx
    beds/bed-board.tsx
    beds/transfer-dialog.tsx
  actions/
    registration.ts
    bed-management.ts
  utils/supabase/
    client.ts
    server.ts
    middleware.ts
```
Guidance:
- Use Server Components for data loading (patient list, bed census).
- Use Server Actions for create/update mutations with `revalidatePath`.
- Keep PHI reads on server; pass only required fields to client components.

## 4. Specific Implementation Prompts (for Coding LLM)
1. Build `patient-intake-form.tsx` with fields for demographics + insurance JSON, Zod validation, and submit to `createPatient` Server Action.
2. Implement `createPatient` in `src/actions/registration.ts` using Supabase server client and organization-scoped insert.
3. Build a `bed-board.tsx` Kanban-style view grouped by status with occupancy counts and color-coded acuity.
4. Implement `assignBed`, `transferBed`, and `dischargePatient` actions with transaction-safe updates to `beds` and `bed_assignments`.
5. Add audit logging table + inserts for each ADT event; show timeline on patient profile.
6. Add route protection middleware that redirects unauthenticated users to `/sign-in` and refreshes session cookies.
