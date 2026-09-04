/* =========================================================
   SNS 기획 데이터 (예시)
   ---------------------------------------------------------
   실제 데이터는 SNS_Vault 볼트에서 동기화 스크립트가 채웁니다.
   이 파일은 로그인 전(예시) 화면에서 레이아웃을 보여주기 위한
   가짜 데이터입니다. (실제 기획 내용은 절대 여기에 넣지 않습니다)

   필드
   - id           : 고유값
   - slug         : 볼트 파일명 기반 키
   - concept      : 성형 | 모발 | 사후관리 | 피부과
   - platform     : threads | xhs
   - direction    : 방향
   - subjectCode  : 소재코드 (S__)
   - angleCode    : 앵글코드 (A__)
   - hook         : 훅 (목록에서 제목처럼 쓰임)
   - conclusion   : 결론
   - body         : 본문
   - planDate     : 'YYYY-MM-DD' (시간순 정렬 기준)
   - status       : '컨펌대기' | '발행완료'
   - likes/comments/dms : 반응 수치
   ========================================================= */

const SNS_POSTS = [
  {
    id: 's1',
    slug: '2026-08-13_S22xA6_threads',
    concept: '성형',
    platform: 'threads',
    direction: '3',
    subjectCode: 'S22',
    angleCode: 'A6',
    hook: '아직도 성형하고 그냥 가?',
    conclusion: '사후관리 없는 성형은 반쪽짜리다',
    body: '(예시) 본문 미리보기 텍스트입니다.',
    planDate: '2026-08-13',
    status: '발행완료',
    likes: 128,
    comments: 24,
    dms: 9
  },
  {
    id: 's2',
    slug: '2026-08-30_S01xA2_threads',
    concept: '성형',
    platform: 'threads',
    direction: '1',
    subjectCode: 'S01',
    angleCode: 'A2',
    hook: '비싼 데가 잘하는 덴 줄 알았는데, 견적서 보면 완전 반대더라',
    conclusion: '견적서는 총액이 아니라 항목 개수와 맨 아랫줄에서 갈린다',
    body: '(예시) 본문 미리보기 텍스트입니다.',
    planDate: '2026-08-30',
    status: '컨펌대기',
    likes: 0,
    comments: 0,
    dms: 0
  },
  {
    id: 's3',
    slug: '2026-08-30_S12xA3_threads',
    concept: '모발',
    platform: 'threads',
    direction: '2',
    subjectCode: 'S12',
    angleCode: 'A3',
    hook: '모발이식 잘못 고르면 티가 이렇게 난다',
    conclusion: '헤어라인 디자인이 8할이다',
    body: '(예시) 본문 미리보기 텍스트입니다.',
    planDate: '2026-08-30',
    status: '컨펌대기',
    likes: 0,
    comments: 0,
    dms: 0
  }
];
