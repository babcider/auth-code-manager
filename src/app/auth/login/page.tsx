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
    const checkUser = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        console.log('Session check:', session)
        
        if (sessionError) {
          throw sessionError
        }

        if (session?.user) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single()

          console.log('User data:', userData)
          
          if (userError) {
            console.error('User data error:', userError)
            await supabase.auth.signOut()
            toast.error('사용자 정보를 가져오는데 실패했습니다.')
            return
          }

          if (!userData) {
            console.error('User not found')
            await supabase.auth.signOut()
            toast.error('사용자 정보를 찾을 수 없습니다.')
            return
          }

          if (!userData.active) {
            console.error('User is not active')
            await supabase.auth.signOut()
            toast.error('비활성화된 계정입니다. 관리자에게 문의하세요.')
            return
          }

          router.refresh()
          router.push('/system')
        }
      } catch (error) {
        console.error('Error in checkUser:', error)
        toast.error('로그인 처리 중 오류가 발생했습니다.')
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