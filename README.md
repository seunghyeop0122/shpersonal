# SH site — 취업 준비 개인 사이트

빌드 도구 없이 순수 HTML / CSS / JS로 만든 사이트입니다.
데이터는 **Supabase**에 저장하고, 브라우저에서 바로 추가·수정·삭제할 수 있습니다.
로그인(카카오) 전에는 `data/*.js`의 예시 데이터를 읽기 전용으로 보여줍니다.

## 폴더 구조

```
.
├── index.html
├── .nojekyll
├── assets/
│   ├── css/style.css
│   └── js/
│       ├── supabase-config.js   # ← Supabase URL / anon key (여기만 채우면 됨)
│       ├── store.js             # 데이터 레이어 (Supabase CRUD + 예시 데이터 폴백)
│       └── app.js               # 라우팅 · 렌더링 · 편집 UI
├── data/                        # 예시 데이터 (로그인 전 화면 / 초기 데이터 넣기용)
│   ├── companies.js  industries.js  jobs.js  goals.js
├── supabase/
│   └── migrations/              # DB 스키마 (GitHub 연동 시 자동 적용)
│       └── 20260801000000_init.sql
└── README.md
```

## 페이지

| 메뉴 | 주소 | 편집 가능한 것 |
|---|---|---|
| 홈 | `#/home` | (구글 캘린더 + 기간별 진행률 카드) |
| 채용공고 | `#/jobs` | 공고 추가 · 수정 · 삭제 |
| 지원 회사 | `#/companies` | 회사 추가 · 수정 · 삭제 |
| 회사 상세 | `#/company/:id` | 기본 정보, 일정, 회사/산업 분석, 면접 후기 |
| 산업 분석 | `#/industries` → `#/industry/:이름` | 4개 섹션 본문 |
| 목표 관리 | `#/goals` → `#/goals/daily` 등 | 목표 추가 · 수정 · 삭제, 체크박스로 완료 표시 |

산업군 목록은 지원 회사의 `산업군` 값에서 자동으로 생성됩니다 — 새 산업군을 쓰면
사이드바와 목록에 자동으로 늘어납니다.

---

## 1. Supabase 설정 (최초 1회)

### 1-1. 테이블 만들기

**Supabase를 GitHub에 연결해 둔 경우** — 같은 SQL이 이미
`supabase/migrations/20260801000000_init.sql` 에 들어 있습니다.
저장소에 push 하면 Supabase가 이 마이그레이션을 적용합니다.
(연동이 아직 동작하지 않으면 아래 SQL을 SQL Editor에 붙여넣어도 결과는 같습니다 —
같은 파일 내용이며, `if not exists` / `drop policy if exists` 라서 두 번 실행해도 안전합니다.)

**직접 실행하는 경우** — Supabase 대시보드 → **SQL Editor** → 아래를 붙여넣고 Run.

```sql
create extension if not exists pgcrypto;

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

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  company text not null, title text, link text, deadline date, memo text,
  created_at timestamptz not null default now()
);

create table if not exists public.companies (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null, industry text, scale text, status text default '진행중',
  stage text, position text,
  schedule jsonb not null default '{}'::jsonb,
  company_analysis text, industry_analysis text,
  interview_notes jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.industries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users on delete cascade,
  name text not null, overview text, trends text, comparison text, implications text,
  created_at timestamptz not null default now(),
  unique (user_id, name)
);

-- RLS: 로그인한 본인 행만 읽고 쓸 수 있음
alter table public.goals      enable row level security;
alter table public.jobs       enable row level security;
alter table public.companies  enable row level security;
alter table public.industries enable row level security;

create policy "own rows" on public.goals      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.jobs       for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.companies  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "own rows" on public.industries for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

이후 스키마 변경분은 `supabase/migrations/` 에 파일로 쌓입니다. SQL Editor에서 직접
만드는 경우에는 그 폴더의 파일들도 **번호 순서대로** 실행해 주세요.
(현재: `20260801000000_init.sql` → `20260802000000_goals_checklist.sql`)

### 1-2. 카카오 로그인 연결
1. [Kakao Developers](https://developers.kakao.com) → 내 애플리케이션 → **애플리케이션 추가하기**
2. 좌측 **카카오 로그인** → 활성화 ON
3. **Redirect URI** 등록: `https://<프로젝트ref>.supabase.co/auth/v1/callback`
   (`<프로젝트ref>`는 Supabase 프로젝트 URL 앞부분)
4. 좌측 **보안** → Client Secret 생성 후 활성화
5. **동의항목**에서 닉네임(원하면 이메일) 수집 설정
6. Supabase → **Authentication → Providers → Kakao** 활성화 →
   REST API 키를 Client ID에, 위 Client Secret을 붙여넣고 저장
7. Supabase → **Authentication → URL Configuration** →
   - Site URL: 배포 주소 (예: `https://sh-site.vercel.app`)
   - Redirect URLs: 배포 주소와 `http://127.0.0.1:8765` 추가

### 1-3. 키 채우기
Supabase → **Project Settings → Data API**에서 Project URL과 `anon` `public` 키를 복사해
`assets/js/supabase-config.js`에 붙여넣습니다.

```js
window.SUPABASE_CONFIG = {
  url: 'https://xxxxxxxx.supabase.co',
  anonKey: 'eyJhbGciOi...'
};
```

> anon 키는 공개돼도 되는 키입니다. 실제 방어선은 위의 RLS 정책이고,
> 그 정책 때문에 **로그인하지 않으면 아무것도 읽거나 쓸 수 없습니다.**

### 1-4. 첫 데이터 넣기
사이트에서 카카오 로그인 → 홈에 뜨는 **"예시 데이터 불러오기"** 버튼을 누르면
`data/*.js`의 예시가 그대로 DB에 들어갑니다. 이후 사이트에서 자유롭게 고치면 됩니다.

---

## 2. 로컬에서 실행

`app.js`가 ES 모듈이라 `index.html`을 더블클릭(`file://`)하면 동작하지 않습니다.
간단한 로컬 서버를 띄우세요.

```bash
cd job-prep-site
python -m http.server 8765
# → http://127.0.0.1:8765
```

로그인 없이 열면 예시 데이터가 읽기 전용으로 보입니다.

---

## 3. 저장소 · Vercel · Supabase 연결 상태에서의 작업 흐름

세 개가 모두 GitHub 저장소에 묶여 있으면, **모든 변경의 출발점은 저장소**가 됩니다.

```
로컬 파일 수정 ──push──▶ GitHub ─┬─▶ Vercel   : 정적 사이트 자동 재배포
                                 └─▶ Supabase : supabase/migrations/*.sql 적용
```

### 3-1. 파일을 저장소에 올리기 (최초 1회)

```bash
cd C:\Users\sengh\job-prep-site
git init
git add .
git commit -m "Add SH site"
git branch -M main
git remote add origin https://github.com/<유저명>/<저장소명>.git
git push -u origin main      # 저장소에 이미 커밋이 있으면 먼저 git pull --rebase origin main
```

### 3-2. Vercel 설정
- Framework Preset **Other**, Build Command·Output Directory는 **비워 둡니다** (빌드가 없는 정적 사이트)
- 사이트 파일이 저장소 하위 폴더에 있다면 Project Settings → **Root Directory**를 그 폴더로 지정
- 배포 후 도메인을 Supabase **Authentication → URL Configuration**에 등록
  - Site URL: 운영 도메인
  - Redirect URLs: 운영 도메인 + `http://127.0.0.1:8765`
  - 미리보기(Preview) 배포에서도 로그인하려면 `https://*.vercel.app` 같은 와일드카드도 추가

### 3-3. 스키마 변경은 SQL Editor 대신 마이그레이션 파일로
연동을 걸어둔 상태에서 대시보드에서 직접 테이블을 고치면 저장소와 실제 DB가 어긋납니다.
컬럼을 추가할 일이 생기면 새 파일을 만들어 push 하세요.

```
supabase/migrations/20260815120000_add_memo_to_goals.sql
```
```sql
alter table public.goals add column if not exists memo text;
```

CLI를 쓰면 로컬에서 직접 적용할 수도 있습니다.

```bash
npx supabase link --project-ref <프로젝트ref>
npx supabase db push
```

> Supabase의 PR 미리보기 브랜치(Branching)는 유료 플랜 기능일 수 있습니다.
> 대시보드에서 켜지지 않으면 위 `db push` 방식으로 운영하면 됩니다.

### 3-4. anon 키는 저장소에 커밋해도 됩니다
`assets/js/supabase-config.js`의 anon 키는 브라우저에 노출되는 것을 전제로 만들어진 공개 키이고,
실제 방어선은 RLS입니다. 빌드 단계가 없어서 Vercel 환경변수를 주입할 방법도 없으므로 그대로 커밋합니다.

**절대 커밋하면 안 되는 것**: `service_role` 키, DB 비밀번호, Kakao **Client Secret**.
이 셋은 Supabase 대시보드와 Kakao 콘솔에만 두세요.

### 3-5. 이후 반복 작업

```bash
git add -A && git commit -m "..." && git push
```
push 하면 Vercel이 재배포하고, 마이그레이션이 있으면 Supabase에 반영됩니다.
**목표·공고·회사 같은 일상 데이터는 push가 필요 없습니다** — 사이트에서 바로 고치면 DB에 저장됩니다.

<details>
<summary>GitHub Pages로도 배포하려면</summary>

저장소 `Settings` → `Pages` → Source `Deploy from a branch`,
Branch `main` / `/ (root)` → `https://<유저명>.github.io/<저장소명>/`.
경로가 모두 상대경로 + 해시 라우팅이라 하위 경로에서도 그대로 동작합니다.
이 주소도 Supabase의 Redirect URLs에 추가해야 로그인이 됩니다.
</details>

---

## 4. 자주 하는 변경

**구글 캘린더 바꾸기** — `assets/js/app.js` 상단 `CALENDAR_EMBED_URL`
(Google 캘린더 → 설정 및 공유 → 공개 사용 설정 체크 → 캘린더 통합 → 삽입 코드의 `src`)

**사이트를 누구나 볼 수 있게(읽기만) 공개하기** — SQL Editor에서 테이블마다 실행:

```sql
drop policy "own rows" on public.goals;
create policy "public read" on public.goals for select using (true);
create policy "owner write" on public.goals for insert with check (auth.uid() = user_id);
create policy "owner update" on public.goals for update using (auth.uid() = user_id);
create policy "owner delete" on public.goals for delete using (auth.uid() = user_id);
```

**예시 데이터 수정** — `data/*.js`. 로그인 전 화면과 "예시 데이터 불러오기"에 쓰입니다.
