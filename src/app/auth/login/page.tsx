import { createClient } from '@supabase/supabase-js'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            인증 코드 관리 시스템
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            로그인하여 시작하세요
          </p>
        </div>
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
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
                loading_button_label: '회원가입 중...',
                social_provider_text: '{{provider}}로 계속하기',
                link_text: '계정이 없으신가요? 회원가입하기'
              }
            }
          }}
        />
      </div>
    </div>
  )
} 