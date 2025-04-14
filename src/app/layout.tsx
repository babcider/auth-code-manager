'use client'

import './globals.css'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { useEffect, useState } from 'react'
import { NotificationProvider } from '@/contexts/NotificationContext'
import Link from 'next/link'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [session, setSession] = useState<any>(null)
  const supabase = createClientComponentClient()

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession()
      setSession(session)
    }
    getSession()
  }, [])

  return (
    <html lang="ko">
      <body>
        <NotificationProvider>
          <div className="min-h-screen bg-gray-50">
            {session && (
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
                    </div>
                    <div className="flex items-center">
                      <span className="text-gray-700 mr-4">{session.user.email}</span>
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
            )}
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
              {children}
            </main>
          </div>
        </NotificationProvider>
      </body>
    </html>
  )
} 