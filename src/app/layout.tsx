import './globals.css'
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NotificationProvider } from '@/contexts/NotificationContext'
import Link from 'next/link'
import Navigation from '@/components/Navigation'

export const metadata = {
  title: '인증 코드 관리 시스템',
  description: '인증 코드 생성 및 관리를 위한 시스템입니다.',
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = createServerComponentClient({ cookies })
  const {
    data: { session },
  } = await supabase.auth.getSession()

  let userData = null
  if (session) {
    const { data } = await supabase
      .from('users')
      .select('role, email')
      .eq('id', session.user.id)
      .single()
    userData = data
  }

  return (
    <html lang="ko">
      <body>
        <NotificationProvider>
          <div className="min-h-screen bg-gray-50">
            {session && (
              <Navigation session={session} userData={userData} />
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