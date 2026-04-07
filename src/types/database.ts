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
      patients: {
        Row: {
          id: string
          name: string
          room_number: string
          base_risk_score: number
          current_risk_score: number
          status: 'stable' | 'monitoring' | 'critical'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          room_number: string
          base_risk_score?: number
          current_risk_score?: number
          status: 'stable' | 'monitoring' | 'critical'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          room_number?: string
          base_risk_score?: number
          current_risk_score?: number
          status?: 'stable' | 'monitoring' | 'critical'
          created_at?: string
          updated_at?: string
        }
      }
      shift_notes: {
        Row: {
          id: string
          patient_id: string
          timestamp: string
          raw_text: string
          ai_processed: boolean
          created_at: string
        }
        Insert: {
          id?: string
          patient_id: string
          timestamp?: string
          raw_text: string
          ai_processed?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          patient_id?: string
          timestamp?: string
          raw_text?: string
          ai_processed?: boolean
          created_at?: string
        }
      }
      standardized_assessments: {
        Row: {
          id: string
          note_id: string
          cognitive_flag: boolean
          appetite_flag: boolean
          mobility_flag: boolean
          calculated_risk_delta: number
          standardized_summary: string
          created_at: string
        }
        Insert: {
          id?: string
          note_id: string
          cognitive_flag?: boolean
          appetite_flag?: boolean
          mobility_flag?: boolean
          calculated_risk_delta?: number
          standardized_summary: string
          created_at?: string
        }
        Update: {
          id?: string
          note_id?: string
          cognitive_flag?: boolean
          appetite_flag?: boolean
          mobility_flag?: boolean
          calculated_risk_delta?: number
          standardized_summary?: string
          created_at?: string
        }
      }
    }
  }
}
