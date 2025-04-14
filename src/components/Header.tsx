'use client'

import { Button } from '@/components/ui/button'
import { useRouter } from 'next/navigation'

export default function Header() {
  const router = useRouter()

  const handleSignOut = () => {
    router.push('/auth/signout')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b px-4">
      <h1 className="text-xl font-bold">인증 코드 관리</h1>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        로그아웃
      </Button>
    </header>
  )
} 