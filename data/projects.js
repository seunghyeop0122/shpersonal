/* =========================================================
   프로젝트 데이터 (예시)
   ---------------------------------------------------------
   필드
   - id          : 고유값
   - name        : 프로젝트 이름
   - description : 프로젝트 설명 (여러 줄 가능)
   - status      : '진행중' | '보류' | '완료'
   - startedOn   : 시작일 'YYYY-MM-DD' (선택)
   - dueOn       : 마감일 'YYYY-MM-DD' (선택)
   - tasks       : 태스크 배열
       { id, title, status, priority, due, memo }
         status   : 'todo'(진행 전) | 'doing'(진행 중) | 'done'(완료)
         priority : 'high'(높음) | 'mid'(중간) | 'low'(낮음) | '' (없음)
         due      : 마감일 'YYYY-MM-DD' (선택)

   진행률(%)은 "완료 태스크 수 ÷ 전체 태스크 수"로 자동 계산됩니다.
   ========================================================= */

const PROJECTS = [
  {
    id: 'p1',
    name: '포트폴리오 웹사이트',
    description: '취업용 개인 포트폴리오 사이트. 배포까지 끝내고 README에 아키텍처 정리.',
    status: '진행중',
    startedOn: '2026-08-20',
    dueOn: '2026-09-15',
    tasks: [
      { id: 't1', title: '메인 페이지 레이아웃', status: 'done', priority: 'high', due: '2026-08-25', memo: '반응형까지 완료' },
      { id: 't2', title: '프로젝트 상세 페이지', status: 'doing', priority: 'high', due: '2026-09-05', memo: '' },
      { id: 't3', title: 'Vercel 배포 및 도메인 연결', status: 'todo', priority: 'mid', due: '2026-09-10', memo: '' },
      { id: 't4', title: '반응형 QA', status: 'doing', priority: 'low', due: '', memo: '모바일 사파리 이슈 확인 필요' }
    ]
  },
  {
    id: 'p2',
    name: '자격증 스터디',
    description: '2학기 목표 자격증 준비. 주 3회 스터디 + 기출 정리.',
    status: '진행중',
    startedOn: '2026-08-01',
    dueOn: '2026-11-30',
    tasks: [
      { id: 't1', title: '개념 강의 1회독', status: 'done', priority: 'mid', due: '2026-08-31', memo: '' },
      { id: 't2', title: '기출 5개년 정리', status: 'doing', priority: 'high', due: '2026-10-15', memo: '' },
      { id: 't3', title: '모의고사 3회', status: 'todo', priority: 'mid', due: '2026-11-20', memo: '' }
    ]
  }
];
