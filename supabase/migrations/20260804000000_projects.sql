-- =========================================================
-- 프로젝트 관리
--   프로젝트별로 태스크를 모아 진행 상황을 확인합니다.
--   태스크는 프로젝트 행 안의 jsonb 배열로 저장합니다
--   (면접 후기(interview_notes)와 같은 방식).
--   태스크 객체: { id, title, status, priority, due, memo }
--     status   : 'todo' | 'doing' | 'done' | 'blocked'
--     priority : 'high' | 'mid'  | 'low'  | ''
-- =========================================================

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  description text,
  status text default '진행중',
  started_on date,
  due_on date,
  tasks jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists projects_user_idx on public.projects (user_id);

alter table public.projects enable row level security;

drop policy if exists "own rows" on public.projects;
create policy "own rows" on public.projects
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
