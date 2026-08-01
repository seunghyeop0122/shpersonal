-- =========================================================
-- 목표를 "수치 달성형"에서 "체크리스트형"으로 변경
--   목표(title) + 목표 디테일(detail) + 추가한 날짜(created_at) + 완료 체크(is_done)
--
-- 기존 target / current_value / unit 컬럼은 남겨둡니다.
-- (기본값이 있어 새 방식으로 넣을 때 방해가 되지 않고,
--  예전에 입력한 값이 지워지지 않도록 보존)
-- =========================================================

alter table public.goals add column if not exists detail  text;
alter table public.goals add column if not exists is_done boolean not null default false;

-- 예전 방식에서 100% 채워둔 목표는 완료로 간주
update public.goals
   set is_done = true
 where is_done = false
   and target is not null
   and target > 0
   and current_value >= target;

create index if not exists goals_user_period_done_idx
  on public.goals (user_id, period, is_done);
