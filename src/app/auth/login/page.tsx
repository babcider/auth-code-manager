import { createServerComponentClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { Button } from '@/components/ui/button'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string }
}) {
  const supabase = createServerComponentClient({ cookies })
  const { data: { session } } = await supabase.auth.getSession()

  if (session) {
    redirect('/')
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 py-24">
      <h1 className="text-2xl font-bold">로그인</h1>
      {searchParams.error && (
        <div className="rounded-md bg-red-50 p-4 text-sm text-red-500">
          {searchParams.error}
        </div>
      )}
      <div className="flex flex-col gap-2">
        <form action="/auth/sign-in/kakao" method="post">
          <Button className="w-full bg-[#FEE500] text-black hover:bg-[#FEE500]/90">
            카카오로 로그인
          </Button>
        </form>
        <form action="/auth/sign-in/google" method="post">
          <Button className="w-full bg-white text-black hover:bg-white/90 border border-gray-300">
            Google로 로그인
          </Button>
        </form>
      </div>
    </div>
  )
}