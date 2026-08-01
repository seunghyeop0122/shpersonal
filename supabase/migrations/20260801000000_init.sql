-- =========================================================
-- SH site 초기 스키마
-- Supabase ↔ GitHub 연동을 쓰면 이 파일이 저장소에 머지될 때
-- 자동으로 적용됩니다. (SQL Editor에 직접 붙여넣어도 결과는 같습니다)
-- =========================================================

create extension if not exists pgcrypto;

-- ---------- 목표 ----------
create table if not exists public.goals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  period text not null check (period in ('daily','monthly','quarterly','yearly')),
  title text not null,
  target numeric not null default 1,
  current_value numeric not null default 0,
  unit text default '',
  created_at timestamptz not null default now()
);

-- ---------- 관심 채용공고 ----------
create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  company text not null,
  title text,
  link text,
  deadline date,
  memo text,
  created_at timestamptz not null default now()
);

-- ---------- 지원 회사 ----------
create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  industry text,
  scale text,
  status text default '진행중',
  stage text,
  position text,
  schedule jsonb not null default '{}'::jsonb,
  company_analysis text,
  industry_analysis text,
  interview_notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

-- ---------- 산업 분석 ----------
create table if not exists public.industries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null,
  overview text,
  trends text,
  comparison text,
  implications text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- ---------- 조회 성능 ----------
create index if not exists goals_user_period_idx     on public.goals (user_id, period);
create index if not exists jobs_user_idx             on public.jobs (user_id);
create index if not exists companies_user_idx        on public.companies (user_id);
create index if not exists industries_user_idx       on public.industries (user_id);

-- ---------- RLS: 로그인한 본인 행만 ----------
alter table public.goals      enable row level security;
alter table public.jobs       enable row level security;
alter table public.companies  enable row level security;
alter table public.industries enable row level security;

drop policy if exists "own rows" on public.goals;
drop policy if exists "own rows" on public.jobs;
drop policy if exists "own rows" on public.companies;
drop policy if exists "own rows" on public.industries;

create policy "own rows" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.companies
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.industries
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
