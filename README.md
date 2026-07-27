# 성과·면담 관리 시스템 V4

실운영을 염두에 둔 React + Vite + Supabase 기반 웹 애플리케이션입니다.

## 포함 기능

- 이메일 회원가입·로그인 및 관리자 가입 승인
- 관리자 / 팀장 / 직원 3단계 권한
- 대시보드 및 규칙 기반 자동 알림
  - 기한 경과 목표
  - 7일 이내 마감 목표
  - 30일 이상 진행률 미갱신
  - 최근 90일 면담 미실시
- 성과관리
  - 기간, 분류, 가중치, 목표값, 현재값, 진행률, 근거자료, 관리자 피드백
  - 검색, 상태 필터, CSV 내보내기
- 면담관리
  - 면담 유형, 상태, 요약, 강점, 우려, 실행합의, 관리자 지원, 다음 면담일
  - 참여자 공개 / 관리자만 공개
- 직원관리
  - 가입 승인, 권한, 부서, 직위, 재직상태, 직속 관리자
- AI 도우미
  - 기본: 프롬프트 복사 후 개인 ChatGPT·Gemini 등에서 사용
  - 선택: 조직 OpenAI API를 Netlify 환경변수에 등록하면 앱 내부 실행
  - 개인 API 키는 브라우저나 DB에 저장하지 않음

## 기술 구조

- Frontend: React, Vite
- Authentication / Database: Supabase
- Hosting: Netlify
- Source: GitHub
- Optional AI: Netlify Function + OpenAI API

배포는 `DEPLOY_GUIDE.md`를 확인하세요.
