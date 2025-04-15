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
    
    console.log('Auth callback started:', { url: request.url, code: code ? 'exists' : 'none' })

    if (code) {
      const cookieStore = cookies()
      const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
      
      // 인증 코드로 세션 교환
      console.log('Exchanging code for session...')
      const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
      
      if (sessionError) {
        console.error('Session exchange error:', sessionError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=session`)
      }

      console.log('Session exchange successful:', { 
        userId: session?.user?.id,
        email: session?.user?.email,
        provider: session?.user?.app_metadata?.provider
      })

      if (session?.user) {
        // 사용자 데이터 조회
        console.log('Checking existing user data...')
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('*')
          .eq('id', session.user.id)
          .single()

        console.log('User data check result:', { userData, error: userError })

        if (userError && userError.code !== 'PGRST116') { // PGRST116는 데이터가 없는 경우
          console.error('User data fetch error:', userError)
          await supabase.auth.signOut()
          return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=user_data`)
        }

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
          console.log('New user data:', newUser)

          const { error: insertError } = await supabase
            .from('users')
            .insert([newUser])

          if (insertError) {
            console.error('User creation error:', insertError)
            await supabase.auth.signOut()
            return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=user_creation`)
          }

          console.log('New user created successfully')
          await supabase.auth.signOut()
          return NextResponse.redirect(`${requestUrl.origin}/auth/login?message=approval_required`)
        }

        // 비활성 사용자 체크
        console.log('Checking user active status:', userData.active)
        if (!userData.active) {
          console.log('User is not active, signing out')
          await supabase.auth.signOut()
          return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=inactive`)
        }

        // 활성화된 사용자는 홈페이지로 리다이렉션
        console.log('User is active, redirecting to home')
        return NextResponse.redirect(requestUrl.origin)
      }
    } else {
      console.log('No auth code provided')
    }

    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=invalid_request`)
  } catch (error) {
    console.error('Unexpected error in callback:', error)
    return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=unknown`)
  }
} 