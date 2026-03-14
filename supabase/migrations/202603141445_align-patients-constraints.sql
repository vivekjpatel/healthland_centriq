-- Align patients table constraints with current intake form contract.
-- Safe for already-provisioned databases where phase1 migration has already run.

begin;

-- Normalize any legacy values so new constraints can be added safely.
update public.patients
set sex_at_birth = null
where sex_at_birth is not null
  and sex_at_birth not in ('female', 'male', 'intersex', 'unknown');

update public.patients
set address = null
where address is not null
  and jsonb_typeof(address) <> 'object';

update public.patients
set insurance = null
where insurance is not null
  and jsonb_typeof(insurance) <> 'object';

alter table public.patients
  drop constraint if exists patients_sex_at_birth_check,
  drop constraint if exists patients_address_is_object_check,
  drop constraint if exists patients_insurance_is_object_check;

alter table public.patients
  add constraint patients_sex_at_birth_check
    check (sex_at_birth is null or sex_at_birth in ('female', 'male', 'intersex', 'unknown')),
  add constraint patients_address_is_object_check
    check (address is null or jsonb_typeof(address) = 'object'),
  add constraint patients_insurance_is_object_check
    check (insurance is null or jsonb_typeof(insurance) = 'object');

commit;
