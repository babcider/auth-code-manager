import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

async function handleSignOut() {
  try {
    const supabase = createServerActionClient({ cookies })
    await supabase.auth.signOut()
    
    return NextResponse.redirect(
      'https://auth-code-manager-one.vercel.app/auth/login',
      { status: 301 }
    )
  } catch (error) {
    return NextResponse.redirect(
      'https://auth-code-manager-one.vercel.app/auth/login?error=로그아웃 중 오류가 발생했습니다',
      { status: 301 }
    )
  }
}

export const GET = handleSignOut
export const POST = handleSignOut 