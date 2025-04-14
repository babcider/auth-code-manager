import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 인증 미들웨어
 * 인증되지 않은 사용자를 로그인 페이지로 리다이렉트합니다.
 */
export async function middleware(request: NextRequest) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res })
  const { data: { session } } = await supabase.auth.getSession()

  // 인증이 필요하지 않은 경로
  const publicPaths = ['/auth/login', '/auth/callback', '/auth/sign-in']
  const isPublicPath = publicPaths.some(path => request.nextUrl.pathname.startsWith(path))

  // 인증이 필요한 경로에서 세션이 없으면 로그인 페이지로 리다이렉트
  if (!session && !isPublicPath) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  // 이미 로그인한 사용자가 로그인 페이지에 접근하면 메인 페이지로 리다이렉트
  if (session && request.nextUrl.pathname.startsWith('/auth/login')) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 