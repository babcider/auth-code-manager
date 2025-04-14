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
      auth_codes: {
        Row: {
          id: string
          code: string
          expires_at: string | null
          is_used: boolean | null
          created_at: string | null
          user_id: string | null
          context: string | null
        }
        Insert: {
          id?: string
          code: string
          expires_at?: string | null
          is_used?: boolean | null
          created_at?: string | null
          user_id?: string | null
          context?: string | null
        }
        Update: {
          id?: string
          code?: string
          expires_at?: string | null
          is_used?: boolean | null
          created_at?: string | null
          user_id?: string | null
          context?: string | null
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 