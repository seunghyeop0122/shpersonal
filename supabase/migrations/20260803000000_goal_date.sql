-- =========================================================
-- 목표에 날짜(goal_date) 추가
--   목표 추가 폼에서 직접 지정할 수 있는 날짜.
--   비워두면 추가한 날짜(created_at)를 대신 표시합니다.
-- =========================================================

alter table public.goals add column if not exists goal_date date;

-- 기존 목표는 추가한 날짜를 그대로 채워둡니다
update public.goals
   set goal_date = created_at::date
 where goal_date is null;

create index if not exists goals_user_period_date_idx
  on public.goals (user_id, period, goal_date desc);
