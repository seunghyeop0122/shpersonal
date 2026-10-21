-- =========================================================
-- 기록 노트 (주식 / 잡생각·아이디어)
--   날짜 · 제목 · 내용만 있는 간단한 기록. kind 로 카테고리를 나눈다.
--     kind : 'stock'(주식) | 'idea'(잡생각 + 아이디어)
-- =========================================================

create table if not exists public.notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  kind text not null check (kind in ('stock', 'idea')),
  note_date date not null default current_date,
  title text not null,
  body text,
  created_at timestamptz not null default now()
);

create index if not exists notes_user_kind_date_idx on public.notes (user_id, kind, note_date desc);

alter table public.notes enable row level security;

drop policy if exists "own rows" on public.notes;
create policy "own rows" on public.notes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
