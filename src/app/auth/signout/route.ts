import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { logAudit } from '@/lib/audit'

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient({ cookies })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  if (session) {
    await logAudit('logout', {
      user_email: session.user.email
    })
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL('/auth/login', request.url), {
    status: 302,
  })
} 