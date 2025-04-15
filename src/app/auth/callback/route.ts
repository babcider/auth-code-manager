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
  
  try {
    const code = requestUrl.searchParams.get('code')
    
    console.log('Auth callback started:', { 
      url: request.url, 
      code: code ? 'exists' : 'none',
      timestamp: new Date().toISOString()
    })

    if (!code) {
      console.log('No auth code provided')
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_code`)
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // 인증 코드로 세션 교환
    console.log('Exchanging code for session...')
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Session exchange error:', {
        error: sessionError,
        timestamp: new Date().toISOString()
      })
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=session`)
    }

    if (!session?.user) {
      console.error('No user in session after exchange')
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_user`)
    }

    // 세션 설정을 위한 응답 객체 생성
    const response = NextResponse.redirect(requestUrl.origin)
    
    // 세션 쿠키 설정
    const authCookie = cookieStore.get('sb-auth-token')
    if (authCookie) {
      response.cookies.set({
        name: 'sb-auth-token',
        value: authCookie.value,
        path: '/',
        sameSite: 'lax',
        secure: true,
        maxAge: 60 * 60 * 24 * 7 // 7 days
      })
    }

    console.log('Session exchange successful:', { 
      userId: session.user.id,
      email: session.user.email,
      provider: session.user.app_metadata?.provider,
      timestamp: new Date().toISOString()
    })

    // 사용자 데이터 조회
    console.log('Checking existing user data...')
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('id', session.user.id)
      .single()

    console.log('User data check result:', { 
      exists: !!userData,
      error: userError,
      timestamp: new Date().toISOString()
    })

    // 신규 사용자인 경우
    if (!userData) {
      console.log('Creating new user record...')
      
      // 사용자 데이터 준비
      const newUser = {
        id: session.user.id,
        email: session.user.email,
        role: 'user',
        is_active: false,
        provider: session.user.app_metadata?.provider || 'email',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
      
      console.log('Attempting to insert new user:', newUser)

      try {
        const { error: insertError } = await supabase
          .from('users')
          .insert([newUser])
          .select()

        if (insertError) {
          console.error('User creation error:', {
            error: insertError,
            sql: insertError.details,
            hint: insertError.hint,
            code: insertError.code,
            timestamp: new Date().toISOString()
          })
          
          // RLS 정책 확인을 위한 추가 로그
          const { data: rls, error: rlsError } = await supabase
            .rpc('get_my_claims')
          console.log('Current RLS claims:', { rls, error: rlsError })
          
          await supabase.auth.signOut()
          return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=user_creation`)
        }

        console.log('New user created successfully, signing out')
        await supabase.auth.signOut()
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?message=approval_required`)
      } catch (insertError) {
        console.error('Unexpected error during user creation:', insertError)
        await supabase.auth.signOut()
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=user_creation`)
      }
    }

    // 비활성 사용자 체크
    if (!userData.is_active) {
      console.log('User is not active, signing out')
      await supabase.auth.signOut()
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=inactive`)
    }

    // 활성화된 사용자는 홈페이지로 리다이렉션
    console.log('User is active, redirecting to home')
    const returnTo = requestUrl.searchParams.get('returnTo') || `${requestUrl.origin}/`
    console.log('Redirecting to:', returnTo)
    return NextResponse.redirect(returnTo)

  } catch (error) {
    console.error('Unexpected error in callback:', {
      error,
      stack: error instanceof Error ? error.stack : undefined,
      timestamp: new Date().toISOString()
    })
    // 에러 발생 시 세션 정리
    const supabase = createRouteHandlerClient({ cookies: () => cookies() })
    await supabase.auth.signOut()
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=unknown`)
  }
} 