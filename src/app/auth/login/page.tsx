'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

export default function LoginPage() {
  const router = useRouter()
  const supabase = createClientComponentClient()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        console.log('Session:', session) // 디버깅용 로그

        if (session) {
          // 사용자 권한 확인
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('is_active, role')
            .eq('id', session.user.id)
            .single()
          
          console.log('User data:', userData) // 디버깅용 로그
          console.log('User error:', userError) // 디버깅용 로그

          if (userError) {
            console.error('Error fetching user data:', userError)
            setError('사용자 정보를 불러오는 중 오류가 발생했습니다.')
            return
          }

          if (!userData?.is_active) {
            setError('관리자의 승인이 필요합니다. 승인 후 로그인이 가능합니다.')
            await supabase.auth.signOut()
            return
          }

          router.push('/')
          router.refresh()
        }
      } catch (error) {
        console.error('Error in checkUser:', error)
        setError('로그인 처리 중 오류가 발생했습니다.')
      }
    }

    checkUser()
  }, [router, supabase])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold">인증 코드 관리</h1>
          <p className="mt-2 text-gray-600">계정으로 로그인하세요</p>
        </div>
        {error && (
          <div className="rounded-md bg-red-50 p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <Auth
          supabaseClient={supabase}
          appearance={{
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8'
                }
              }
            }
          }}
          providers={['kakao', 'google']}
          localization={{
            variables: {
              sign_in: {
                email_label: '이메일',
                password_label: '비밀번호',
                button_label: '로그인',
                loading_button_label: '로그인 중...',
                social_provider_text: '{{provider}}로 계속하기',
                link_text: '이미 계정이 있으신가요? 로그인하기'
              },
              sign_up: {
                email_label: '이메일',
                password_label: '비밀번호',
                button_label: '회원가입',
                loading_button_label: '가입 중...',
                social_provider_text: '{{provider}}로 계속하기',
                link_text: '계정이 없으신가요? 회원가입하기',
                confirmation_text: '확인 이메일을 보냈습니다. 이메일을 확인해주세요.'
              }
            }
          }}
          theme="default"
          redirectTo="https://auth-code-manager-one.vercel.app/auth/callback"
        />
      </div>
    </div>
  )
}