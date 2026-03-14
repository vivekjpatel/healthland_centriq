begin;

alter table public.patients
  add column if not exists deleted_at timestamptz,
  add column if not exists deleted_by uuid references auth.users(id);

create index if not exists idx_patients_org_active_created
  on public.patients (organization_id, created_at desc)
  where deleted_at is null;

commit;
