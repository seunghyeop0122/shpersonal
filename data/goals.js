/* =========================================================
   목표 데이터
   ---------------------------------------------------------
   필드
   - id     : 고유값
   - period : 'daily' | 'monthly' | 'quarterly' | 'yearly'
   - title  : 목표 이름
   - target : 목표치 (숫자)
   - current: 현재치 (숫자)
   - unit   : 단위 (예: '문제', '개', '시간')

   진행률(%)은 current / target 으로 자동 계산됩니다.
   (홈 대시보드의 카드 4개도 이 값들의 평균으로 자동 계산)
   ========================================================= */

const GOALS = [
  // --- Daily ---
  { id: 'd1', period: 'daily',     title: '알고리즘 문제 풀기',        target: 3,    current: 2,   unit: '문제' },
  { id: 'd2', period: 'daily',     title: '기술 면접 질문 정리',       target: 5,    current: 5,   unit: '개' },

  // --- Monthly ---
  { id: 'm1', period: 'monthly',   title: '입사 지원',                 target: 10,   current: 4,   unit: '건' },
  { id: 'm2', period: 'monthly',   title: '포트폴리오 프로젝트 커밋',   target: 60,   current: 27,  unit: '커밋' },
  { id: 'm3', period: 'monthly',   title: '기업 분석 리포트 작성',      target: 4,    current: 2,   unit: '개' },

  // --- Quarterly ---
  { id: 'q1', period: 'quarterly', title: '최종 면접까지 진출',         target: 3,    current: 1,   unit: '회' },
  { id: 'q2', period: 'quarterly', title: '사이드 프로젝트 배포',       target: 2,    current: 1,   unit: '개' },

  // --- Yearly ---
  { id: 'y1', period: 'yearly',    title: '최종 합격',                 target: 1,    current: 0,   unit: '곳' },
  { id: 'y2', period: 'yearly',    title: '기술 블로그 글 쓰기',        target: 24,   current: 9,   unit: '편' }
];
