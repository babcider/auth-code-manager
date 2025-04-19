# 인증 코드 관리 시스템

인증 코드를 생성하고 관리할 수 있는 웹 애플리케이션입니다.

## 주요 기능

- 인증 코드 생성
- 코드 목록 조회 및 필터링
- 만료일 설정 및 수정
- 코드 상태 관리 (활성/사용됨/만료됨)
- 코드 내보내기/가져오기
- 구글 로그인 및 이메일 회원가입
- 사용자 권한 관리 (관리자 승인 필요)
- 감사 로그 기록

## 기술 스택

- Next.js 14 (App Router)
- TypeScript
- Supabase (인증, 데이터베이스)
- Tailwind CSS
- Shadcn UI
- React Hook Form
- Zod (유효성 검사)

## 프로젝트 문서

- [데이터베이스 스키마](docs/DATABASE.md)
- [인증 및 권한](docs/AUTH.md)
- [API 문서](docs/API.md)

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

## 최근 업데이트

### 2024-03-XX
- 로그인/회원가입 UI 개선
  - 페이지 타이틀 동적 변경
  - 구글 로그인 버튼 통합
  - 한글 로컬라이제이션 적용
- 사용자 인증 프로세스 개선
  - 관리자 승인 프로세스 추가
  - 로그인 감사 로그 기록
  - 비활성 계정 접근 제한

## 라이선스

MIT 