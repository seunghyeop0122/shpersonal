/* =========================================================
   채용공고 데이터 (아직 지원하지 않은, 관심 공고)
   ---------------------------------------------------------
   필드
   - id       : 고유값
   - company  : 회사명
   - title    : 공고 제목
   - link     : 공고 링크 (URL)
   - deadline : 마감일 'YYYY-MM-DD' (상시채용이면 '' 로 두면 됨)
   - memo     : 메모

   * 지원을 완료하면 이 배열에서 지우고, companies.js 에
     같은 회사 객체를 추가하면 [지원 회사]로 옮겨집니다.
   ========================================================= */

const JOBS = [
  {
    id: 'job-line-be',
    company: '라인',
    title: '2026 신입 백엔드 개발자 채용',
    link: 'https://careers.linecorp.com/',
    deadline: '2026-08-14',
    memo: '자소서 4문항. 코딩테스트 8/20 예정. 일본 근무 옵션 확인 필요.'
  },
  {
    id: 'job-hyundai-data',
    company: '현대자동차',
    title: '데이터 사이언티스트 (신입/경력)',
    link: 'https://talent.hyundai.com/',
    deadline: '2026-08-31',
    memo: '차량 주행 데이터 분석 직무. 포트폴리오 제출 필수 — 시계열 프로젝트 정리해서 넣기.'
  },
  {
    id: 'job-kbstar-it',
    company: 'KB국민은행',
    title: 'IT 부문 신입행원 채용',
    link: 'https://omni.kbstar.com/',
    deadline: '2026-09-05',
    memo: '필기(NCS+전공) 있음. 금융 IT라 도메인 스터디 병행 필요.'
  },
  {
    id: 'job-coupang-fe',
    company: '쿠팡',
    title: 'Frontend Engineer, Retail',
    link: 'https://www.coupang.jobs/',
    deadline: '',
    memo: '상시채용. 영문 이력서 필요. 지원 전에 레퍼런스 정리할 것.'
  }
];
