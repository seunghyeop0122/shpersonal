# CLAUDE.md

Claude Code가 이 저장소에서 작업할 때 참고하는 문서입니다.
(사용법·설정 순서는 `README.md` 에 있습니다. 여기에는 **작업 규칙**만 적습니다.)

## 프로젝트

취업 준비용 개인 사이트. **빌드 도구 없는 순수 HTML/CSS/JS + Supabase**.
목표·채용공고·지원 회사·산업 분석을 사이트에서 직접 추가/수정하고, 카카오 로그인한
본인만 볼 수 있습니다.

- 저장소: `github.com/seunghyeop0122/shpersonal`
- 운영: `https://shpersonal.vercel.app` (`/` 로그인 → `/app.html` 본문)
- Supabase 프로젝트 ref: `koepswciicunwiiffmkz`

## 파일 구조

| 파일 | 역할 |
|---|---|
| `index.html` | 로그인 페이지. 1단계 카카오 로그인 → 2단계 환영 화면 |
| `app.html` | 사이트 본문. 세션 없으면 `./` 로 되돌림 |
| `assets/js/login.js` | 로그인 페이지 전용 렌더링 |
| `assets/js/app.js` | 해시 라우터 · 전 페이지 렌더링 · 편집 UI |
| `assets/js/store.js` | 데이터 레이어. Supabase CRUD + 인증 + 예시 데이터 폴백 |
| `assets/js/supabase-config.js` | Project URL / anon key |
| `data/*.js` | 예시 데이터. 설정 전 화면과 "예시 데이터 불러오기"에 쓰임 |
| `supabase/migrations/*.sql` | DB 스키마 |

## 배포 파이프라인

```
git push ─┬─▶ Vercel   : 정적 사이트 자동 재배포
          └─▶ Supabase : supabase/migrations/*.sql 자동 적용
```

목표·공고 같은 **일상 데이터는 push 불필요** — 사이트에서 고치면 DB에 바로 저장됩니다.
push가 필요한 것은 코드와 스키마뿐입니다.

## 작업 규칙

**스키마 변경**은 대시보드에서 직접 하지 말고 `supabase/migrations/` 에 새 파일로 추가합니다.
파일명은 타임스탬프 순(`20260803000000_설명.sql`). 재실행돼도 안전하도록
`if not exists` / `drop policy if exists` 를 씁니다.

**키 취급** — `anon` 키는 공개용이라 커밋해도 됩니다(방어선은 RLS).
`service_role` 키, DB 비밀번호, Kakao Client Secret은 **저장소·코드·대화 어디에도 넣지 않습니다.**

**데이터 접근**은 `store.js` 의 `goalsApi` / `jobsApi` / `companiesApi` / `saveIndustry` 를 씁니다.
매핑은 snake_case ↔ camelCase이고, `map.*.out()` 은 **전달된 키만** 내보내는 patch 방식이라
부분 수정 시 다른 필드가 지워지지 않습니다.

**편집 UI**는 `app.js` 의 `openForm()` / `openConfirm()` / `toast()` 를 재사용합니다.
브라우저 `alert` / `confirm` 은 쓰지 않습니다(자체 모달 사용).

**진행률**은 "체크한 목표 수 ÷ 전체 목표 수"입니다. 홈 카드·목표 요약·기간 페이지가 모두
`periodAverage()` / `doneCount()` 를 씁니다.

## 로컬 실행

ES 모듈이라 `file://` 로는 안 열립니다.

```bash
cd job-prep-site
python -m http.server 8765
# → http://127.0.0.1:8765
```

이 주소는 Supabase Redirect URLs에 등록돼 있어 로컬에서도 로그인됩니다.

## 검증 방법

1. 로컬 서버로 띄우고 브라우저에서 확인 (콘솔 에러 0건)
2. `git push`
3. 반영 확인:
   ```bash
   curl -s https://shpersonal.vercel.app/assets/js/app.js | grep -c "바뀐-코드-일부"
   curl -s -H "apikey: <anon>" "https://koepswciicunwiiffmkz.supabase.co/rest/v1/goals?select=id&limit=1"
   ```

## 겪었던 함정

- **`[hidden]` 은 `display:flex` 를 못 이깁니다.** 숨김을 확인할 땐 속성이 아니라
  computed style을 봐야 합니다. (`style.css` 에 `[hidden]{display:none!important}` 를 넣어둠)
- **브라우저가 JS 모듈을 캐시합니다.** 변경 확인 시 hard reload 또는 `?v=` 쿼리를 붙이세요.
- **카카오 로그인은 `account_email` scope를 항상 요청합니다.** 클라이언트에서 줄일 수 없으니
  카카오 동의항목에 이메일이 설정돼 있어야 합니다(KOE205 원인).
- **"JWT issued at future"** 는 시계 문제가 아니라 브라우저에 남은 세션 토큰 문제입니다.
  현재는 이런 오류가 나면 자동 로그아웃 후 재로그인을 안내합니다.
