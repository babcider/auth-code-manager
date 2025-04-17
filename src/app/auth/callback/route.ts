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
    console.error('No code provided in callback')
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_code`)
  }

  try {
    const supabase = createRouteHandlerClient({ cookies: () => cookies() })
    
    // 인증 코드로 세션 교환
    const { error: signInError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (signInError) {
      console.error('Auth exchange error:', signInError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=auth_error`)
    }

    // 세션 확인
    const { data: { session }, error: sessionError } = await supabase.auth.getSession()
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=session_error`)
    }

    if (!session) {
      console.error('No session after successful auth exchange')
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_session`)
    }

    // 사용자 데이터 확인
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('is_active, email')
      .eq('id', session.user.id)
      .single()

    if (userError) {
      console.error('User data error:', userError)
      await supabase.auth.signOut()
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=user_data`)
    }

    if (!userData) {
      console.error('No user data found for ID:', session.user.id)
      // 사용자 데이터가 없으면 자동으로 생성
      const { error: createError } = await supabase
        .from('users')
        .insert([
          { 
            id: session.user.id,
            email: session.user.email,
            is_active: false
          }
        ])

      if (createError) {
        console.error('User creation error:', createError)
        await supabase.auth.signOut()
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=user_creation`)
      }

      return NextResponse.redirect(`${requestUrl.origin}/auth/login?message=approval_required`)
    }

    if (!userData.is_active) {
      console.log('User not active:', session.user.email)
      await supabase.auth.signOut()
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=inactive`)
    }

    // 성공시 홈페이지로 리다이렉션
    const response = NextResponse.redirect(`${requestUrl.origin}/`)
    response.headers.set('Cache-Control', 'no-store, max-age=0')
    return response

  } catch (error) {
    console.error('Unexpected error in callback:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=unknown`)
  }
} 