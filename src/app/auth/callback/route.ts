import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

/**
 * 소셜 로그인 콜백 핸들러
 * 로그인 후 사용자를 메인 페이지로 리다이렉트합니다.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  // 코드가 없으면 로그인 페이지로
  if (!code) {
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_code`)
  }

  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookies() })
    
    // 인증 코드로 세션 교환
    const { error: signInError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (signInError) {
      console.error('Auth error:', signInError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_error`)
    }

    // 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError || !session) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=session_error`)
    }

    // 사용자 데이터 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_active')
      .eq('id', session.user.id)
      .single()

    if (userError || !userData) {
      console.error('User data error:', userError)
      await supabase.auth.signOut()
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=user_data`)
    }

    if (!userData.is_active) {
      await supabase.auth.signOut()
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=inactive`)
    }

    // 성공시 홈페이지로 리다이렉션
    const response = NextResponse.redirect(`${requestUrl.origin}/`)
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    return response

  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=unknown`)
  }
} 