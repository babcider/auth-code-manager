'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function Login() {
  const supabase = createClientComponentClient()
  const router = useRouter()

  useEffect(() => {
    const handleAuthChange = async (event: string, session: any) => {
      console.log('Auth event:', event)
      console.log('Session:', session)

      if (event === 'SIGNED_IN' && session?.user) {
        try {
          // 사용자 데이터 조회
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          console.log('User data:', userData)
          
          if (userError) {
            console.error('User data error:', userError)
            toast.error('사용자 정보를 가져오는데 실패했습니다.')
            await supabase.auth.signOut()
            return
          }

          // 신규 사용자인 경우
          if (!userData) {
            console.log('New user, creating record...')
            const { error: insertError } = await supabase
              .from('users')
              .insert([
                { 
                  id: session.user.id,
                  email: session.user.email,
                  role: 'user',
                  active: false,
                  provider: session.user.app_metadata?.provider || 'email'
                }
              ])

            if (insertError) {
              console.error('User creation error:', insertError)
              toast.error('사용자 계정 생성에 실패했습니다.')
              await supabase.auth.signOut()
              return
            }

            toast.error('관리자의 승인이 필요합니다. 승인 후 로그인이 가능합니다.')
            await supabase.auth.signOut()
            return
          }

          // 활성화 상태 체크
          const isUserActive = userData.active === true

          if (!isUserActive) {
            console.error('User is not active', userData)
            await supabase.auth.signOut()
            toast.error('비활성화된 계정입니다. 관리자에게 문의하세요.')
            return
          }

          // 활성화된 사용자만 홈페이지로 이동
          console.log('User is active, proceeding to home page')
          router.refresh()
          await new Promise(resolve => setTimeout(resolve, 500))
          window.location.href = '/'
        } catch (error) {
          console.error('Error in auth change handler:', error)
          toast.error('로그인 처리 중 오류가 발생했습니다.')
          await supabase.auth.signOut()
        }
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange)

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