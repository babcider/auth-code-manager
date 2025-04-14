import { createServerActionClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export async function POST() {
  try {
    const supabase = createServerActionClient({ cookies })
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: {
        redirectTo: 'https://auth-code-manager-one.vercel.app/auth/callback'
      }
    })

    if (error) {
      return NextResponse.redirect(
        'https://auth-code-manager-one.vercel.app/auth/login?error=' + error.message,
        { status: 301 }
      )
    }

    return NextResponse.redirect(data.url, { status: 301 })
  } catch (error) {
    return NextResponse.redirect(
      'https://auth-code-manager-one.vercel.app/auth/login?error=알 수 없는 오류가 발생했습니다',
      { status: 301 }
    )
  }
} 