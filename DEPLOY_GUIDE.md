# V4 배포 가이드

## 1. GitHub에 업로드

ZIP을 압축 해제한 뒤 폴더 안의 파일 전체를 저장소 루트에 올립니다.

주요 파일 구조:

```text
src/
netlify/
supabase/
index.html
package.json
netlify.toml
vite.config.js
```

## 2. Supabase 프로젝트 생성

1. Supabase에서 새 프로젝트를 만듭니다.
2. SQL Editor를 엽니다.
3. `supabase/schema.sql` 전체를 붙여넣고 실행합니다.
4. Authentication > Providers > Email을 확인합니다.
5. 운영 전에는 이메일 인증을 켜는 것을 권장합니다.

## 3. Netlify 환경변수 등록

Netlify 프로젝트에서 Site configuration > Environment variables에 등록합니다.

```text
VITE_SUPABASE_URL = Supabase Project URL
VITE_SUPABASE_ANON_KEY = Supabase anon public key
```

Supabase의 Project Settings > API에서 확인할 수 있습니다.

## 4. 최초 관리자 지정

1. 배포된 사이트에서 관리자 계정으로 사용할 이메일로 회원가입합니다.
2. Supabase SQL Editor에서 아래를 실제 이메일로 수정해 실행합니다.

```sql
update public.profiles
set role='admin', account_status='active'
where email='admin@company.org';
```

3. 로그아웃 후 다시 로그인합니다.
4. 직원관리에서 다른 가입자의 승인, 역할, 부서와 직속 관리자를 설정합니다.

## 5. Netlify 빌드 설정

`netlify.toml`에 포함되어 있습니다.

```text
Build command: npm run build
Publish directory: dist
```

## 6. AI 기능 운영 방식

### 비용 없는 기본 방식

AI 도우미에서 내용을 입력하고 `무료 방식: 프롬프트 복사`를 누릅니다. 각 사용자가 본인이 사용하는 ChatGPT 무료·유료 계정 또는 다른 AI에 붙여넣습니다. 회사 API 비용은 발생하지 않습니다.

### 조직 API를 나중에 활성화할 때

Netlify 환경변수에 아래를 추가합니다.

```text
OPENAI_API_KEY = 조직에서 발급한 OpenAI API 키
```

주의: `VITE_OPENAI_API_KEY`처럼 VITE 접두사를 붙이면 브라우저에 노출될 수 있으므로 절대 사용하지 않습니다.

## 7. 운영 전 필수 확인

- 공개 회원가입을 허용할지 결정
- 이메일 인증 활성화
- 관리자 계정 2개 이상 확보
- 직원·팀장 권한 테스트
- 면담 기록 공개 범위 정책 확정
- 개인정보와 민감한 면담 내용의 입력 기준 마련
- 정기적인 Supabase 백업 정책 확인

## 8. 권한 구조

- 직원: 본인 목표, 본인에게 공개된 면담 조회
- 팀장: 본인 및 직속 팀원 목표, 본인이 작성한 면담, 직속 팀원 조회
- 관리자: 전체 데이터와 가입 승인·권한 관리

RLS(Row Level Security)가 데이터베이스에서 권한을 제한합니다.
