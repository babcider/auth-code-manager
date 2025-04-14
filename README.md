# 인증 코드 관리 시스템

인증 코드를 생성하고 관리할 수 있는 웹 애플리케이션입니다.

## 주요 기능

- 인증 코드 생성
- 코드 목록 조회 및 필터링
- 만료일 설정 및 수정
- 코드 상태 관리 (활성/사용됨/만료됨)
- 코드 내보내기/가져오기

## 기술 스택

- Next.js
- TypeScript
- Supabase
- Tailwind CSS
- Shadcn UI

## 시작하기

1. 저장소 클론
```bash
git clone [repository-url]
cd [repository-name]
```

2. 의존성 설치
```bash
npm install
```

3. 환경 변수 설정
`.env.local` 파일을 생성하고 다음 변수들을 설정합니다:
```
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

4. 개발 서버 실행
```bash
npm run dev
```

## 라이선스

MIT 