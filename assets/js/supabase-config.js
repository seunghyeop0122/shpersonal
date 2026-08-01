/* =========================================================
   Supabase 연결 설정
   ---------------------------------------------------------
   Supabase 대시보드 → 왼쪽 Project Settings → Data API 에서
   Project URL 과 anon(public) key 를 복사해 아래에 붙여넣으세요.

   ※ anon 키는 브라우저에 노출되는 것이 정상입니다(공개용 키).
     실제 방어선은 RLS 정책이며, README의 SQL을 실행해 두면
     로그인한 본인 외에는 아무것도 읽거나 쓸 수 없습니다.

   ※ 값을 채우기 전까지는 사이트가 data/*.js 의 예시 데이터를
     읽기 전용으로 보여줍니다.
   ========================================================= */

window.SUPABASE_CONFIG = {
  url: 'https://YOUR-PROJECT-REF.supabase.co',
  anonKey: 'YOUR-ANON-KEY'
};
