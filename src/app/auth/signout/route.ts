import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })
  
  try {
    await supabase.auth.signOut()
    return NextResponse.redirect(new URL('/auth/login', 'https://auth-code-manager-one.vercel.app'))
  } catch (error) {
    console.error('Error signing out:', error)
    return NextResponse.redirect(
      new URL('/auth/login?error=로그아웃 중 오류가 발생했습니다', 'https://auth-code-manager-one.vercel.app')
    )
  }
} 