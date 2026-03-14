# Phase 3 Revenue Ops: Revenue Cycle Management and Billing

## 1. Feature Overview
This phase operationalizes CAH financial sustainability:
- Revenue Cycle Management: charge capture, claims lifecycle, remittance, denial handling.
- Billing: payer plans, patient responsibility, statements, payment posting.

CAH-specific goals:
- Reduce days in A/R and denial rate.
- Support Medicare/Medicaid-heavy payer mix common in rural hospitals.
- Link clinical events and orders to defensible billable charges.

## 2. Supabase Schema (DDL + HIPAA-Oriented RLS)
```sql
create table if not exists payer_plans (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  payer_name text not null,
  plan_code text not null,
  timely_filing_days int,
  unique (organization_id, payer_name, plan_code)
);

create table if not exists charges (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  encounter_id uuid not null references encounters(id),
  patient_id uuid not null references patients(id),
  cpt_code text,
  hcpcs_code text,
  revenue_code text,
  units numeric(10,2) not null default 1,
  amount numeric(12,2) not null,
  status text not null check (status in ('captured','coded','billed','voided')),
  created_at timestamptz not null default now()
);

create table if not exists claims (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  encounter_id uuid not null references encounters(id),
  patient_id uuid not null references patients(id),
  payer_plan_id uuid references payer_plans(id),
  claim_number text,
  total_amount numeric(12,2) not null,
  status text not null check (status in ('draft','submitted','accepted','rejected','paid','denied')),
  submitted_at timestamptz,
  updated_at timestamptz not null default now()
);

create table if not exists claim_line_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  claim_id uuid not null references claims(id) on delete cascade,
  charge_id uuid not null references charges(id),
  diagnosis_pointer text,
  modifier_codes text[]
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  claim_id uuid references claims(id),
  patient_id uuid not null references patients(id),
  source text not null check (source in ('payer','patient')),
  amount numeric(12,2) not null,
  posted_at timestamptz not null default now(),
  posted_by uuid not null references auth.users(id)
);

alter table payer_plans enable row level security;
alter table charges enable row level security;
alter table claims enable row level security;
alter table claim_line_items enable row level security;
alter table payments enable row level security;

create policy org_scoped_payer_plans on payer_plans
for all using (organization_id = (select organization_id from user_profiles where user_id = auth.uid()))
with check (organization_id = (select organization_id from user_profiles where user_id = auth.uid()));

create policy billing_role_charges_write on charges
for all using (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
  and (select role from user_profiles where user_id = auth.uid()) in ('admin','billing','auditor')
)
with check (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
  and (select role from user_profiles where user_id = auth.uid()) in ('admin','billing')
);

create policy billing_role_claims_rw on claims
for all using (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
  and (select role from user_profiles where user_id = auth.uid()) in ('admin','billing','auditor')
)
with check (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
  and (select role from user_profiles where user_id = auth.uid()) in ('admin','billing')
);

create policy org_scoped_claim_lines on claim_line_items
for all using (organization_id = (select organization_id from user_profiles where user_id = auth.uid()))
with check (organization_id = (select organization_id from user_profiles where user_id = auth.uid()));

create policy billing_payments_rw on payments
for all using (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
  and (select role from user_profiles where user_id = auth.uid()) in ('admin','billing','auditor')
)
with check (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
  and (select role from user_profiles where user_id = auth.uid()) in ('admin','billing')
);
```

## 3. Next.js Architecture (App Router)
```txt
src/
  app/
    (dashboard)/billing/charges/page.tsx
    (dashboard)/billing/claims/page.tsx
    (dashboard)/billing/claims/[claimId]/page.tsx
    (dashboard)/billing/payments/page.tsx
    api/claims/submit/route.ts
    api/era/route.ts
  components/
    billing/charge-capture-grid.tsx
    billing/claim-workqueue.tsx
    billing/denial-worklist.tsx
    billing/payment-posting-form.tsx
  actions/
    billing.ts
    claims.ts
    payments.ts
```
Guidance:
- Use role-segmented pages and server-side authorization.
- Track all financial state transitions with immutable audit records.
- Keep payer integrations behind route handlers with signed webhook verification.

## 4. Specific Implementation Prompts (for Coding LLM)
1. Build `charge-capture-grid.tsx` with CPT/HCPCS lookup, quantity, and validation for missing diagnosis pointers.
2. Implement `generateClaim` action that groups eligible charges by encounter + payer and creates line items.
3. Build `claim-workqueue.tsx` with filters (`draft`, `denied`, `submitted`) and aging buckets.
4. Implement claim status transitions with guardrails (no submit if missing required fields).
5. Build `payment-posting-form.tsx` for ERA/manual posting and automatic claim balance updates.
6. Add denial management UI with root-cause categories, appeal deadline tracking, and re-submit workflow.
