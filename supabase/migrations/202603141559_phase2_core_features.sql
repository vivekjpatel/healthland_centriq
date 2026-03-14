begin;

create table if not exists public.encounters (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_type text not null check (encounter_type in ('inpatient', 'outpatient', 'ed', 'telehealth')),
  status text not null default 'open' check (status in ('open', 'closed', 'canceled')),
  admitted_at timestamptz not null default now(),
  discharged_at timestamptz,
  attending_physician uuid references auth.users(id),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.patient_problems (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  icd_code text,
  description text not null,
  status text not null default 'active' check (status in ('active', 'resolved')),
  onset_date date,
  resolved_date date,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.patient_allergies (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  patient_id uuid not null references public.patients(id) on delete cascade,
  allergen text not null,
  reaction text,
  severity text check (severity in ('mild', 'moderate', 'severe')),
  status text not null default 'active' check (status in ('active', 'inactive')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.patient_medications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  medication_name text not null,
  dose text,
  route text,
  frequency text,
  status text not null default 'active' check (status in ('active', 'stopped')),
  started_at timestamptz not null default now(),
  stopped_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.patient_vitals (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  vital_type text not null,
  value text not null,
  unit text,
  recorded_at timestamptz not null default now(),
  recorded_by uuid not null references auth.users(id)
);

create table if not exists public.care_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  patient_id uuid not null references public.patients(id) on delete cascade,
  title text not null,
  goal text,
  intervention text,
  outcome text,
  status text not null default 'active' check (status in ('active', 'resolved')),
  updated_by uuid not null references auth.users(id),
  updated_at timestamptz not null default now()
);

create table if not exists public.clinical_notes (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  note_type text not null check (note_type in ('progress', 'nursing', 'physician', 'discharge', 'care_plan')),
  status text not null default 'draft' check (status in ('draft', 'signed', 'addendum')),
  parent_note_id uuid references public.clinical_notes(id) on delete set null,
  content text not null,
  authored_by uuid not null references auth.users(id),
  authored_at timestamptz not null default now(),
  signed_at timestamptz
);

create table if not exists public.physician_orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  order_type text not null check (order_type in ('medication', 'lab', 'imaging', 'procedure', 'treatment')),
  priority text not null default 'routine' check (priority in ('routine', 'urgent', 'stat')),
  status text not null default 'draft' check (status in ('draft', 'signed', 'acknowledged', 'in_progress', 'completed', 'canceled')),
  indication text,
  instructions text,
  details jsonb,
  ordered_by uuid not null references auth.users(id),
  signed_by uuid references auth.users(id),
  acknowledged_by uuid references auth.users(id),
  completed_by uuid references auth.users(id),
  canceled_by uuid references auth.users(id),
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.charges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  patient_id uuid not null references public.patients(id) on delete cascade,
  encounter_id uuid references public.encounters(id) on delete set null,
  order_id uuid references public.physician_orders(id) on delete set null,
  cpt_code text,
  description text not null,
  units integer not null default 1 check (units > 0),
  unit_amount numeric(12, 2) not null check (unit_amount >= 0),
  total_amount numeric(12, 2) not null check (total_amount >= 0),
  status text not null default 'open' check (status in ('open', 'billed', 'void')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  patient_id uuid not null references public.patients(id) on delete cascade,
  charge_id uuid not null references public.charges(id) on delete cascade,
  payer text not null,
  claim_number text,
  status text not null default 'draft' check (status in ('draft', 'submitted', 'paid', 'denied', 'partial')),
  denial_reason text,
  submitted_at timestamptz,
  adjudicated_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now()
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  patient_id uuid not null references public.patients(id) on delete cascade,
  claim_id uuid not null references public.claims(id) on delete cascade,
  amount numeric(12, 2) not null check (amount > 0),
  payment_method text,
  reference_number text,
  posted_by uuid not null references auth.users(id),
  posted_at timestamptz not null default now()
);

create index if not exists idx_encounters_patient_time on public.encounters (patient_id, admitted_at desc);
create index if not exists idx_problems_patient_status on public.patient_problems (patient_id, status);
create index if not exists idx_allergies_patient_status on public.patient_allergies (patient_id, status);
create index if not exists idx_medications_patient_status on public.patient_medications (patient_id, status);
create index if not exists idx_vitals_patient_time on public.patient_vitals (patient_id, recorded_at desc);
create index if not exists idx_notes_patient_time on public.clinical_notes (patient_id, authored_at desc);
create index if not exists idx_orders_patient_status on public.physician_orders (patient_id, status);
create index if not exists idx_charges_patient_time on public.charges (patient_id, created_at desc);
create index if not exists idx_claims_patient_status on public.claims (patient_id, status);
create index if not exists idx_payments_claim_time on public.payments (claim_id, posted_at desc);

alter table public.audit_events drop constraint if exists audit_events_event_type_check;
alter table public.audit_events
  add constraint audit_events_event_type_check check (
    event_type in (
      'registration_created',
      'bed_assigned',
      'bed_transferred',
      'bed_discharged',
      'encounter_created',
      'problem_added',
      'allergy_added',
      'vitals_recorded',
      'note_created',
      'note_signed',
      'order_created',
      'order_updated',
      'charge_created',
      'claim_created',
      'payment_posted'
    )
  );

grant usage on schema public to anon, authenticated, service_role;
grant all privileges on all tables in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;
grant all privileges on all functions in schema public to anon, authenticated, service_role;

alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

alter table public.encounters disable row level security;
alter table public.patient_problems disable row level security;
alter table public.patient_allergies disable row level security;
alter table public.patient_medications disable row level security;
alter table public.patient_vitals disable row level security;
alter table public.care_plans disable row level security;
alter table public.clinical_notes disable row level security;
alter table public.physician_orders disable row level security;
alter table public.charges disable row level security;
alter table public.claims disable row level security;
alter table public.payments disable row level security;

commit;
