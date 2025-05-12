export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      appointments: {
        Row: {
          id: string
          created_at: string
          patient_id: string
          doctor_id: string
          hospital_id: string
          department_id: string
          date: string
          start_time: string
          end_time: string
          status: string
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          patient_id: string
          doctor_id: string
          hospital_id: string
          department_id: string
          date: string
          start_time: string
          end_time: string
          status?: string
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          patient_id?: string
          doctor_id?: string
          hospital_id?: string
          department_id?: string
          date?: string
          start_time?: string
          end_time?: string
          status?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_doctor_id_fkey"
            columns: ["doctor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_hospital_id_fkey"
            columns: ["hospital_id"]
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_department_id_fkey"
            columns: ["department_id"]
            referencedRelation: "departments"
            referencedColumns: ["id"]
          }
        ]
      }
      billing: {
        Row: {
          id: string
          created_at: string
          patient_id: string
          hospital_id: string
          consultation_id: string | null
          services: Json[]
          total_amount: number
          paid_amount: number
          payment_status: string
          insurance_info: Json | null
          payment_date: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          patient_id: string
          hospital_id: string
          consultation_id?: string | null
          services: Json[]
          total_amount: number
          paid_amount?: number
          payment_status?: string
          insurance_info?: Json | null
          payment_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          patient_id?: string
          hospital_id?: string
          consultation_id?: string | null
          services?: Json[]
          total_amount?: number
          paid_amount?: number
          payment_status?: string
          insurance_info?: Json | null
          payment_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "billing_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_hospital_id_fkey"
            columns: ["hospital_id"]
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billing_consultation_id_fkey"
            columns: ["consultation_id"]
            referencedRelation: "consultations"
            referencedColumns: ["id"]
          }
        ]
      }
      consultations: {
        Row: {
          id: string
          created_at: string
          patient_id: string
          doctor_id: string
          hospital_id: string
          consultation_date: string
          chief_complaint: string
          diagnosis: string | null
          treatment_plan: string | null
          prescriptions: Json[] | null
          notes: string | null
          medical_certificate: boolean
          department_id: string
        }
        Insert: {
          id?: string
          created_at?: string
          patient_id: string
          doctor_id: string
          hospital_id: string
          consultation_date?: string
          chief_complaint: string
          diagnosis?: string | null
          treatment_plan?: string | null
          prescriptions?: Json[] | null
          notes?: string | null
          medical_certificate?: boolean
          department_id: string
        }
        Update: {
          id?: string
          created_at?: string
          patient_id?: string
          doctor_id?: string
          hospital_id?: string
          consultation_date?: string
          chief_complaint?: string
          diagnosis?: string | null
          treatment_plan?: string | null
          prescriptions?: Json[] | null
          notes?: string | null
          medical_certificate?: boolean
          department_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "consultations_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_doctor_id_fkey"
            columns: ["doctor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_hospital_id_fkey"
            columns: ["hospital_id"]
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "consultations_department_id_fkey"
            columns: ["department_id"]
            referencedRelation: "departments"
            referencedColumns: ["id"]
          }
        ]
      }
      departments: {
        Row: {
          id: string
          created_at: string
          name: string
          hospital_id: string
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          hospital_id: string
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          hospital_id?: string
          description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "departments_hospital_id_fkey"
            columns: ["hospital_id"]
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          }
        ]
      }
      hospitals: {
        Row: {
          id: string
          created_at: string
          name: string
          subdomain: string
          address: string
          phone: string
          email: string | null
          logo_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          name: string
          subdomain: string
          address: string
          phone: string
          email?: string | null
          logo_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          name?: string
          subdomain?: string
          address?: string
          phone?: string
          email?: string | null
          logo_url?: string | null
        }
        Relationships: []
      }
      inpatients: {
        Row: {
          id: string
          created_at: string
          patient_id: string
          hospital_id: string
          admission_date: string
          discharge_date: string | null
          ward_id: string
          bed_number: string
          attending_doctor_id: string
          status: string
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          patient_id: string
          hospital_id: string
          admission_date?: string
          discharge_date?: string | null
          ward_id: string
          bed_number: string
          attending_doctor_id: string
          status?: string
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          patient_id?: string
          hospital_id?: string
          admission_date?: string
          discharge_date?: string | null
          ward_id?: string
          bed_number?: string
          attending_doctor_id?: string
          status?: string
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inpatients_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inpatients_hospital_id_fkey"
            columns: ["hospital_id"]
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inpatients_attending_doctor_id_fkey"
            columns: ["attending_doctor_id"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      lab_results: {
        Row: {
          id: string
          created_at: string
          patient_id: string
          hospital_id: string
          test_type: string
          test_date: string
          results: Json | null
          status: string
          reviewed_by: string | null
          reviewed_at: string | null
          notes: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          patient_id: string
          hospital_id: string
          test_type: string
          test_date?: string
          results?: Json | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          notes?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          patient_id?: string
          hospital_id?: string
          test_type?: string
          test_date?: string
          results?: Json | null
          status?: string
          reviewed_by?: string | null
          reviewed_at?: string | null
          notes?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lab_results_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_hospital_id_fkey"
            columns: ["hospital_id"]
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "lab_results_reviewed_by_fkey"
            columns: ["reviewed_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      patients: {
        Row: {
          id: string
          created_at: string
          first_name: string
          last_name: string
          date_of_birth: string
          gender: string
          contact_number: string
          email: string | null
          address: string
          emergency_contact: Json
          medical_history: Json | null
          hospital_id: string
          status: string
          current_flow_step: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          first_name: string
          last_name: string
          date_of_birth: string
          gender: string
          contact_number: string
          email?: string | null
          address: string
          emergency_contact: Json
          medical_history?: Json | null
          hospital_id: string
          status?: string
          current_flow_step?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          first_name?: string
          last_name?: string
          date_of_birth?: string
          gender?: string
          contact_number?: string
          email?: string | null
          address?: string
          emergency_contact?: Json
          medical_history?: Json | null
          hospital_id?: string
          status?: string
          current_flow_step?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "patients_hospital_id_fkey"
            columns: ["hospital_id"]
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          }
        ]
      }
      pharmacy: {
        Row: {
          id: string
          created_at: string
          patient_id: string
          hospital_id: string
          prescription_id: string | null
          medications: Json[]
          status: string
          dispensed_by: string | null
          dispensed_at: string | null
          payment_status: string
        }
        Insert: {
          id?: string
          created_at?: string
          patient_id: string
          hospital_id: string
          prescription_id?: string | null
          medications: Json[]
          status?: string
          dispensed_by?: string | null
          dispensed_at?: string | null
          payment_status?: string
        }
        Update: {
          id?: string
          created_at?: string
          patient_id?: string
          hospital_id?: string
          prescription_id?: string | null
          medications?: Json[]
          status?: string
          dispensed_by?: string | null
          dispensed_at?: string | null
          payment_status?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharmacy_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_hospital_id_fkey"
            columns: ["hospital_id"]
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pharmacy_dispensed_by_fkey"
            columns: ["dispensed_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          first_name: string
          last_name: string
          role: string
          hospital_id: string | null
          email: string
          avatar_url: string | null
          department_id: string | null
          specialization: string | null
          contact_number: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          first_name: string
          last_name: string
          role: string
          hospital_id?: string | null
          email: string
          avatar_url?: string | null
          department_id?: string | null
          specialization?: string | null
          contact_number?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          first_name?: string
          last_name?: string
          role?: string
          hospital_id?: string | null
          email?: string
          avatar_url?: string | null
          department_id?: string | null
          specialization?: string | null
          contact_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_hospital_id_fkey"
            columns: ["hospital_id"]
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_department_id_fkey"
            columns: ["department_id"]
            referencedRelation: "departments"
            referencedColumns: ["id"]
          }
        ]
      }
      triage: {
        Row: {
          id: string
          created_at: string
          patient_id: string
          hospital_id: string
          vital_signs: Json
          chief_complaint: string
          acuity_level: number
          notes: string | null
          triaged_by: string
          department_id: string | null
          is_emergency: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          patient_id: string
          hospital_id: string
          vital_signs: Json
          chief_complaint: string
          acuity_level: number
          notes?: string | null
          triaged_by: string
          department_id?: string | null
          is_emergency?: boolean
        }
        Update: {
          id?: string
          created_at?: string
          patient_id?: string
          hospital_id?: string
          vital_signs?: Json
          chief_complaint?: string
          acuity_level?: number
          notes?: string | null
          triaged_by?: string
          department_id?: string | null
          is_emergency?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "triage_patient_id_fkey"
            columns: ["patient_id"]
            referencedRelation: "patients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triage_hospital_id_fkey"
            columns: ["hospital_id"]
            referencedRelation: "hospitals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triage_triaged_by_fkey"
            columns: ["triaged_by"]
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "triage_department_id_fkey"
            columns: ["department_id"]
            referencedRelation: "departments"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}