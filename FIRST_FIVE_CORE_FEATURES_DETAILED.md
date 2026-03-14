# Detailed Specification: First Five Core Features (from `srs.pdf`)

Source: `srs.pdf` (generated March 09, 2026)  
Context: Critical Access Hospital (CAH) HIS for hospitals with 25 or fewer beds.

This document expands the first five **must-have** core features into implementable product requirements.

## 1) Patient Registration & Demographics
Priority: must-have  
Complexity: medium

### Objective
Enable rapid, accurate patient intake with complete demographic and insurance capture while minimizing front-desk processing time.

### Primary Users
- Registrar
- Nurse (read/update limited fields)
- Billing staff (insurance/guarantor fields)
- Admin

### Key Workflows
1. New patient intake
- Search by MRN/name/DOB to prevent duplicates.
- Create patient if not found.
- Capture demographics, contact, address, emergency contact, guarantor, payer plan details.

2. Returning patient check-in
- Verify identity and demographic changes.
- Re-verify insurance eligibility.
- Update consent and contact preferences.

3. Duplicate management
- Flag potential duplicate records on matching demographics.
- Route to admin/registrar merge workflow.

### Required Data (minimum)
- Patient identity: MRN, first name, last name, DOB, sex at birth
- Contact: phone, address (line1/line2/city/state/postal code)
- Coverage: payer, plan, member ID, group number
- Guarantor: name, relationship
- Audit: created_by, updated_by, timestamps

### Validation & Rules
- MRN unique per organization
- DOB must be valid date, not future
- Required fields enforced at UI and API levels
- Address and insurance stored as valid object JSON if using JSONB

### Permissions & Security
- Registrar/admin: create/update
- Nurse/physician: read, limited edit
- Billing: read demographic + edit billing fields
- Full audit trail for create/update

### API/Action Surface
- `createPatient`
- `updatePatientDemographics`
- `searchPatients`
- `checkInsuranceEligibility` (sync/async)

### Acceptance Criteria
- New patient can be registered in less than 2 minutes
- Duplicate MRN insertion blocked
- Every change is auditable with actor and timestamp
- Eligibility check result visible in workflow

---

## 2) Electronic Health Records (EHR)
Priority: must-have  
Complexity: high

### Objective
Provide a longitudinal patient chart with structured clinical data and rapid retrieval for care teams.

### Primary Users
- Physicians
- Nurses
- Clinical support staff
- Auditors (read-only)

### Key Workflows
1. Chart summary view
- Display problem list, allergies, medications, vitals, recent notes, active orders.

2. Encounter-based charting
- Open encounter context (ED, inpatient, outpatient).
- Capture structured data and narrative notes.

3. Historical retrieval
- Access prior encounters, diagnoses, labs, imaging, and discharge summaries.

### Required Data Domains
- Encounters
- Diagnoses/problem list
- Allergies/adverse reactions
- Medication list (active/history)
- Vitals and observations
- Lab/imaging results links
- Clinical notes and attachments

### Functional Rules
- Time-sequenced timeline per patient
- Soft-delete/versioning for correction workflows
- Source attribution for imported records

### Permissions & Security
- Role-based chart section access
- Break-glass access with mandatory reason and event logging
- PHI access events logged for compliance

### API/Action Surface
- `getPatientChart`
- `createEncounter`
- `addProblem`
- `addAllergy`
- `recordVitals`
- `appendClinicalNote`

### Acceptance Criteria
- Chart opens within acceptable response target for active patients
- Clinician can complete encounter documentation without leaving chart context
- All clinical changes are versioned/auditable

---

## 3) Physician Order Entry (CPOE)
Priority: must-have  
Complexity: medium

### Objective
Allow providers to place, track, and manage medication, lab, imaging, and treatment orders digitally with safety checks.

### Primary Users
- Physicians (order placement)
- Nurses (acknowledge/execute nursing orders)
- Lab/Radiology/Pharmacy teams (fulfillment)

### Key Workflows
1. Place order
- Select patient + encounter.
- Choose order type (medication/lab/imaging/procedure).
- Enter priority, indication, schedule, and comments.

2. Safety checks
- Duplicate order warning
- Allergy interaction checks
- Dose/frequency guardrails (where applicable)

3. Order lifecycle
- Status states: draft, signed, acknowledged, in-progress, completed, canceled.
- Capture who signed/canceled and reason.

### Data Requirements
- Order header: patient_id, encounter_id, type, priority, status, ordered_by
- Clinical metadata: indication, instructions, route/frequency (meds)
- Fulfillment metadata: acknowledged_by, completed_by, timestamps

### Permissions & Security
- Only authorized roles can sign/cancel orders
- Cancellations require reason
- Full audit events for status transitions

### API/Action Surface
- `createOrder`
- `signOrder`
- `acknowledgeOrder`
- `completeOrder`
- `cancelOrder`
- `listActiveOrders`

### Acceptance Criteria
- Provider can place and sign an order in one workflow
- Status transitions are traceable and role-restricted
- Clinical safety warnings are displayed before final sign

---

## 4) Clinical Documentation
Priority: must-have  
Complexity: medium

### Objective
Support structured and narrative documentation for nursing and physician workflows, including care plans and handoffs.

### Primary Users
- Nurses
- Physicians
- Therapists/Allied staff

### Key Workflows
1. Progress notes
- Create shift/rounding notes with timestamps.
- Tag notes to encounter/problem.

2. Nursing documentation
- Flowsheets for vitals, intake/output, assessments.
- Shift handoff checklist and unresolved tasks.

3. Care plan updates
- Define goals/interventions/outcomes.
- Mark goals active/resolved.

### Data Requirements
- Note metadata: author, role, encounter, note type, timestamp
- Structured sections: assessment, plan, interventions
- Attachments/references as needed

### Functional Rules
- Template support per note type
- Save draft and finalize/sign capabilities
- Addendum workflow without destructive overwrite

### Permissions & Security
- Author can edit draft
- Signed notes become append-only with addendum path
- Access logging for sensitive patient records

### API/Action Surface
- `createNoteDraft`
- `signNote`
- `addNoteAddendum`
- `updateCarePlan`
- `getDocumentationTimeline`

### Acceptance Criteria
- Clinician can document and sign within encounter context
- Signed notes remain immutable except addenda
- Timeline shows complete documentation history

---

## 5) Revenue Cycle Management
Priority: must-have  
Complexity: high

### Objective
Enable end-to-end hospital billing lifecycle from charge capture to claim submission and payment posting.

### Primary Users
- Billing specialists
- Revenue cycle manager
- Finance/CFO
- Admin

### Key Workflows
1. Charge capture
- Generate charges from encounters/orders/procedures.
- Validate coding completeness.

2. Claim creation and submission
- Build claim package with demographics, coverage, diagnosis/procedure coding.
- Validate and submit to payer/clearinghouse.

3. Adjudication and payment posting
- Record remittance status (paid/denied/partial).
- Post payments and contractual adjustments.
- Queue denials for rework and resubmission.

### Data Requirements
- Accounts/guarantor balances
- Charges and line items
- Claim status history
- Payments, adjustments, write-offs
- Denial reasons and rework tasks

### Functional Rules
- Claims require mandatory coding/eligibility checks
- Aging buckets for A/R follow-up
- Denial workflow with owner and SLA

### Permissions & Security
- Billing roles can edit financial artifacts
- Clinical users read-only or no access to financial modules
- Audit logs for claim edits and payment posting

### API/Action Surface
- `createChargeBatch`
- `generateClaim`
- `submitClaim`
- `postPayment`
- `recordDenial`
- `resubmitClaim`

### Acceptance Criteria
- Claim can be generated from completed clinical activity
- Denied claim enters tracked rework queue
- Payment posting updates account balances accurately

---

## Cross-Feature Non-Functional Requirements
- HIPAA-aligned access controls and audit logging across all five features
- High availability for 24/7 hospital operations
- Role-based least privilege by default
- Consistent user experience across dashboard, patients, and beds workflows
- Reliable error states and recoverable workflows for transient failures

## Suggested Phased Delivery (for MVP)
1. Patient Registration & Demographics
2. Clinical Documentation (basic notes + timeline)
3. EHR summary shell (problems/allergies/meds/vitals)
4. Physician Order Entry (core order types)
5. Revenue Cycle Management (charge + claim basics)
