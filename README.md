# 성과·면담 관리 시스템 V2

설치나 빌드가 필요 없는 정적 웹앱입니다.

## 기능
- 관리자 대시보드
- 성과목표 등록/삭제/검색
- 직원별 진행률 자동 집계
- 면담 기록 및 후속 실행 관리
- 직원 관리
- CSV 내보내기
- 모바일 반응형 화면
- 브라우저 localStorage 자동 저장

## GitHub 업로드
압축을 푼 뒤 `index.html`, `app.js`, `styles.css` 등 내부 파일을 저장소 최상단에 올립니다.

## GitHub Pages
Settings > Pages > Deploy from a branch > main / root 선택

## Netlify
ZIP을 Netlify Deploys 화면에 그대로 드래그하면 즉시 배포됩니다.

## 중요
현재 버전의 데이터는 사용자 브라우저에만 저장됩니다. 기관 공용 운영 및 로그인 기능은 Supabase 연동이 필요합니다.
