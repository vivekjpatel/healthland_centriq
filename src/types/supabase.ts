export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

type AuditEventType =
  | "registration_created"
  | "bed_assigned"
  | "bed_transferred"
  | "bed_discharged"
  | "encounter_created"
  | "problem_added"
  | "allergy_added"
  | "vitals_recorded"
  | "note_created"
  | "note_signed"
  | "order_created"
  | "order_updated"
  | "charge_created"
  | "claim_created"
  | "payment_posted";

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          npi: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          npi?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          npi?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      user_profiles: {
        Row: {
          user_id: string;
          organization_id: string;
          role: "admin" | "registrar" | "nurse" | "physician" | "billing" | "auditor";
          created_at: string;
        };
        Insert: {
          user_id: string;
          organization_id: string;
          role: "admin" | "registrar" | "nurse" | "physician" | "billing" | "auditor";
          created_at?: string;
        };
        Update: {
          user_id?: string;
          organization_id?: string;
          role?: "admin" | "registrar" | "nurse" | "physician" | "billing" | "auditor";
          created_at?: string;
        };
        Relationships: [];
      };
      patients: {
        Row: {
          id: string;
          organization_id: string;
          mrn: string;
          first_name: string;
          last_name: string;
          dob: string;
          sex_at_birth: string | null;
          phone: string | null;
          address: Json | null;
          insurance: Json | null;
          created_by: string;
          created_at: string;
          deleted_at: string | null;
          deleted_by: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          mrn: string;
          first_name: string;
          last_name: string;
          dob: string;
          sex_at_birth?: string | null;
          phone?: string | null;
          address?: Json | null;
          insurance?: Json | null;
          created_by: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          mrn?: string;
          first_name?: string;
          last_name?: string;
          dob?: string;
          sex_at_birth?: string | null;
          phone?: string | null;
          address?: Json | null;
          insurance?: Json | null;
          created_by?: string;
          created_at?: string;
          deleted_at?: string | null;
          deleted_by?: string | null;
        };
        Relationships: [];
      };
      beds: {
        Row: {
          id: string;
          organization_id: string;
          unit: string;
          room: string;
          bed_label: string;
          status: "available" | "occupied" | "cleaning" | "maintenance" | "reserved";
          acuity_level: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          unit: string;
          room: string;
          bed_label: string;
          status: "available" | "occupied" | "cleaning" | "maintenance" | "reserved";
          acuity_level?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          unit?: string;
          room?: string;
          bed_label?: string;
          status?: "available" | "occupied" | "cleaning" | "maintenance" | "reserved";
          acuity_level?: string | null;
        };
        Relationships: [];
      };
      bed_assignments: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          bed_id: string;
          assigned_at: string;
          discharged_at: string | null;
          assigned_by: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          bed_id: string;
          assigned_at?: string;
          discharged_at?: string | null;
          assigned_by: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          bed_id?: string;
          assigned_at?: string;
          discharged_at?: string | null;
          assigned_by?: string;
        };
        Relationships: [];
      };
      audit_events: {
        Row: {
          id: string;
          organization_id: string;
          event_type: AuditEventType;
          patient_id: string | null;
          assignment_id: string | null;
          actor_user_id: string;
          payload: Json | null;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          event_type: AuditEventType;
          patient_id?: string | null;
          assignment_id?: string | null;
          actor_user_id: string;
          payload?: Json | null;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          event_type?: AuditEventType;
          patient_id?: string | null;
          assignment_id?: string | null;
          actor_user_id?: string;
          payload?: Json | null;
          occurred_at?: string;
        };
        Relationships: [];
      };
      encounters: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_type: "inpatient" | "outpatient" | "ed" | "telehealth";
          status: "open" | "closed" | "canceled";
          admitted_at: string;
          discharged_at: string | null;
          attending_physician: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_type: "inpatient" | "outpatient" | "ed" | "telehealth";
          status?: "open" | "closed" | "canceled";
          admitted_at?: string;
          discharged_at?: string | null;
          attending_physician?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          encounter_type?: "inpatient" | "outpatient" | "ed" | "telehealth";
          status?: "open" | "closed" | "canceled";
          admitted_at?: string;
          discharged_at?: string | null;
          attending_physician?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      patient_problems: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          icd_code: string | null;
          description: string;
          status: "active" | "resolved";
          onset_date: string | null;
          resolved_date: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          icd_code?: string | null;
          description: string;
          status?: "active" | "resolved";
          onset_date?: string | null;
          resolved_date?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          encounter_id?: string | null;
          icd_code?: string | null;
          description?: string;
          status?: "active" | "resolved";
          onset_date?: string | null;
          resolved_date?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      patient_allergies: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          allergen: string;
          reaction: string | null;
          severity: "mild" | "moderate" | "severe" | null;
          status: "active" | "inactive";
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          allergen: string;
          reaction?: string | null;
          severity?: "mild" | "moderate" | "severe" | null;
          status?: "active" | "inactive";
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          allergen?: string;
          reaction?: string | null;
          severity?: "mild" | "moderate" | "severe" | null;
          status?: "active" | "inactive";
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      patient_medications: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          medication_name: string;
          dose: string | null;
          route: string | null;
          frequency: string | null;
          status: "active" | "stopped";
          started_at: string;
          stopped_at: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          medication_name: string;
          dose?: string | null;
          route?: string | null;
          frequency?: string | null;
          status?: "active" | "stopped";
          started_at?: string;
          stopped_at?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          encounter_id?: string | null;
          medication_name?: string;
          dose?: string | null;
          route?: string | null;
          frequency?: string | null;
          status?: "active" | "stopped";
          started_at?: string;
          stopped_at?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      patient_vitals: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          vital_type: string;
          value: string;
          unit: string | null;
          recorded_at: string;
          recorded_by: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          vital_type: string;
          value: string;
          unit?: string | null;
          recorded_at?: string;
          recorded_by: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          encounter_id?: string | null;
          vital_type?: string;
          value?: string;
          unit?: string | null;
          recorded_at?: string;
          recorded_by?: string;
        };
        Relationships: [];
      };
      care_plans: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          title: string;
          goal: string | null;
          intervention: string | null;
          outcome: string | null;
          status: "active" | "resolved";
          updated_by: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          title: string;
          goal?: string | null;
          intervention?: string | null;
          outcome?: string | null;
          status?: "active" | "resolved";
          updated_by: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          title?: string;
          goal?: string | null;
          intervention?: string | null;
          outcome?: string | null;
          status?: "active" | "resolved";
          updated_by?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      clinical_notes: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          note_type: "progress" | "nursing" | "physician" | "discharge" | "care_plan";
          status: "draft" | "signed" | "addendum";
          parent_note_id: string | null;
          content: string;
          authored_by: string;
          authored_at: string;
          signed_at: string | null;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          note_type: "progress" | "nursing" | "physician" | "discharge" | "care_plan";
          status?: "draft" | "signed" | "addendum";
          parent_note_id?: string | null;
          content: string;
          authored_by: string;
          authored_at?: string;
          signed_at?: string | null;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          encounter_id?: string | null;
          note_type?: "progress" | "nursing" | "physician" | "discharge" | "care_plan";
          status?: "draft" | "signed" | "addendum";
          parent_note_id?: string | null;
          content?: string;
          authored_by?: string;
          authored_at?: string;
          signed_at?: string | null;
        };
        Relationships: [];
      };
      physician_orders: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          order_type: "medication" | "lab" | "imaging" | "procedure" | "treatment";
          priority: "routine" | "urgent" | "stat";
          status: "draft" | "signed" | "acknowledged" | "in_progress" | "completed" | "canceled";
          indication: string | null;
          instructions: string | null;
          details: Json | null;
          ordered_by: string;
          signed_by: string | null;
          acknowledged_by: string | null;
          completed_by: string | null;
          canceled_by: string | null;
          cancellation_reason: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          order_type: "medication" | "lab" | "imaging" | "procedure" | "treatment";
          priority?: "routine" | "urgent" | "stat";
          status?: "draft" | "signed" | "acknowledged" | "in_progress" | "completed" | "canceled";
          indication?: string | null;
          instructions?: string | null;
          details?: Json | null;
          ordered_by: string;
          signed_by?: string | null;
          acknowledged_by?: string | null;
          completed_by?: string | null;
          canceled_by?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          encounter_id?: string | null;
          order_type?: "medication" | "lab" | "imaging" | "procedure" | "treatment";
          priority?: "routine" | "urgent" | "stat";
          status?: "draft" | "signed" | "acknowledged" | "in_progress" | "completed" | "canceled";
          indication?: string | null;
          instructions?: string | null;
          details?: Json | null;
          ordered_by?: string;
          signed_by?: string | null;
          acknowledged_by?: string | null;
          completed_by?: string | null;
          canceled_by?: string | null;
          cancellation_reason?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      charges: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          encounter_id: string | null;
          order_id: string | null;
          cpt_code: string | null;
          description: string;
          units: number;
          unit_amount: number;
          total_amount: number;
          status: "open" | "billed" | "void";
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          encounter_id?: string | null;
          order_id?: string | null;
          cpt_code?: string | null;
          description: string;
          units?: number;
          unit_amount: number;
          total_amount: number;
          status?: "open" | "billed" | "void";
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          encounter_id?: string | null;
          order_id?: string | null;
          cpt_code?: string | null;
          description?: string;
          units?: number;
          unit_amount?: number;
          total_amount?: number;
          status?: "open" | "billed" | "void";
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      claims: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          charge_id: string;
          payer: string;
          claim_number: string | null;
          status: "draft" | "submitted" | "paid" | "denied" | "partial";
          denial_reason: string | null;
          submitted_at: string | null;
          adjudicated_at: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          charge_id: string;
          payer: string;
          claim_number?: string | null;
          status?: "draft" | "submitted" | "paid" | "denied" | "partial";
          denial_reason?: string | null;
          submitted_at?: string | null;
          adjudicated_at?: string | null;
          created_by: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          charge_id?: string;
          payer?: string;
          claim_number?: string | null;
          status?: "draft" | "submitted" | "paid" | "denied" | "partial";
          denial_reason?: string | null;
          submitted_at?: string | null;
          adjudicated_at?: string | null;
          created_by?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      payments: {
        Row: {
          id: string;
          organization_id: string;
          patient_id: string;
          claim_id: string;
          amount: number;
          payment_method: string | null;
          reference_number: string | null;
          posted_by: string;
          posted_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          patient_id: string;
          claim_id: string;
          amount: number;
          payment_method?: string | null;
          reference_number?: string | null;
          posted_by: string;
          posted_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          patient_id?: string;
          claim_id?: string;
          amount?: number;
          payment_method?: string | null;
          reference_number?: string | null;
          posted_by?: string;
          posted_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      perform_adt_action: {
        Args: {
          p_action: "assign" | "transfer" | "discharge";
          p_org_id: string;
          p_patient_id: string;
          p_bed_id: string;
          p_actor_id: string;
          p_target_bed_id?: string | null;
        };
        Returns: Json;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
