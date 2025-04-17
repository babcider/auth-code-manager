export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      auth_codes: {
        Row: {
          id: string
          key: string
          setup_key: string | null
          unity_key: string | null
          institution_name: string | null
          agency: string | null
          memo: string | null
          program_update: string | null
          is_active: boolean
          is_unlimit: boolean
          expire_time: string | null
          local_max_count: number | null
          available_apps: string | null
          available_contents: string | null
          create_time: string
          start_time: string | null
          last_check_time: string | null
          last_check_ip: string | null
          run_count: number | null
        }
        Insert: {
          id?: string
          key: string
          setup_key?: string | null
          unity_key?: string | null
          institution_name?: string | null
          agency?: string | null
          memo?: string | null
          program_update?: string | null
          is_active?: boolean
          is_unlimit?: boolean
          expire_time?: string | null
          local_max_count?: number | null
          available_apps?: string | null
          available_contents?: string | null
          create_time?: string
          start_time?: string | null
          last_check_time?: string | null
          last_check_ip?: string | null
          run_count?: number | null
        }
        Update: {
          id?: string
          key?: string
          setup_key?: string | null
          unity_key?: string | null
          institution_name?: string | null
          agency?: string | null
          memo?: string | null
          program_update?: string | null
          is_active?: boolean
          is_unlimit?: boolean
          expire_time?: string | null
          local_max_count?: number | null
          available_apps?: string | null
          available_contents?: string | null
          create_time?: string
          start_time?: string | null
          last_check_time?: string | null
          last_check_ip?: string | null
          run_count?: number | null
        }
      }
      auth_code_contents: {
        Row: {
          id: string
          auth_code_id: string | null
          content_id: number | null
          created_at: string | null
        }
        Insert: {
          id?: string
          auth_code_id?: string | null
          content_id?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          auth_code_id?: string | null
          content_id?: number | null
          created_at?: string | null
        }
      }
      insol_contents: {
        Row: {
          id: number
          name: string
          app_type: string | null
          scene_name: string | null
          custom: string | null
        }
        Insert: {
          id: number
          name: string
          app_type?: string | null
          scene_name?: string | null
          custom?: string | null
        }
        Update: {
          id?: number
          name?: string
          app_type?: string | null
          scene_name?: string | null
          custom?: string | null
        }
      }
      users: {
        Row: {
          id: string
          email: string
          role: string
          is_active: boolean
          created_at: string
          updated_at: string
          provider: string | null
        }
        Insert: {
          id: string
          email: string
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          provider?: string | null
        }
        Update: {
          id?: string
          email?: string
          role?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
          provider?: string | null
        }
      }
    }
    Views: {
      auth_code_content_details: {
        Row: {
          id: string
          key: string
          setup_key: string | null
          unity_key: string | null
          institution_name: string | null
          agency: string | null
          memo: string | null
          program_update: string | null
          is_active: boolean
          is_unlimit: boolean
          expire_time: string | null
          local_max_count: number | null
          available_apps: string | null
          available_contents: string | null
          create_time: string
          start_time: string | null
          last_check_time: string | null
          last_check_ip: string | null
          run_count: number | null
          content_names: string[]
          app_types: string[]
          created_by: string
        }
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 