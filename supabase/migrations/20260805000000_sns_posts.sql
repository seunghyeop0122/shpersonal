-- =========================================================
-- SNS 기획 (샤홍슈/스레드 콘텐츠)
--   SNS_Vault 볼트의 기획 md(04_컨펌대기 / 05_발행완료)를
--   동기화 스크립트가 이 테이블로 밀어넣는다.
--
--   필드 소유권이 둘로 나뉜다:
--   · 볼트 소유(동기화가 갱신): concept, platform, direction,
--       subject_code, angle_code, hook, conclusion, body,
--       plan_date, source_folder, source_file
--   · 사이트 소유(동기화가 손대지 않음): status, likes, comments, dms
--
--   slug = 볼트 파일명 기반 안정 키. (user_id, slug) 로 중복을 막고
--   동기화는 이 키로 있으면 갱신, 없으면 추가한다.
-- =========================================================

create table if not exists public.sns_posts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  slug text not null,
  concept text,
  platform text,
  direction text,
  subject_code text,
  angle_code text,
  hook text,
  conclusion text,
  body text,
  plan_date date,
  source_folder text,
  source_file text,
  status text not null default '컨펌대기',
  likes integer not null default 0,
  comments integer not null default 0,
  dms integer not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, slug)
);

create index if not exists sns_posts_user_date_idx
  on public.sns_posts (user_id, plan_date desc);

alter table public.sns_posts enable row level security;

drop policy if exists "own rows" on public.sns_posts;
create policy "own rows" on public.sns_posts
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
