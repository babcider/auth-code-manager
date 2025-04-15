'use client'

import { Button } from '@/components/ui/button'

export default function Header() {
  return (
    <header className="flex h-16 items-center justify-between border-b px-4">
      <h1 className="text-xl font-bold">인증 코드 관리</h1>
      <form action="/auth/signout" method="post">
        <Button variant="ghost" size="sm" type="submit">
          로그아웃
        </Button>
      </form>
    </header>
  )
} 