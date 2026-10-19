-- =========================================================
-- 채용공고 피드 (자동 수집)
--   GitHub Actions 의 scripts/fetch_jobs.py 가 매일 사람인 오픈 API에서
--   관심 직무의 신입 공채를 모아 이 테이블에 upsert 한다.
--
--   · 공개 채용 정보라 사용자별로 나누지 않는다(user_id 없음).
--   · 읽기: 로그인한 사용자만. 쓰기: 정책 없음 → service_role(수집 스크립트)만 가능.
--   · (source, source_id) 로 중복을 막고, 수집 때마다 최신 내용으로 갱신한다.
--   · 관심 공고로 저장하면 기존 public.jobs 에 복사된다(사이트에서 처리).
-- =========================================================

create table if not exists public.job_postings (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'saramin',
  source_id text not null,
  company text not null,
  title text not null,
  url text,
  categories text[] not null default '{}',
  job_type text,
  experience text,
  education text,
  location text,
  industry text,
  posted_at timestamptz,
  deadline timestamptz,
  close_type text,
  fetched_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (source, source_id)
);

create index if not exists job_postings_deadline_idx on public.job_postings (deadline);

alter table public.job_postings enable row level security;

drop policy if exists "read when signed in" on public.job_postings;
create policy "read when signed in" on public.job_postings
  for select to authenticated using (true);
