'use client'

import Link from 'next/link'
import { Session } from '@supabase/auth-helpers-nextjs'

interface NavigationProps {
  session: Session
  userData: {
    role: string
    email: string
  } | null
}

export default function Navigation({ session, userData }: NavigationProps) {
  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex space-x-8">
            <Link
              href="/"
              className="flex items-center px-1 pt-1 text-sm font-medium text-gray-900"
            >
              인증 코드 관리
            </Link>
            <Link
              href="/audit"
              className="flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
            >
              감사 로그
            </Link>
            {userData?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center px-1 pt-1 text-sm font-medium text-gray-500 hover:text-gray-900"
              >
                사용자 관리
              </Link>
            )}
          </div>
          <div className="flex items-center">
            <span className="text-gray-700 mr-4">{userData?.email}</span>
            <form action="/auth/signout" method="post">
              <button
                type="submit"
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                로그아웃
              </button>
            </form>
          </div>
        </div>
      </div>
    </nav>
  )
} 