import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * 소셜 로그인 콜백 핸들러
 * 로그인 후 사용자를 메인 페이지로 리다이렉트합니다.
 */
export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')
  
  console.log('Auth callback received. Code:', code) // 디버깅용 로그

  if (code) {
    const cookieStore = cookies()
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore })
    
    // 인증 코드로 세션 교환
    const { data: { session }, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)
    
    if (sessionError) {
      console.error('Session error:', sessionError)
      return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=session`)
    }

    if (session?.user) {
      // 사용자 데이터 조회
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single()

      if (userError) {
        console.error('User data error:', userError)
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=user_data`)
      }

      // 신규 사용자인 경우
      if (!userData) {
        const { error: insertError } = await supabase
          .from('users')
          .insert([
            { 
              id: session.user.id,
              email: session.user.email,
              role: 'user',
              active: false,
              provider: session.user.app_metadata?.provider || 'email'
            }
          ])

        if (insertError) {
          console.error('User creation error:', insertError)
          return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=user_creation`)
        }

        // 신규 사용자는 로그아웃 처리
        await supabase.auth.signOut()
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?message=approval_required`)
      }

      // 비활성 사용자 체크
      if (!userData.active) {
        await supabase.auth.signOut()
        return NextResponse.redirect(`${requestUrl.origin}/auth/login?error=inactive`)
      }
    }

    // 홈페이지로 리다이렉트
    return NextResponse.redirect(new URL('/', requestUrl.origin), {
      status: 303
    })
  }

  // 에러 발생 시 로그인 페이지로 리다이렉트
  return NextResponse.redirect(
    new URL('/auth/login?error=인증 코드가 없습니다', requestUrl.origin),
    { status: 303 }
  )
} 