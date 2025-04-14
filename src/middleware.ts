import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

/**
 * 인증 미들웨어
 * 인증되지 않은 사용자를 로그인 페이지로 리다이렉트합니다.
 */
export async function middleware(request: NextRequest) {
  const response = NextResponse.next()
  const supabase = createMiddlewareClient({ req: request, res: response })

  const {
    data: { session },
  } = await supabase.auth.getSession()

  // 로그인 페이지나 콜백 페이지는 인증 체크를 하지 않습니다
  if (request.nextUrl.pathname.startsWith('/auth')) {
    return response
  }

  // 인증되지 않은 사용자는 로그인 페이지로 리다이렉트
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
} 