# Phase 4 AI Innovation: Clinical Decision Support and Predictive Analytics

## 1. Feature Overview
This phase implements high-value advanced capabilities:
- AI Clinical Decision Support: evidence-aligned alerts for deterioration risk, sepsis cues, and medication safety.
- Predictive Analytics: bed demand, ED surge, and staffing forecasts for CAH resource constraints.

CAH design principles:
- AI is assistive, not autonomous; clinician remains final decision maker.
- Explainability and confidence scores are mandatory.
- Strict PHI controls, minimal-data inference, and complete decision audit trails.

## 2. Supabase Schema (DDL + HIPAA-Oriented RLS)
```sql
create table if not exists ai_models (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  model_name text not null,
  model_version text not null,
  use_case text not null,
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  unique (organization_id, model_name, model_version)
);

create table if not exists ai_predictions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid references patients(id),
  encounter_id uuid references encounters(id),
  model_id uuid not null references ai_models(id),
  prediction_type text not null check (prediction_type in ('sepsis_risk','deterioration_risk','bed_demand','ed_volume','staffing_need')),
  score numeric(5,4) not null,
  risk_band text not null check (risk_band in ('low','moderate','high','critical')),
  explanation jsonb,
  predicted_for timestamptz,
  generated_at timestamptz not null default now()
);

create table if not exists clinical_alerts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  patient_id uuid references patients(id),
  encounter_id uuid references encounters(id),
  alert_type text not null,
  severity text not null check (severity in ('info','warning','critical')),
  message text not null,
  source_prediction_id uuid references ai_predictions(id),
  status text not null check (status in ('new','acknowledged','dismissed','resolved')),
  created_at timestamptz not null default now(),
  acknowledged_by uuid references auth.users(id),
  acknowledged_at timestamptz
);

create table if not exists ai_audit_log (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id),
  actor_user_id uuid references auth.users(id),
  patient_id uuid references patients(id),
  encounter_id uuid references encounters(id),
  action text not null,
  details jsonb,
  occurred_at timestamptz not null default now()
);

alter table ai_models enable row level security;
alter table ai_predictions enable row level security;
alter table clinical_alerts enable row level security;
alter table ai_audit_log enable row level security;

create policy org_scoped_ai_models on ai_models
for all using (organization_id = (select organization_id from user_profiles where user_id = auth.uid()))
with check (organization_id = (select organization_id from user_profiles where user_id = auth.uid()));

create policy clinician_read_predictions on ai_predictions
for select using (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
  and (select role from user_profiles where user_id = auth.uid()) in ('admin','physician','nurse','auditor')
);
create policy service_write_predictions on ai_predictions
for insert with check (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
);

create policy clinician_manage_alerts on clinical_alerts
for all using (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
  and (select role from user_profiles where user_id = auth.uid()) in ('admin','physician','nurse','auditor')
)
with check (
  organization_id = (select organization_id from user_profiles where user_id = auth.uid())
  and (select role from user_profiles where user_id = auth.uid()) in ('admin','physician','nurse')
);

create policy org_scoped_ai_audit on ai_audit_log
for all using (organization_id = (select organization_id from user_profiles where user_id = auth.uid()))
with check (organization_id = (select organization_id from user_profiles where user_id = auth.uid()));
```

## 3. Next.js Architecture (App Router)
```txt
src/
  app/
    (dashboard)/ai/clinical-alerts/page.tsx
    (dashboard)/ai/predictions/page.tsx
    (dashboard)/ai/operations-forecast/page.tsx
    api/ai/infer/route.ts
    api/ai/alerts/route.ts
  components/
    ai/risk-score-card.tsx
    ai/alert-triage-panel.tsx
    ai/forecast-chart.tsx
    ai/explanation-drawer.tsx
  actions/
    ai-alerts.ts
    ai-feedback.ts
```
Guidance:
- Keep model inference orchestration server-side; never expose provider secrets in client.
- Persist prompt/version/response metadata for governance and reproducibility.
- Add human-feedback capture to tune false-positive/false-negative behavior.

## 4. Specific Implementation Prompts (for Coding LLM)
1. Build `clinical-alerts/page.tsx` showing prioritized alerts by severity with acknowledge/dismiss actions.
2. Implement `api/ai/infer/route.ts` that pulls patient context, calls model provider, stores prediction + explanation, and emits alert when threshold exceeded.
3. Build `forecast-chart.tsx` for 24h/72h bed and ED volume predictions with confidence intervals.
4. Implement `acknowledgeAlert` and `resolveAlert` actions with mandatory clinician note for critical alerts.
5. Add `ai_audit_log` inserts for inference request, model output, alert action, and overrides.
6. Implement model governance page: active model version, performance metrics, and safe rollback button.
