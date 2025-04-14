import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export type AuditAction = 'create' | 'update' | 'delete' | 'bulk_delete'

export async function logAudit(action: AuditAction, details: any) {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return

  await supabase.from('auth_codes_audit_log').insert({
    user_id: session.user.id,
    user_email: session.user.email,
    action,
    details,
    created_at: new Date().toISOString()
  })
} 