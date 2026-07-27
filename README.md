# My Job Prep Site

취업 준비 현황을 정리하는 개인 정적 사이트 초안입니다.

## 구조
- `index.html` : 지원 회사 목록 (산업군 필터)
- `company.html` : 회사별 상세 (회사/산업 분석, 지원 상태·일정, 면접 후기)
- `resume.html` : 이력 (아직 예시 텍스트, 내용 전달 시 반영 예정)
- `calendar.html` : 구글 캘린더 embed (현재 예시 캘린더로 설정됨)
- `data/companies.js` : 회사 데이터 (여기만 수정하면 목록·상세 페이지에 자동 반영)
- `css/style.css`, `js/app.js` : 공통 스타일/렌더링 로직

## 로컬에서 확인하기
폴더 안의 `index.html`을 더블클릭해서 브라우저로 열면 바로 확인 가능합니다 (서버 불필요).

## GitHub Pages로 배포하기
1. GitHub에서 새 저장소 생성 (예: `my-job-prep`)
2. 이 `job-site` 폴더 안의 파일들을 저장소 루트에 업로드/푸시
3. 저장소 Settings → Pages → Branch를 `main` (또는 `master`) / `root`로 설정 후 저장
4. 몇 분 후 `https://<사용자명>.github.io/my-job-prep/` 에서 접속 가능

## 다음에 이어서 요청할 때
- "옵시디언에서 정리한 [회사명] 노트 첨부했어. 데이터에 추가해줘" → `companies.js`에 항목 추가
- "이력 페이지에 이 이력서 내용 반영해줘" → `resume.html` 갱신
- "구글 캘린더 embed 주소 이걸로 바꿔줘: (URL)" → `calendar.html`의 iframe src 교체

## 참고 (한계)
현재 이 사이트는 완전 정적(파일 기반)이라 별도 로그인 없이 누구나 URL을 알면 접근 가능합니다.
비공개로 전환하고 싶은 페이지가 생기면 별도로 알려주세요(예: 인증이 가능한 호스팅으로 전환 필요).
