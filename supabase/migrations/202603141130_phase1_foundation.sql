create extension if not exists "pgcrypto";

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  npi text,
  created_at timestamptz not null default now()
);

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  organization_id uuid not null references public.organizations(id),
  role text not null check (role in ('admin','registrar','nurse','physician','billing','auditor')),
  created_at timestamptz not null default now()
);

create table if not exists public.patients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  mrn text not null,
  first_name text not null,
  last_name text not null,
  dob date not null,
  sex_at_birth text check (sex_at_birth is null or sex_at_birth in ('female', 'male', 'intersex', 'unknown')),
  phone text,
  address jsonb check (address is null or jsonb_typeof(address) = 'object'),
  insurance jsonb check (insurance is null or jsonb_typeof(insurance) = 'object'),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default now(),
  unique (organization_id, mrn)
);

create table if not exists public.beds (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  unit text not null,
  room text not null,
  bed_label text not null,
  status text not null check (status in ('available', 'occupied', 'cleaning', 'maintenance', 'reserved')),
  acuity_level text,
  unique (organization_id, unit, room, bed_label)
);

create table if not exists public.bed_assignments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  patient_id uuid not null references public.patients(id),
  bed_id uuid not null references public.beds(id),
  assigned_at timestamptz not null default now(),
  discharged_at timestamptz,
  assigned_by uuid not null references auth.users(id)
);

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id),
  event_type text not null check (event_type in ('registration_created', 'bed_assigned', 'bed_transferred', 'bed_discharged')),
  patient_id uuid references public.patients(id),
  assignment_id uuid references public.bed_assignments(id),
  actor_user_id uuid not null references auth.users(id),
  payload jsonb,
  occurred_at timestamptz not null default now()
);

create index if not exists idx_patients_org_mrn on public.patients (organization_id, mrn);
create index if not exists idx_beds_org_status on public.beds (organization_id, status);
create index if not exists idx_active_assignments on public.bed_assignments (organization_id, bed_id) where discharged_at is null;
create index if not exists idx_audit_events_patient_time on public.audit_events (patient_id, occurred_at desc);

grant usage on schema public to anon, authenticated, service_role;
grant all privileges on all tables in schema public to anon, authenticated, service_role;
grant all privileges on all sequences in schema public to anon, authenticated, service_role;
grant all privileges on all functions in schema public to anon, authenticated, service_role;
alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
alter default privileges in schema public grant all on sequences to anon, authenticated, service_role;
alter default privileges in schema public grant all on functions to anon, authenticated, service_role;

alter table public.organizations enable row level security;
alter table public.user_profiles enable row level security;
alter table public.patients enable row level security;
alter table public.beds enable row level security;
alter table public.bed_assignments enable row level security;
alter table public.audit_events enable row level security;

alter table public.organizations disable row level security;
alter table public.user_profiles disable row level security;
alter table public.patients disable row level security;
alter table public.beds disable row level security;
alter table public.bed_assignments disable row level security;
alter table public.audit_events disable row level security;

drop policy if exists org_scoped_select_organizations on public.organizations;
create policy org_scoped_select_organizations on public.organizations
for select using (
  id = (select organization_id from public.user_profiles where user_id = auth.uid())
);

drop policy if exists self_read_profile on public.user_profiles;
create policy self_read_profile on public.user_profiles
for select using (user_id = auth.uid());

drop policy if exists org_scoped_select_patients on public.patients;
create policy org_scoped_select_patients on public.patients
for select using (
  organization_id = (select organization_id from public.user_profiles where user_id = auth.uid())
);

drop policy if exists org_scoped_write_patients on public.patients;
create policy org_scoped_write_patients on public.patients
for all
using (
  organization_id = (select organization_id from public.user_profiles where user_id = auth.uid())
)
with check (
  organization_id = (select organization_id from public.user_profiles where user_id = auth.uid())
);

drop policy if exists org_scoped_select_beds on public.beds;
create policy org_scoped_select_beds on public.beds
for select using (
  organization_id = (select organization_id from public.user_profiles where user_id = auth.uid())
);

drop policy if exists nurse_registrar_bed_write on public.beds;
create policy nurse_registrar_bed_write on public.beds
for update using (
  organization_id = (select organization_id from public.user_profiles where user_id = auth.uid())
  and (select role from public.user_profiles where user_id = auth.uid()) in ('admin', 'nurse', 'registrar')
);

drop policy if exists org_scoped_assignments on public.bed_assignments;
create policy org_scoped_assignments on public.bed_assignments
for all
using (
  organization_id = (select organization_id from public.user_profiles where user_id = auth.uid())
)
with check (
  organization_id = (select organization_id from public.user_profiles where user_id = auth.uid())
);

drop policy if exists org_scoped_audit_events on public.audit_events;
create policy org_scoped_audit_events on public.audit_events
for all
using (
  organization_id = (select organization_id from public.user_profiles where user_id = auth.uid())
)
with check (
  organization_id = (select organization_id from public.user_profiles where user_id = auth.uid())
);

create or replace function public.perform_adt_action(
  p_action text,
  p_org_id uuid,
  p_patient_id uuid,
  p_bed_id uuid,
  p_actor_id uuid,
  p_target_bed_id uuid default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_active_assignment public.bed_assignments;
  v_new_assignment public.bed_assignments;
begin
  if p_action not in ('assign', 'transfer', 'discharge') then
    raise exception 'Unsupported ADT action: %', p_action;
  end if;

  if auth.uid() is null or auth.uid() <> p_actor_id then
    raise exception 'Invalid actor context';
  end if;

  if not exists (
    select 1
    from public.user_profiles
    where user_id = p_actor_id
      and organization_id = p_org_id
      and role in ('admin', 'nurse', 'registrar')
  ) then
    raise exception 'Actor is not authorized for this organization';
  end if;

  select * into v_active_assignment
  from public.bed_assignments
  where organization_id = p_org_id
    and patient_id = p_patient_id
    and discharged_at is null
  for update;

  if p_action = 'assign' then
    if v_active_assignment.id is not null then
      raise exception 'Patient already has an active bed assignment';
    end if;

    update public.beds
    set status = 'occupied'
    where id = p_bed_id and organization_id = p_org_id and status in ('available', 'reserved');

    if not found then
      raise exception 'Bed not available for assignment';
    end if;

    insert into public.bed_assignments (organization_id, patient_id, bed_id, assigned_by)
    values (p_org_id, p_patient_id, p_bed_id, p_actor_id)
    returning * into v_new_assignment;

    insert into public.audit_events (organization_id, event_type, patient_id, assignment_id, actor_user_id, payload)
    values (p_org_id, 'bed_assigned', p_patient_id, v_new_assignment.id, p_actor_id,
      jsonb_build_object('bed_id', p_bed_id));

    return jsonb_build_object('assignment_id', v_new_assignment.id, 'action', p_action);
  end if;

  if v_active_assignment.id is null then
    raise exception 'No active assignment found for patient';
  end if;

  if p_action = 'transfer' then
    if p_target_bed_id is null then
      raise exception 'Target bed id is required for transfer';
    end if;

    update public.beds
    set status = 'available'
    where id = v_active_assignment.bed_id and organization_id = p_org_id;

    update public.bed_assignments
    set discharged_at = now()
    where id = v_active_assignment.id;

    update public.beds
    set status = 'occupied'
    where id = p_target_bed_id and organization_id = p_org_id and status in ('available', 'reserved');

    if not found then
      raise exception 'Target bed is not available';
    end if;

    insert into public.bed_assignments (organization_id, patient_id, bed_id, assigned_by)
    values (p_org_id, p_patient_id, p_target_bed_id, p_actor_id)
    returning * into v_new_assignment;

    insert into public.audit_events (organization_id, event_type, patient_id, assignment_id, actor_user_id, payload)
    values (p_org_id, 'bed_transferred', p_patient_id, v_new_assignment.id, p_actor_id,
      jsonb_build_object('from_bed_id', v_active_assignment.bed_id, 'to_bed_id', p_target_bed_id));

    return jsonb_build_object('assignment_id', v_new_assignment.id, 'action', p_action);
  end if;

  update public.beds
  set status = 'available'
  where id = v_active_assignment.bed_id and organization_id = p_org_id;

  update public.bed_assignments
  set discharged_at = now()
  where id = v_active_assignment.id;

  insert into public.audit_events (organization_id, event_type, patient_id, assignment_id, actor_user_id, payload)
  values (p_org_id, 'bed_discharged', p_patient_id, v_active_assignment.id, p_actor_id,
    jsonb_build_object('bed_id', v_active_assignment.bed_id));

  return jsonb_build_object('assignment_id', v_active_assignment.id, 'action', p_action);
end;
$$;

grant execute on function public.perform_adt_action(text, uuid, uuid, uuid, uuid, uuid) to anon, authenticated, service_role;
