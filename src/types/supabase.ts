export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

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
          event_type: "registration_created" | "bed_assigned" | "bed_transferred" | "bed_discharged";
          patient_id: string | null;
          assignment_id: string | null;
          actor_user_id: string;
          payload: Json | null;
          occurred_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          event_type: "registration_created" | "bed_assigned" | "bed_transferred" | "bed_discharged";
          patient_id?: string | null;
          assignment_id?: string | null;
          actor_user_id: string;
          payload?: Json | null;
          occurred_at?: string;
        };
        Update: {
          id?: string;
          organization_id?: string;
          event_type?: "registration_created" | "bed_assigned" | "bed_transferred" | "bed_discharged";
          patient_id?: string | null;
          assignment_id?: string | null;
          actor_user_id?: string;
          payload?: Json | null;
          occurred_at?: string;
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
