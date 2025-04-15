import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 인증 미들웨어
 * 인증되지 않은 사용자를 로그인 페이지로 리다이렉트합니다.
 */
export async function middleware(request: NextRequest) {
  try {
    const res = NextResponse.next()
    const supabase = createMiddlewareClient({ req: request, res })
    const { data: { session } } = await supabase.auth.getSession()

    // 디버깅용 로그
    console.log('Middleware - Current path:', request.nextUrl.pathname)
    console.log('Middleware - Session exists:', !!session)

    // 인증이 필요하지 않은 경로
    const publicPaths = ['/auth/login', '/auth/callback', '/auth/sign-in', '/auth/signout']
    const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

    // 인증이 필요한 경로에서 세션이 없으면 로그인 페이지로 리다이렉트
    if (!session && !isPublicPath) {
      const redirectUrl = new URL('/auth/login', request.url)
      console.log('Middleware - Redirecting to:', redirectUrl.toString())
      return NextResponse.redirect(redirectUrl)
    }

    // 이미 로그인한 사용자가 로그인 페이지에 접근하면 메인 페이지로 리다이렉트
    if (session && request.nextUrl.pathname.startsWith('/auth/login')) {
      const redirectUrl = new URL('/', request.url)
      console.log('Middleware - Redirecting to:', redirectUrl.toString())
      return NextResponse.redirect(redirectUrl)
    }

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // 에러 발생 시 로그인 페이지로 리다이렉트
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 