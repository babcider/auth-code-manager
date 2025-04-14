# 인증 코드 관리 시스템 개발 문서

## 프로젝트 개요

인증 코드를 생성하고 관리할 수 있는 웹 애플리케이션입니다. 사용자는 인증 코드를 생성하고, 관리하며, 만료일을 설정할 수 있습니다.

## 기술 스택

- **프론트엔드**
  - Next.js 14.1.3
  - TypeScript
  - Tailwind CSS
  - Shadcn UI

- **백엔드**
  - Supabase
    - 인증/인가
    - 데이터베이스
    - 실시간 업데이트

## 주요 기능

### 1. 인증
- 이메일/비밀번호 로그인
- 소셜 로그인 (Google, GitHub)
- 세션 관리

### 2. 인증 코드 관리
- 코드 생성
  - 단일/대량 생성
  - 커스텀 접두사/접미사
  - 문자 종류 선택 (대문자/소문자/숫자)
- 코드 조회
  - 검색 기능
  - 상태별 필터링
  - 페이지네이션
- 코드 수정
  - 만료일 설정
  - 컨텍스트 추가
- 코드 삭제
  - 단일/대량 삭제

### 3. 데이터 관리
- CSV 내보내기
- CSV 가져오기
- 실시간 업데이트

## 데이터베이스 구조

### auth_codes 테이블
```sql
CREATE TABLE auth_codes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  code VARCHAR NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  used_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  context TEXT
);
```

### RLS 정책
- 인증된 사용자만 접근 가능
- CRUD 작업 모두 허용

## 배포

### 요구사항
- Node.js 18.x 이상
- npm 또는 yarn
- Supabase 프로젝트

### 환경 변수
```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

### 배포 단계
1. 환경 변수 설정
2. 의존성 설치: `npm install`
3. 빌드: `npm run build`
4. 실행: `npm start`

## 개발 가이드

### 1. 컴포넌트 구조
- `src/app`: 페이지 컴포넌트
- `src/components`: 재사용 가능한 컴포넌트
- `src/lib`: 유틸리티 함수
- `src/types`: TypeScript 타입 정의

### 2. 상태 관리
- React 훅을 사용한 로컬 상태 관리
- Supabase 실시간 구독을 통한 데이터 동기화

### 3. 스타일링
- Tailwind CSS 클래스 사용
- Shadcn UI 컴포넌트 커스터마이징

### 4. 에러 처리
- try-catch 블록을 사용한 에러 핸들링
- 사용자 친화적인 에러 메시지
- 개발자 콘솔 로깅

## 향후 개선사항

1. 테스트 코드 작성
2. 성능 최적화
3. 접근성 개선
4. 다국어 지원
5. 모바일 반응형 디자인 개선 