import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

export type AuditAction = 'create' | 'update' | 'delete' | 'bulk_delete' | 'export' | 'login' | 'logout'

interface AuditDetails {
  code: string;
  institution_name?: string | null;
  agency?: string | null;
  changes?: any;
}

export async function logAudit(action: AuditAction, details: AuditDetails) {
  const supabase = createClientComponentClient()
  
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  try {
    await supabase.from('auth_codes_audit_log').insert({
      user_id: session.user.id,
      user_email: session.user.email,
      action,
      details,
      created_at: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error logging audit:', error)
  }
} 