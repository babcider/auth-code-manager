'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'
import { useRouter, useSearchParams, ReadonlyURLSearchParams } from 'next/navigation'
import { Suspense, useEffect, useState } from 'react'
import { toast, Toaster } from 'react-hot-toast'
import { logAudit } from '@/lib/audit'

const errorMessages: { [key: string]: string } = {
  no_code: '인증 코드가 없습니다. 다시 시도해주세요.',
  auth_error: '인증 과정에서 오류가 발생했습니다. 다시 시도해주세요.',
  session_error: '세션 생성 중 오류가 발생했습니다.',
  no_session: '로그인 세션을 생성할 수 없습니다.',
  user_data: '사용자 정보를 불러올 수 없습니다.',
  user_creation: '사용자 계정 생성에 실패했습니다.',
  inactive: '계정이 아직 승인되지 않았습니다. 관리자의 승인을 기다려주세요.',
  unknown: '알 수 없는 오류가 발생했습니다. 잠시 후 다시 시도해주세요.'
}

const messages: { [key: string]: string } = {
  approval_required: '계정이 생성되었습니다. 관리자의 승인을 기다려주세요.'
}

const MessageHandler = ({ searchParams }: { searchParams: ReadonlyURLSearchParams }) => {
  const error = searchParams.get('error')
  const message = searchParams.get('message')
  
  if (error && error in errorMessages) {
    return (
      <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
        <p>{errorMessages[error]}</p>
      </div>
    )
  }

  if (message && message in messages) {
    return (
      <div className="p-4 mb-4 text-sm text-blue-800 rounded-lg bg-blue-50">
        <p>{messages[message]}</p>
      </div>
    )
  }

  return null
}

export default function Login() {
  const supabase = createClientComponentClient()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const checkUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
          const { data: userData } = await supabase
            .from('users')
            .select('is_active, role')
            .eq('id', user.id)
            .single()

          if (userData?.is_active) {
            if (user.email) {
            await logAudit('login', {
              user_email: user.email,
              role: userData.role
            })
            }
            router.push('/')
          } else {
            toast.error('계정이 비활성화되었습니다. 관리자에게 문의하세요.')
            await supabase.auth.signOut()
          }
        }
      } catch (error) {
        console.error('사용자 확인 중 오류 발생:', error)
      }
    }

    checkUser()
  }, [router])

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50">
      <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-8 shadow-lg">
        <div className="text-center">
          <h2 className="text-3xl font-bold tracking-tight text-gray-900">
            로그인
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            시리얼 매니저에 오신 것을 환영합니다
          </p>
        </div>
        
        <MessageHandler searchParams={searchParams} />
        
        <div className="mt-8">
          {loading ? (
            <div className="flex justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <Auth
              supabaseClient={supabase}
              appearance={{ 
                theme: ThemeSupa,
                style: {
                  button: {
                    background: '#4F46E5',
                    color: 'white',
                    borderRadius: '0.5rem',
                    height: '2.5rem',
                    fontSize: '0.875rem',
                  },
                  anchor: {
                    color: '#4F46E5',
                    fontSize: '0.875rem',
                  },
                  container: {
                    gap: '1rem',
                  },
                  divider: {
                    margin: '1.5rem 0',
                  },
                },
                className: {
                  container: 'space-y-4',
                  button: 'w-full !bg-indigo-600 hover:!bg-indigo-700 transition-colors',
                  input: 'rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500',
                },
              }}
              providers={['google']}
              localization={{
                variables: {
                  sign_in: {
                    email_label: '이메일',
                    password_label: '비밀번호',
                    button_label: '이메일로 로그인',
                    loading_button_label: '로그인 중...',
                    social_provider_text: '구글 계정으로 로그인',
                    link_text: '계정이 없으신가요? 회원가입',
                  },
                  sign_up: {
                    email_label: '이메일',
                    password_label: '비밀번호',
                    button_label: '회원가입',
                    loading_button_label: '회원가입 중...',
                    social_provider_text: '구글 계정으로 회원가입',
                    link_text: '이미 계정이 있으신가요? 로그인',
                  },
                  forgotten_password: {
                    link_text: '비밀번호를 잊으셨나요?',
                    button_label: '비밀번호 재설정 메일 보내기',
                    loading_button_label: '메일 전송 중...',
                    confirmation_text: '비밀번호 재설정 링크를 이메일로 보내드렸습니다.',
                  },
                },
              }}
            />
          )}
        </div>
      </div>
      <Toaster />
    </div>
  )
}