/* =========================================================
   채용공고 피드 (예시)
   ---------------------------------------------------------
   실제 데이터는 scripts/fetch_jobs.py 가 매일 사람인 API에서 수집해
   Supabase job_postings 테이블에 채웁니다. 이 파일은 로그인 전(예시)
   화면용 가짜 데이터입니다.

   필드: id, company, title, url, categories[], jobType, experience,
         education, location, deadline('YYYY-MM-DD'), closeType
   ========================================================= */

const JOB_POSTINGS = [
  {
    id: 'jp1',
    company: '예시상사',
    title: '2026 하반기 신입사원 공개채용 (해외영업/구매)',
    url: 'https://www.saramin.co.kr',
    categories: ['해외영업', '구매·조달'],
    jobType: '정규직',
    experience: '신입',
    education: '대학교졸업(4년)이상',
    location: '서울 > 중구',
    deadline: '2026-10-22',
    closeType: '접수마감일'
  },
  {
    id: 'jp2',
    company: '예시식품',
    title: '신입 구매 담당자 채용',
    url: 'https://www.saramin.co.kr',
    categories: ['구매·조달'],
    jobType: '정규직',
    experience: '신입',
    education: '대학교졸업(4년)이상',
    location: '서울 > 중구',
    deadline: '2026-10-31',
    closeType: '접수마감일'
  },
  {
    id: 'jp3',
    company: '예시전자',
    title: '[신입] 글로벌 마케팅 · 사업기획',
    url: 'https://www.saramin.co.kr',
    categories: ['마케팅·브랜드', '사업기획·상사'],
    jobType: '정규직',
    experience: '신입·경력',
    education: '대학교졸업(4년)이상',
    location: '경기 > 수원시',
    deadline: '2026-11-07',
    closeType: '접수마감일'
  }
];
