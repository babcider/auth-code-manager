import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 인증 미들웨어
 * 인증되지 않은 사용자를 로그인 페이지로 리다이렉트합니다.
 */

// 인증이 필요하지 않은 경로
const publicUrls = ['/auth/login', '/auth/callback', '/auth/signout']

export async function middleware(req: NextRequest) {
  try {
    console.log('Middleware - Request path:', req.nextUrl.pathname)
    
    // public 경로는 세션 체크 없이 통과
    if (publicUrls.some(url => req.nextUrl.pathname.startsWith(url))) {
      console.log('Middleware - Public path, skipping auth check')
      return NextResponse.next()
    }

    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req, res })
    const { data: { session } } = await supabase.auth.getSession()

    // 디버깅용 로그
    console.log('Middleware - Current path:', req.nextUrl.pathname)
    console.log('Middleware - Session exists:', !!session)

    // 인증이 필요한 경로에서 세션이 없으면 로그인 페이지로 리다이렉트
    if (!session) {
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/auth/login'
      redirectUrl.searchParams.set('redirectedFrom', req.nextUrl.pathname)
      console.log('Middleware - Redirecting to:', redirectUrl.toString())
      return NextResponse.redirect(redirectUrl)
    }

    // 이미 로그인한 사용자가 로그인 페이지에 접근하면 메인 페이지로 리다이렉트
    if (session && req.nextUrl.pathname.startsWith('/auth/login')) {
      const redirectUrl = new URL('/', req.url)
      console.log('Middleware - Redirecting to:', redirectUrl.toString())
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // 에러 발생 시 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/auth/login', req.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 