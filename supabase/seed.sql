insert into public.organizations (id, name, npi)
values ('11111111-1111-1111-1111-111111111111', 'CAH Demo Hospital', '1234567890')
on conflict (id) do nothing;

-- Create auth.users records in Supabase Auth first, then map them here.
-- Example IDs should be replaced with real user IDs from auth.users.
insert into public.user_profiles (user_id, organization_id, role)
values
  ('2cc09ce0-fb48-4c8f-ba5b-bb81c7d4e6b6', '11111111-1111-1111-1111-111111111111', 'admin'),
  ('cdf2f3c9-1d6c-419a-acf9-f1b7e667a736', '11111111-1111-1111-1111-111111111111', 'registrar'),
  ('922e6a63-0f01-4b89-a173-4b413a00b308', '11111111-1111-1111-1111-111111111111', 'nurse')
on conflict (user_id) do nothing;

insert into public.beds (organization_id, unit, room, bed_label, status, acuity_level)
values
  ('11111111-1111-1111-1111-111111111111', 'Med-Surg', '101', 'A', 'available', 'low'),
  ('11111111-1111-1111-1111-111111111111', 'Med-Surg', '101', 'B', 'available', 'low'),
  ('11111111-1111-1111-1111-111111111111', 'ED', '1', 'A', 'available', 'high'),
  ('11111111-1111-1111-1111-111111111111', 'ED', '2', 'A', 'reserved', 'moderate')
on conflict (organization_id, unit, room, bed_label) do nothing;
