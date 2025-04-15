'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useSearchParams } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function Login() {
  const supabase = createClientComponentClient()
  const searchParams = useSearchParams()
  
  useEffect(() => {
    const error = searchParams.get('error')
    const message = searchParams.get('message')

    if (error) {
      switch (error) {
        case 'session':
          toast.error('로그인 세션 처리 중 오류가 발생했습니다.', {
            duration: 5000,
            position: 'top-center',
          })
          break
        case 'user_data':
          toast.error('사용자 정보를 가져오는데 실패했습니다.', {
            duration: 5000,
            position: 'top-center',
          })
          break
        case 'user_creation':
          toast.error('사용자 계정 생성에 실패했습니다.', {
            duration: 5000,
            position: 'top-center',
          })
          break
        case 'inactive':
          toast('계정이 아직 승인되지 않았습니다. 관리자의 승인을 기다려주세요.', {
            duration: 6000,
            position: 'top-center',
            icon: '⚠️',
            style: {
              borderRadius: '10px',
              background: '#333',
              color: '#fff',
            },
          })
          break
        default:
          toast.error('로그인 처리 중 오류가 발생했습니다.', {
            duration: 5000,
            position: 'top-center',
          })
      }
    }

    if (message === 'approval_required') {
      toast('회원가입이 완료되었습니다! 👋', {
        duration: 3000,
        position: 'top-center',
      })
      toast('관리자 승인 후 로그인이 가능합니다. 잠시만 기다려주세요.', {
        duration: 6000,
        position: 'top-center',
        icon: '🔔',
        style: {
          borderRadius: '10px',
          background: '#333',
          color: '#fff',
        },
      })
    }
  }, [searchParams])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">로그인</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="default"
          showLinks={false}
          providers={['google']}
          redirectTo={typeof window !== 'undefined' ? `${window.location.origin}/auth/callback` : '/auth/callback'}
          localization={{
            variables: {
              sign_in: {
                email_label: '이메일',
                password_label: '비밀번호',
                button_label: '로그인',
                loading_button_label: '로그인 중...',
                social_provider_text: '{{provider}}로 계속하기',
                link_text: '이미 계정이 있으신가요? 로그인하기'
              }
            }
          }}
        />
      </div>
    </div>
  )
}