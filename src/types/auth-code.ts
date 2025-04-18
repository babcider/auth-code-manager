import { Database } from './supabase'

export type Tables = Database['public']['Tables']
export type Views = Database['public']['Views']

export interface AuthCode {
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

export interface AuthCodeView extends AuthCode {
  content: {
    id: string;
    code_id: string;
    content: string;
    created_at: string;
    updated_at?: string;
  }[];
  status?: string;
  created_at?: string;
  updated_at?: string;
  created_by?: string;
  updated_by?: string;
  is_used?: boolean;
  content_names?: string[];
  app_types?: string[];
  contents?: any[];
  key: string;
  expires_at?: string;
  user_email?: string;
}

export interface AuthCodeContent {
  id: string
  auth_code_id?: string
  content_id?: number
  created_at: string
  updated_at?: string
}

export interface AuthCodeListProps {
  codes: AuthCode[]
  onEdit: (code: AuthCode) => void
  onDelete: (id: string) => void
}

export interface EditCodeModalProps {
  isOpen: boolean
  onClose: () => void
  onUpdate: (id: string, options: Partial<CodeGenerationOptions>) => Promise<void>
  code: AuthCodeView | null
}

export interface CodeGenerationOptions {
  key: string;
  setup_key?: string | null;
  unity_key?: string | null;
  institution_name?: string | null;
  agency?: string | null;
  memo?: string | null;
  program_update?: string | null;
  is_active: boolean;
  is_unlimit: boolean;
  expire_time?: string | null;
  local_max_count?: number | null;
  available_apps?: string | null;
  available_contents?: string | null;
  content_ids?: number[];
}

export const defaultGenerationOptions: Partial<CodeGenerationOptions> = {
  is_active: true,
  is_unlimit: false,
}