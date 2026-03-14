# Use Case Flow: Patient Intake to Bed Assignment and Clinical Handoff

## Use Case ID
UC-01

## Goal
Register a new patient, assign a bed, and hand off to clinical workbench for immediate care.

## Primary Actors
- Registrar
- Nurse

## Supporting Actors
- Admin (fallback for registrar/nurse actions)

## Related Implemented Screens
- `/patients` (intake, patient list, edit/archive)
- `/beds` (bed assignment, transfer, discharge)
- `/patients/[patientId]` (clinical workbench)
- `/dashboard` (operational counters)

## Preconditions
- User is authenticated.
- User has a `user_profiles` row with valid `organization_id`.
- At least one bed exists in same organization with status `available` or `reserved`.
- Patient MRN is unique within organization.

## Trigger
Front desk receives a new patient and starts intake.

## Main Success Flow
1. Registrar opens `/patients`.
2. Registrar clicks **Intake Patient** and submits patient demographics + insurance.
3. System validates input (`patientCreateSchema`) and runs `createPatientAction`.
4. System creates patient record in `public.patients` and logs audit event `registration_created`.
5. System revalidates `/patients`, `/beds`, and `/dashboard`.
6. Nurse opens `/beds`.
7. Nurse selects the newly created unassigned patient and an available bed, then submits assign action.
8. System validates input (`assignBedSchema`) and executes `assignBedAction` -> `perform_adt_action('assign', ...)`.
9. System marks bed as `occupied`, creates active row in `public.bed_assignments`, logs `bed_assigned` audit event.
10. System revalidates `/beds`, `/patients`, and `/dashboard`.
11. Nurse clicks patient view and opens `/patients/[patientId]`.
12. Nurse/physician starts documentation in tabs (encounter, vitals, notes, orders).

## Alternate / Exception Flows

### A1: Duplicate MRN during intake
1. At step 3, MRN uniqueness check fails.
2. System returns error: `Duplicate MRN for this organization.`
3. Patient is not created; user corrects MRN and resubmits.

### A2: No available bed
1. At step 7, no bed is available/reserved.
2. Bed assignment fails with availability error from ADT function.
3. Patient remains in waiting state on `/patients` and appears as unassigned on `/beds`.

### A3: Unauthorized bed operation
1. A non-allowed role attempts assignment/transfer/discharge.
2. ADT function rejects with authorization error (`admin|nurse|registrar` only).
3. No state change occurs.

### A4: Patient archived before assignment
1. User archives patient from `/patients` (soft delete).
2. System sets `patients.deleted_at` and excludes patient from active lists.
3. Patient no longer appears in `/patients` and unassigned candidate list on `/beds`.

## Postconditions (Success)
- Patient exists in `public.patients` with active status (`deleted_at is null`).
- Active bed assignment exists in `public.bed_assignments` (`discharged_at is null`).
- Selected bed status is `occupied`.
- Audit trail contains `registration_created` and `bed_assigned` events.

## Data Objects Touched
- `public.patients`
- `public.beds`
- `public.bed_assignments`
- `public.audit_events`
- `public.user_profiles` (org + role context)

## Business Rules Enforced
- Org scoping for all read/write actions.
- One active assignment per bed and per patient in ADT flow.
- Soft-deleted patients are hidden from active operational views.
- Bed operations allowed only for `admin`, `nurse`, `registrar` (as implemented in ADT authorization).

## KPI Signals from This Flow
- Intake turnaround time (open modal -> patient created)
- Time-to-bed-assignment
- Waiting patient count
- Bed occupancy rate

## Implementation References
- `src/actions/registration.ts`
- `src/actions/bed-management.ts`
- `src/actions/patients.ts`
- `src/lib/phase1/service.ts`
- `src/app/(dashboard)/patients/page.tsx`
- `src/app/(dashboard)/beds/page.tsx`
- `src/app/(dashboard)/patients/[patientId]/page.tsx`
