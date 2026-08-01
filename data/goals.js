/* =========================================================
   목표 데이터 (예시)
   ---------------------------------------------------------
   필드
   - id     : 고유값
   - period : 'daily' | 'monthly' | 'quarterly' | 'yearly'
   - title  : 목표
   - detail : 목표 디테일 (여러 줄 가능)
   - isDone : 완료 체크 여부 (생략하면 false)

   진행률(%)은 "체크된 목표 수 ÷ 전체 목표 수"로 자동 계산됩니다.
   추가한 날짜는 DB에 저장될 때 자동으로 기록됩니다.
   ========================================================= */

const GOALS = [
  // --- Daily ---
  {
    id: 'd1',
    period: 'daily',
    title: '알고리즘 문제 풀기',
    detail: '하루 3문제. 그래프·DP 위주로 풀고, 틀린 문제는 다음 날 다시 풀어보기.',
    isDone: false
  },
  {
    id: 'd2',
    period: 'daily',
    title: '기술 면접 질문 정리',
    detail: '오늘 공부한 내용에서 예상 질문 5개를 뽑아 노션에 정리.',
    isDone: true
  },

  // --- Monthly ---
  {
    id: 'm1',
    period: 'monthly',
    title: '입사 지원 10곳',
    detail: '관심 공고 페이지에 모아둔 공고 중 마감 임박순으로 지원. 자소서는 회사별로 최소 1문항씩 새로 쓰기.',
    isDone: false
  },
  {
    id: 'm2',
    period: 'monthly',
    title: '포트폴리오 프로젝트 마무리',
    detail: '배포까지 끝내고 README에 아키텍처 다이어그램 추가. 성능 개선 전후 수치를 기록해 둘 것.',
    isDone: false
  },
  {
    id: 'm3',
    period: 'monthly',
    title: '기업 분석 리포트 작성',
    detail: '지원한 회사마다 사업 구조 · 최근 이슈 · 지원 동기를 한 장으로 정리.',
    isDone: true
  },

  // --- Quarterly ---
  {
    id: 'q1',
    period: 'quarterly',
    title: '최종 면접까지 진출하기',
    detail: '서류에서 떨어지는 패턴을 분석해 이력서 구조를 한 번 갈아엎기.',
    isDone: false
  },
  {
    id: 'q2',
    period: 'quarterly',
    title: '사이드 프로젝트 배포',
    detail: '실사용자를 받아볼 수 있는 수준까지. 최소한 지인 5명에게 피드백 받기.',
    isDone: true
  },

  // --- Yearly ---
  {
    id: 'y1',
    period: 'yearly',
    title: '최종 합격',
    detail: '가고 싶은 산업군을 좁히고, 그 안에서 준비 방향을 일관되게 유지하기.',
    isDone: false
  },
  {
    id: 'y2',
    period: 'yearly',
    title: '기술 블로그 꾸준히 쓰기',
    detail: '2주에 한 편. 배운 것보다 "왜 그렇게 했는지"를 남기는 데 집중.',
    isDone: false
  }
];
