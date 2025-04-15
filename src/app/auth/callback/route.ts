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
    const supabase = createRouteHandlerClient({ cookies })
    try {
      await supabase.auth.exchangeCodeForSession(code)
      console.log('Code exchange successful') // 디버깅용 로그
      
      // 홈페이지로 리다이렉트
      return NextResponse.redirect(new URL('/', requestUrl.origin), {
        status: 303
      })
    } catch (error) {
      console.error('Error in callback:', error) // 디버깅용 로그
      return NextResponse.redirect(
        new URL('/auth/login?error=인증 처리 중 오류가 발생했습니다', requestUrl.origin),
        { status: 303 }
      )
    }
  }

  // 에러 발생 시 로그인 페이지로 리다이렉트
  return NextResponse.redirect(
    new URL('/auth/login?error=인증 코드가 없습니다', requestUrl.origin),
    { status: 303 }
  )
} 