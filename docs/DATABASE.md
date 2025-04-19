# 데이터베이스 스키마

## 테이블 구조

### auth_codes
인증 코드 정보를 저장하는 테이블

| 컬럼명 | 타입 | NULL 허용 | 기본값 | 설명 |
|--------|------|-----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | 고유 식별자 |
| key | varchar | NO | - | 인증 키 |
| setup_key | varchar | YES | - | 설치 키 |
| unity_key | varchar | YES | - | Unity 키 |
| institution_name | varchar | YES | - | 기관명 |
| agency | varchar | YES | - | 기관 구분 |
| memo | varchar | YES | - | 메모 |
| program_update | varchar | YES | - | 프로그램 업데이트 |
| is_active | boolean | NO | true | 활성화 여부 |
| is_unlimit | boolean | NO | false | 무제한 사용 여부 |
| expire_time | timestamptz | YES | - | 만료일 |
| local_max_count | integer | YES | 0 | 최대 실행 횟수 |
| create_time | timestamptz | NO | CURRENT_TIMESTAMP | 생성일 |
| start_time | timestamptz | YES | - | 시작일 |
| last_check_time | timestamptz | YES | - | 마지막 확인 시간 |
| last_check_ip | varchar | YES | - | 마지막 확인 IP |
| run_count | integer | YES | 0 | 실행 횟수 |
| available_apps | varchar | YES | - | 사용 가능한 앱 목록 |
| available_contents | varchar | YES | - | 사용 가능한 콘텐츠 목록 |

### auth_code_apps
인증 코드와 앱의 연결 정보를 저장하는 테이블

| 컬럼명 | 타입 | NULL 허용 | 기본값 | 설명 |
|--------|------|-----------|---------|-------|
| id | uuid | NO | uuid_generate_v4() | 고유 식별자 |
| auth_code_id | uuid | NO | - | 인증 코드 ID |
| app_id | integer | NO | - | 앱 ID |
| created_at | timestamptz | YES | timezone('utc'::text, now()) | 생성일 |

### auth_code_contents
인증 코드와 콘텐츠의 연결 정보를 저장하는 테이블

| 컬럼명 | 타입 | NULL 허용 | 기본값 | 설명 |
|--------|------|-----------|---------|-------|
| id | uuid | NO | uuid_generate_v4() | 고유 식별자 |
| auth_code_id | varchar | NO | - | 인증 코드 ID |
| content_id | integer | NO | - | 콘텐츠 ID |
| created_at | timestamptz | NO | now() | 생성일 |

### auth_codes_audit_log
인증 코드 관련 작업 기록을 저장하는 테이블

| 컬럼명 | 타입 | NULL 허용 | 기본값 | 설명 |
|--------|------|-----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | 고유 식별자 |
| auth_code_id | uuid | NO | - | 인증 코드 ID |
| action | text | NO | - | 수행된 작업 |
| action_timestamp | timestamptz | NO | now() | 작업 시간 |
| user_id | uuid | YES | - | 작업 수행 사용자 ID |
| ip_address | text | YES | - | IP 주소 |
| user_agent | text | YES | - | 사용자 에이전트 |
| details | jsonb | YES | - | 추가 상세 정보 |
| created_at | timestamptz | NO | now() | 생성일 |

### auth_codes_failed_attempts
실패한 인증 시도를 기록하는 테이블

| 컬럼명 | 타입 | NULL 허용 | 기본값 | 설명 |
|--------|------|-----------|---------|-------|
| id | uuid | NO | gen_random_uuid() | 고유 식별자 |
| code | text | NO | - | 시도된 코드 |
| attempt_timestamp | timestamptz | NO | now() | 시도 시간 |
| ip_address | text | YES | - | IP 주소 |
| user_agent | text | YES | - | 사용자 에이전트 |
| failure_reason | text | YES | - | 실패 사유 |
| details | jsonb | YES | - | 추가 상세 정보 |

### insol_contents
콘텐츠 정보를 저장하는 테이블

| 컬럼명 | 타입 | NULL 허용 | 기본값 | 설명 |
|--------|------|-----------|---------|-------|
| id | integer | NO | - | 고유 식별자 |
| name | varchar | NO | - | 콘텐츠 이름 |
| app_type | integer | YES | - | 앱 타입 |
| scene_name | varchar | YES | - | 씬 이름 |
| custom | varchar | YES | - | 커스텀 설정 |

### insol_apps
앱 정보를 저장하는 테이블

| 컬럼명 | 타입 | NULL 허용 | 기본값 | 설명 |
|--------|------|-----------|---------|-------|
| app_id | integer | NO | - | 고유 식별자 |
| program_name | varchar | NO | - | 프로그램 이름 |
| created_at | timestamptz | YES | timezone('utc'::text, now()) | 생성일 |
| updated_at | timestamptz | YES | timezone('utc'::text, now()) | 수정일 |

### users
사용자 정보를 저장하는 테이블

| 컬럼명 | 타입 | NULL 허용 | 기본값 | 설명 |
|--------|------|-----------|---------|-------|
| id | uuid | NO | - | 고유 식별자 |
| email | text | NO | - | 이메일 |
| role | text | NO | 'user' | 역할 |
| is_active | boolean | NO | false | 활성화 여부 |
| created_at | timestamptz | NO | timezone('utc'::text, now()) | 생성일 |
| updated_at | timestamptz | NO | timezone('utc'::text, now()) | 수정일 |
| provider | text | YES | - | 인증 제공자 |

## 뷰

### auth_code_content_details
인증 코드와 관련 콘텐츠 정보를 결합한 뷰

| 컬럼명 | 타입 | 설명 |
|--------|------|-------|
| id | uuid | 고유 식별자 |
| key | varchar | 인증 키 |
| setup_key | varchar | 설치 키 |
| unity_key | varchar | Unity 키 |
| institution_name | varchar | 기관명 |
| agency | varchar | 기관 구분 |
| memo | varchar | 메모 |
| program_update | varchar | 프로그램 업데이트 |
| is_active | boolean | 활성화 여부 |
| is_unlimit | boolean | 무제한 사용 여부 |
| expire_time | timestamptz | 만료일 |
| local_max_count | integer | 최대 실행 횟수 |
| create_time | timestamptz | 생성일 |
| start_time | timestamptz | 시작일 |
| last_check_time | timestamptz | 마지막 확인 시간 |
| last_check_ip | varchar | 마지막 확인 IP |
| run_count | integer | 실행 횟수 |
| content_names | text[] | 연결된 콘텐츠 이름 목록 |
| app_types | text[] | 연결된 앱 타입 목록 |
| content_count | bigint | 연결된 콘텐츠 수 |
| status | text | 상태 |
| created_by | text | 생성자 |

## 저장 프로시저

### create_auth_code_with_contents
인증 코드와 관련 콘텐츠를 동시에 생성하는 프로시저

**입력 파라미터:**
- auth_code_data: 인증 코드 정보 (JSONB)
  - key: 인증 키 (필수)
  - is_active: 활성화 여부 (필수)
  - is_unlimit: 무제한 사용 여부 (필수)
  - local_max_count: 최대 실행 횟수
  - expire_time: 만료일
  - institution_name: 기관명
  - agency: 기관 구분
  - memo: 메모
  - setup_key: 설치 키
  - unity_key: Unity 키
  - program_update: 프로그램 업데이트
  - available_apps: 사용 가능한 앱 목록
  - available_contents: 사용 가능한 콘텐츠 목록
- content_ids: 연결할 콘텐츠 ID 목록 (TEXT[])

**반환값:**
- 생성된 인증 코드 정보 (JSONB)
  - id: 생성된 인증 코드 ID
  - status: 처리 결과 상태

## 관계

| 테이블 | 외래 키 | 참조 테이블 | 참조 컬럼 |
|--------|---------|-------------|------------|
| auth_code_contents | auth_code_id | auth_codes | key |
| auth_code_contents | content_id | insol_contents | id |
| insol_contents | app_type | insol_apps | app_id |
| auth_code_apps | auth_code_id | auth_codes | id |
| auth_code_apps | app_id | insol_apps | app_id | 