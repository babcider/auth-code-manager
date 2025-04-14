'use client'

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import { Auth } from '@supabase/auth-ui-react'
import { ThemeSupa } from '@supabase/auth-ui-shared'

/**
 * 로그인 페이지 컴포넌트
 * Supabase Auth UI를 사용하여 이메일/비밀번호 및 소셜 로그인 기능을 제공합니다.
 */
export default function LoginPage() {
  // Supabase 클라이언트 인스턴스 생성
  const supabase = createClientComponentClient()

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
        {/* Supabase Auth UI 컴포넌트 */}
        <Auth
          supabaseClient={supabase}
          appearance={{ theme: ThemeSupa }}
          providers={['google', 'github']}
          localization={{
            variables: {
              // 로그인 폼 한글화
              sign_in: {
                email_label: '이메일',
                password_label: '비밀번호',
                button_label: '로그인',
                loading_button_label: '로그인 중...',
                social_provider_text: '{{provider}}로 계속하기',
                link_text: '이미 계정이 있으신가요? 로그인하기'
              },
              // 회원가입 폼 한글화
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