import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * 소셜 로그인 콜백 핸들러
 * 로그인 후 사용자를 메인 페이지로 리다이렉트합니다.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  
  try {
    const code = requestUrl.searchParams.get('code')
    const next = requestUrl.searchParams.get('next')
    
    console.log('Auth callback started:', { 
      url: request.url, 
      code: code ? 'exists' : 'none',
      next,
      timestamp: new Date().toISOString()
    })

    if (!code) {
      console.log('No auth code provided')
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=no_code`)
    }

    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // 현재 세션 확인
    const { data: { session: currentSession } } = await supabase.auth.getSession()
    console.log('Current session:', {
      exists: !!currentSession,
      userId: currentSession?.user?.id,
      timestamp: new Date().toISOString()
    })
    
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
      const newUser = {
        id: session.user.id,
        email: session.user.email,
        role: 'user',
        active: false,
        provider: session.user.app_metadata?.provider || 'email'
      }
      console.log('New user data:', {
        ...newUser,
        timestamp: new Date().toISOString()
      })

      const { error: insertError } = await supabase
        .from('users')
        .insert([newUser])

      if (insertError) {
        console.error('User creation error:', {
          error: insertError,
          timestamp: new Date().toISOString()
        })
        await supabase.auth.signOut()
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=user_creation`)
      }

      console.log('New user created successfully, signing out')
      await supabase.auth.signOut()
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?message=approval_required`)
    }

    // 비활성 사용자 체크
    console.log('User active status:', {
      active: userData.active,
      timestamp: new Date().toISOString()
    })
    
    if (!userData.active) {
      console.log('User is not active, signing out')
      await supabase.auth.signOut()
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=inactive`)
    }

    // 활성화된 사용자는 홈페이지로 리다이렉션
    console.log('User is active, redirecting to home')
    return NextResponse.redirect(requestUrl.origin)

  } catch (error) {
    console.error('Unexpected error in callback:', {
      error,
      timestamp: new Date().toISOString()
    })
    // 에러 발생 시 세션 정리
    const supabase = createRouteHandlerClient({ cookies: () => cookies() })
    await supabase.auth.signOut()
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=unknown`)
  }
} 