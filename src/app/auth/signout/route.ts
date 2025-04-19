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
    if (session.user.email) {
      // 사용자 역할 정보 조회
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()

    await logAudit('logout', {
        user_email: session.user.email,
        role: userData?.role
    })
    }
    await supabase.auth.signOut()
  }

  return NextResponse.redirect(new URL('/auth/login', request.url), {
    status: 302,
  })
} 