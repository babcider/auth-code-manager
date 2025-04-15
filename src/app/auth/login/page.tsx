'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { Suspense, useEffect } from 'react'
import { toast, Toaster } from 'react-hot-toast'

// 메시지 처리를 위한 별도의 클라이언트 컴포넌트
function MessageHandler() {
  const searchParams = useSearchParams()
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

  return null
}

export default function Login() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const baseUrl = 'https://auth-code-manager-one.vercel.app'
  const redirectUrl = `${baseUrl}/auth/callback`

  useEffect(() => {
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (session) {
          // 세션이 있으면 사용자 데이터 확인
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('is_active')
            .eq('id', session.user.id)
            .single()

          if (userData?.is_active) {
            console.log('Active session found, redirecting to home')
            router.push('/')
          } else {
            console.log('User is not active, signing out')
            await supabase.auth.signOut()
          }
        }
      } catch (error) {
        console.error('Error checking session:', error)
      }
    }

    // 페이지 로드 1초 후 세션 체크
    const timer = setTimeout(() => {
      checkSession()
    }, 1000)

    return () => clearTimeout(timer)
  }, [supabase, router])

  // 로그인 시도 감지를 위한 이벤트 리스너
  useEffect(() => {
    const handleAuthChange = (event: any) => {
      if (event === 'SIGNED_IN') {
        console.log('Login detected, refreshing page in 1 second...')
        setTimeout(() => {
          router.refresh()
        }, 1000)
      }
    }

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(handleAuthChange)

    return () => {
      subscription.unsubscribe()
    }
  }, [supabase, router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <Toaster />
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h2 className="mb-6 text-center text-2xl font-bold text-gray-900">로그인</h2>
        <Suspense fallback={null}>
          <MessageHandler />
        </Suspense>
        <Auth
          supabaseClient={supabase}
          appearance={{ 
            theme: ThemeSupa,
            variables: {
              default: {
                colors: {
                  brand: '#2563eb',
                  brandAccent: '#1d4ed8',
                }
              }
            }
          }}
          theme="default"
          showLinks={false}
          providers={['google']}
          redirectTo={redirectUrl}
          view="sign_in"
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
          onlyThirdPartyProviders={false}
          magicLink={false}
        />
      </div>
    </div>
  )
}