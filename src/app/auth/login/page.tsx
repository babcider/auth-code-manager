'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'

export default function Login() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const checkUser = async () => {
      try {
        console.log('세션 체크 시작...')
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('세션 데이터:', session)
        
        if (sessionError) {
          console.error('세션 에러:', sessionError)
          return
        }

        if (session?.user) {
          console.log('사용자 정보 조회 시작...')
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          console.log('사용자 데이터:', userData)
          console.log('사용자 에러:', userError)

          if (userError) {
            console.error('사용자 정보 조회 실패:', userError)
            await supabase.auth.signOut()
            return
          }

          if (!userData) {
            console.error('사용자 정보가 없음')
            await supabase.auth.signOut()
            return
          }

          if (!userData.active) {
            console.error('비활성화된 사용자')
            await supabase.auth.signOut()
            return
          }

          console.log('로그인 성공, 리다이렉트 시작...')
          router.push('/system')
          router.refresh()
        }
      } catch (error) {
        console.error('예상치 못한 에러:', error)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('인증 상태 변경:', event)
      console.log('새 세션:', session)
      if (event === 'SIGNED_IN') {
        await checkUser()
      }
    })

    checkUser()

    return () => {
      subscription.unsubscribe()
    }
  }, [router, supabase])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">로그인</h2>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          theme="default"
          showLinks={false}
          providers={['kakao', 'google']}
          redirectTo={`${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`}
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