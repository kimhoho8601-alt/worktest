# V4.1 업데이트 안내

## 반드시 2가지 작업이 필요합니다

### 1. GitHub 교체
ZIP을 압축 해제한 뒤 저장소 최상위 파일과 폴더를 교체하고 Commit changes를 누릅니다. Netlify 자동 배포가 켜져 있다면 별도로 Netlify에 파일을 올릴 필요는 없습니다.

### 2. Supabase 마이그레이션
Supabase → SQL Editor → New query에서 `supabase/migrate_v4_to_v4_1.sql` 전체를 붙여넣고 Run을 누릅니다.

이 SQL은 다음을 처리합니다.
- `employees` 테이블 생성
- 팀장별 팀원 접근 권한(RLS) 적용
- 목표·면담을 팀원 데이터와 연결
- 신규 회원가입 계정을 `manager / pending`으로 생성

## 운영 흐름
1. 팀장이 회원가입 및 이메일 인증
2. 관리자가 직원관리 → 팀장 계정 승인·관리에서 `active`로 변경
3. 팀장이 로그인 후 팀원 추가
4. 팀원별 목표와 면담 등록
5. 관리자는 전체 데이터를 조회·수정

## 기존 환경변수
아래 값은 그대로 유지합니다.
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
