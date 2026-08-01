/* =========================================================
   SH site — 라우팅 & 렌더링 (ES 모듈, 빌드 도구 없음)
   데이터는 store.js 를 통해 Supabase 또는 예시 데이터에서 가져옵니다.
   ========================================================= */

import {
  state,
  init,
  reload,
  canEdit,
  isSupabaseEnabled,
  isConfigured,
  signInKakao,
  signOut,
  userLabel,
  isEmpty,
  seedFromFiles,
  goalsApi,
  jobsApi,
  companiesApi,
  saveIndustry,
  industryByName
} from './store.js';

/* ---------- 설정 ---------- */

/* 구글 캘린더 embed 주소.
   [바꾸는 방법]
   1) Google 캘린더 → 왼쪽에서 해당 캘린더의 ⋮ → '설정 및 공유'
   2) '액세스 권한' 에서 "공개 사용 설정" 체크 (공개해야 embed 가 보입니다)
   3) 아래로 스크롤 → '캘린더 통합' → "삽입 코드" 안의 iframe src 값을 복사
   4) 아래 CALENDAR_EMBED_URL 값을 그 주소로 교체
   현재 값은 예시용 공개 캘린더(대한민국 공휴일)입니다. */
const CALENDAR_EMBED_URL =
  'https://calendar.google.com/calendar/embed?ctz=Asia%2FSeoul&src=ko.south_korea%23holiday%40group.v.calendar.google.com';

const SCALES = ['대기업', '중견기업', '중소기업', '스타트업', '공기업·공공기관', '외국계'];
const STATUSES = ['진행중', '결과완료'];
const PERIODS = [
  { key: 'daily', label: 'Daily', ko: '일간' },
  { key: 'monthly', label: 'Monthly', ko: '월간' },
  { key: 'quarterly', label: 'Quarterly', ko: '분기' },
  { key: 'yearly', label: 'Yearly', ko: '연간' }
];

/* ---------- 아이콘 ---------- */
const ICONS = {
  home: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/></svg>',
  jobs: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/></svg>',
  companies: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="10" height="18" rx="1.5"/><path d="M14 9h6v12h-6"/><path d="M7 7h4M7 11h4M7 15h4"/></svg>',
  industry: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10l6 4V10l6 4V6l4-2v16z"/></svg>',
  goals: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/></svg>',
  dot: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M6 12h12"/></svg>',
  back: '<svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>'
};

/* ---------- 유틸 ---------- */
function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function byKo(a, b) {
  return String(a).localeCompare(String(b), 'ko');
}

function pct(current, target) {
  const t = Number(target);
  const c = Number(current);
  if (!t || t <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((c / t) * 100)));
}

function progressBar(p) {
  return (
    '<div class="progress-row">' +
      '<div class="progress"><span style="width:' + p + '%"></span></div>' +
      '<div class="progress-value">' + p + '%</div>' +
    '</div>'
  );
}

function dash(v) {
  return v ? esc(v) : '<span class="cell-muted">—</span>';
}

/* 마감일까지 남은 일수 */
function dday(deadline) {
  if (!deadline) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const end = new Date(deadline + 'T00:00:00');
  if (isNaN(end.getTime())) return null;
  return Math.round((end - today) / 86400000);
}

/* 회사 데이터 + 산업 테이블에서 산업군 목록 자동 생성 */
function allIndustries() {
  const set = [];
  state.companies.forEach(function (c) {
    if (c.industry && set.indexOf(c.industry) === -1) set.push(c.industry);
  });
  state.industries.forEach(function (i) {
    if (i.name && set.indexOf(i.name) === -1) set.push(i.name);
  });
  return set.sort(byKo);
}

function sortedCompanies() {
  return state.companies.slice().sort(function (a, b) {
    return byKo(a.name, b.name);
  });
}

function goalsOf(period) {
  return state.goals.filter(function (g) { return g.period === period; });
}

/* 진행률 = 체크된 목표 수 ÷ 전체 목표 수 */
function doneCount(period) {
  return goalsOf(period).filter(function (g) { return g.isDone; }).length;
}

function periodAverage(period) {
  const list = goalsOf(period);
  if (!list.length) return 0;
  return pct(doneCount(period), list.length);
}

/* 'YYYY-MM-DD' 로 표시 (DB의 created_at 은 ISO 문자열) */
function fmtDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return String(value).slice(0, 10);
  const p = function (n) { return n < 10 ? '0' + n : String(n); };
  return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
}

function todayStr() {
  return fmtDate(new Date());
}

/* 목표에 표시할 날짜: 직접 지정한 날짜 우선, 없으면 추가한 날짜 */
function goalDateOf(g) {
  return fmtDate(g.goalDate || g.createdAt);
}

/* 최신순 (날짜 내림차순, 같으면 나중에 추가한 것이 위로) */
function byNewest(a, b) {
  const da = goalDateOf(a);
  const db = goalDateOf(b);
  if (da !== db) return da < db ? 1 : -1;
  const ca = a.createdAt || '';
  const cb = b.createdAt || '';
  if (ca !== cb) return ca < cb ? 1 : -1;
  return 0;
}

function statusBadge(status) {
  const cls = status === '진행중' ? 'badge badge-on' : 'badge badge-done';
  return '<span class="' + cls + '">' + esc(status || '—') + '</span>';
}

function periodMeta(key) {
  return PERIODS.filter(function (p) { return p.key === key; })[0] || null;
}

/* 편집 버튼: 로그인 상태에서만 렌더 */
function btn(act, label, opts) {
  if (!canEdit()) return '';
  const o = opts || {};
  const attrs = Object.keys(o.data || {})
    .map(function (k) { return ' data-' + k + '="' + esc(o.data[k]) + '"'; })
    .join('');
  return (
    '<button type="button" class="btn ' + (o.cls || 'btn-sm') + '" data-act="' + act + '"' + attrs + '>' +
      esc(label) +
    '</button>'
  );
}

/* =========================================================
   모달 / 토스트
   ========================================================= */
function toast(message, isError) {
  const el = document.createElement('div');
  el.className = 'toast' + (isError ? ' is-error' : '');
  el.textContent = message;
  document.body.appendChild(el);
  setTimeout(function () { el.classList.add('is-out'); }, 2200);
  setTimeout(function () { el.remove(); }, 2600);
}

function fieldHtml(f, values) {
  const v = values[f.name] == null ? '' : values[f.name];
  const req = f.required ? ' required' : '';
  let input;

  if (f.type === 'textarea') {
    input =
      '<textarea name="' + f.name + '" rows="' + (f.rows || 4) + '"' + req +
      ' placeholder="' + esc(f.placeholder || '') + '">' + esc(v) + '</textarea>';
  } else if (f.type === 'select') {
    input =
      '<select name="' + f.name + '"' + req + '>' +
        (f.options || []).map(function (opt) {
          return '<option value="' + esc(opt) + '"' + (String(v) === String(opt) ? ' selected' : '') + '>' +
            esc(opt) + '</option>';
        }).join('') +
      '</select>';
  } else {
    const list = f.datalist && f.datalist.length ? ' list="dl-' + f.name + '"' : '';
    input =
      '<input type="' + (f.type || 'text') + '" name="' + f.name + '" value="' + esc(v) + '"' +
      req + list +
      (f.type === 'number' ? ' min="0" step="any"' : '') +
      ' placeholder="' + esc(f.placeholder || '') + '">' +
      (list
        ? '<datalist id="dl-' + f.name + '">' +
            f.datalist.map(function (d) { return '<option value="' + esc(d) + '"></option>'; }).join('') +
          '</datalist>'
        : '');
  }

  return (
    '<label class="field">' +
      '<span class="field-label">' + esc(f.label) + '</span>' +
      input +
      (f.hint ? '<span class="field-hint">' + esc(f.hint) + '</span>' : '') +
    '</label>'
  );
}

/* 폼 모달. onSubmit(values) 가 반환한 프라미스가 성공하면 닫힙니다. */
function openForm(opts) {
  const values = opts.values || {};
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal" role="dialog" aria-modal="true" aria-label="' + esc(opts.title) + '">' +
      '<h3 class="modal-title">' + esc(opts.title) + '</h3>' +
      '<form class="modal-form">' +
        opts.fields.map(function (f) { return fieldHtml(f, values); }).join('') +
        '<p class="modal-err" hidden></p>' +
        '<div class="modal-actions">' +
          '<button type="button" class="btn" data-close>취소</button>' +
          '<button type="submit" class="btn btn-primary">' + esc(opts.submitLabel || '저장') + '</button>' +
        '</div>' +
      '</form>' +
    '</div>';

  document.body.appendChild(overlay);
  const form = overlay.querySelector('form');
  const errEl = overlay.querySelector('.modal-err');
  const submitEl = overlay.querySelector('button[type="submit"]');
  const first = overlay.querySelector('input, textarea, select');
  if (first) first.focus();

  function close() {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }
  document.addEventListener('keydown', onKey);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay || e.target.hasAttribute('data-close')) close();
  });

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    const data = {};
    new FormData(form).forEach(function (val, key) { data[key] = val; });
    errEl.hidden = true;
    submitEl.disabled = true;
    try {
      await opts.onSubmit(data);
      close();
    } catch (err) {
      errEl.textContent = '저장하지 못했습니다: ' + (err && err.message ? err.message : err);
      errEl.hidden = false;
      submitEl.disabled = false;
    }
  });
}

/* 삭제 확인 모달 (브라우저 confirm 대신) */
function openConfirm(message, onOk) {
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML =
    '<div class="modal modal-sm" role="dialog" aria-modal="true">' +
      '<p class="modal-message">' + esc(message) + '</p>' +
      '<p class="modal-err" hidden></p>' +
      '<div class="modal-actions">' +
        '<button type="button" class="btn" data-close>취소</button>' +
        '<button type="button" class="btn btn-danger" data-ok>삭제</button>' +
      '</div>' +
    '</div>';

  document.body.appendChild(overlay);
  const errEl = overlay.querySelector('.modal-err');
  const okEl = overlay.querySelector('[data-ok]');

  function close() {
    document.removeEventListener('keydown', onKey);
    overlay.remove();
  }
  function onKey(e) {
    if (e.key === 'Escape') close();
  }
  document.addEventListener('keydown', onKey);

  overlay.addEventListener('click', function (e) {
    if (e.target === overlay || e.target.hasAttribute('data-close')) close();
  });

  okEl.addEventListener('click', async function () {
    okEl.disabled = true;
    errEl.hidden = true;
    try {
      await onOk();
      close();
    } catch (err) {
      errEl.textContent = '삭제하지 못했습니다: ' + (err && err.message ? err.message : err);
      errEl.hidden = false;
      okEl.disabled = false;
    }
  });
}

/* =========================================================
   사이드바 + 로그인 바
   ========================================================= */
function navConfig() {
  const industryChildren = allIndustries().map(function (name) {
    return { label: name, route: '#/industry/' + encodeURIComponent(name), icon: ICONS.dot };
  });
  const goalChildren = PERIODS.map(function (p) {
    return { label: p.label, route: '#/goals/' + p.key, icon: ICONS.dot };
  });

  return [
    { label: '홈', route: '#/home', icon: ICONS.home },
    { label: '채용공고', route: '#/jobs', icon: ICONS.jobs },
    { label: '지원 회사', route: '#/companies', icon: ICONS.companies },
    { label: '산업 분석', route: '#/industries', icon: ICONS.industry, children: industryChildren },
    { label: '목표 관리', route: '#/goals', icon: ICONS.goals, children: goalChildren }
  ];
}

function isActive(route, hash) {
  if (route === '#/companies') return hash.indexOf('#/companies') === 0 || hash.indexOf('#/company/') === 0;
  if (route === '#/industries') return hash.indexOf('#/industr') === 0;
  if (route === '#/goals') return hash.indexOf('#/goals') === 0;
  if (route === '#/home') return hash === '#/home' || hash === '#/' || hash === '';
  return hash === route;
}

function renderNav(hash) {
  let html = '';
  navConfig().forEach(function (item) {
    const parentActive = isActive(item.route, hash);
    const exactParent =
      hash === item.route ||
      (item.route === '#/home' && (hash === '' || hash === '#/')) ||
      (item.route === '#/companies' && hash.indexOf('#/company/') === 0);

    html +=
      '<a class="nav-item' + (exactParent ? ' is-active' : '') + '" href="' + item.route + '">' +
        '<span class="ico">' + item.icon + '</span>' +
        '<span class="label">' + esc(item.label) + '</span>' +
      '</a>';

    if (item.children && parentActive) {
      item.children.forEach(function (child) {
        const on = hash === child.route;
        html +=
          '<a class="nav-item is-sub' + (on ? ' is-active' : '') + '" href="' + child.route + '">' +
            '<span class="ico">' + child.icon + '</span>' +
            '<span class="label">' + esc(child.label) + '</span>' +
          '</a>';
      });
    }
  });
  document.getElementById('nav').innerHTML = html;
}

function renderAuthbar() {
  const el = document.getElementById('authbar');
  if (!el) return;

  if (!isSupabaseEnabled()) {
    el.innerHTML =
      '<div class="auth-note">예시 데이터 (읽기 전용)<br>' +
      'assets/js/supabase-config.js 를 채우면 로그인이 켜집니다.</div>';
    return;
  }

  if (state.user) {
    el.innerHTML =
      '<div class="auth-user" title="' + esc(userLabel()) + '">' + esc(userLabel()) + '</div>' +
      '<button type="button" class="btn btn-sm btn-block" data-act="signout">로그아웃</button>';
  } else {
    el.innerHTML =
      '<div class="auth-note">예시 데이터 (읽기 전용)</div>' +
      '<button type="button" class="btn btn-sm btn-block btn-kakao" data-act="signin">카카오 로그인</button>';
  }
}

/* 페이지 상단 안내 배너 */
function banner() {
  if (state.notice) {
    return '<div class="banner banner-warn">' + esc(state.notice) + '</div>';
  }
  if (state.source === 'seed') {
    return (
      '<div class="banner">' +
        (isSupabaseEnabled()
          ? '예시 데이터를 보고 있습니다. 왼쪽 아래에서 카카오 로그인하면 내 데이터를 편집할 수 있습니다.'
          : 'Supabase 설정 전이라 예시 데이터를 읽기 전용으로 보여주는 중입니다. README의 설정 순서를 참고하세요.') +
      '</div>'
    );
  }
  return '';
}

/* 제목 + 오른쪽 액션 버튼 */
function pageHead(label, title, desc, actions) {
  return (
    '<div class="page-head">' +
      '<div>' +
        '<div class="page-label">' + esc(label) + '</div>' +
        '<h1 class="page-title">' + esc(title) + '</h1>' +
      '</div>' +
      (actions ? '<div class="page-actions">' + actions + '</div>' : '') +
    '</div>' +
    (desc ? '<p class="page-desc">' + esc(desc) + '</p>' : '')
  );
}

/* =========================================================
   페이지: 홈 (대시보드)
   ========================================================= */
function pageHome() {
  const cards = PERIODS.map(function (p) {
    const total = goalsOf(p.key).length;
    return (
      '<a class="goal-card" href="#/goals/' + p.key + '">' +
        '<div class="card-title">' + p.label + '</div>' +
        '<div class="card-meta">' + p.ko + ' · ' + doneCount(p.key) + ' / ' + total + ' 완료</div>' +
        progressBar(periodAverage(p.key)) +
      '</a>'
    );
  }).join('');

  const seedBtn =
    canEdit() && isEmpty()
      ? '<div class="banner banner-action">' +
          '데이터가 비어 있습니다. 예시 데이터를 넣어 구조를 확인해 보세요. ' +
          '<button type="button" class="btn btn-sm btn-primary" data-act="seed">예시 데이터 불러오기</button>' +
        '</div>'
      : '';

  return (
    pageHead('홈 대시보드', 'SH site', '일정과 목표 진행 상황을 한 화면에서 확인합니다.') +
    banner() +
    seedBtn +

    '<h2 class="section-head first">일정표</h2>' +
    '<div class="calendar-wrap">' +
      '<iframe src="' + esc(CALENDAR_EMBED_URL) + '" title="구글 캘린더" loading="lazy" ' +
      'frameborder="0" scrolling="no"></iframe>' +
    '</div>' +
    '<p class="section-sub" style="margin-top:8px">' +
      '내 캘린더로 바꾸려면 assets/js/app.js 상단의 CALENDAR_EMBED_URL 값을 수정하세요.' +
    '</p>' +

    '<h2 class="section-head">Goals</h2>' +
    '<div class="goal-grid">' + cards + '</div>'
  );
}

/* =========================================================
   페이지: 채용공고
   ========================================================= */
function pageJobs() {
  const rows = state.jobs
    .slice()
    .sort(function (a, b) {
      if (!a.deadline && !b.deadline) return byKo(a.company, b.company);
      if (!a.deadline) return 1;
      if (!b.deadline) return -1;
      return a.deadline < b.deadline ? -1 : 1;
    })
    .map(function (j) {
      const d = dday(j.deadline);
      let deadlineCell;
      if (!j.deadline) {
        deadlineCell = '<span class="badge">상시채용</span>';
      } else {
        const label = d === null ? '' : d < 0 ? '마감' : d === 0 ? 'D-DAY' : 'D-' + d;
        const cls = d !== null && d >= 0 && d <= 7 ? 'badge badge-urgent' : 'badge';
        deadlineCell =
          '<div class="nowrap">' + esc(j.deadline) + '</div>' +
          '<span class="' + cls + '" style="margin-top:4px">' + label + '</span>';
      }

      return (
        '<tr>' +
          '<td class="cell-strong nowrap">' + esc(j.company) + '</td>' +
          '<td>' + esc(j.title) + '</td>' +
          '<td class="nowrap">' + deadlineCell + '</td>' +
          '<td class="cell-memo">' + esc(j.memo) + '</td>' +
          '<td class="nowrap">' +
            (j.link
              ? '<a class="link-out" href="' + esc(j.link) + '" target="_blank" rel="noopener">공고 열기 ↗</a>'
              : '<span class="cell-muted">—</span>') +
          '</td>' +
          (canEdit()
            ? '<td class="nowrap"><div class="row-actions">' +
                btn('job-edit', '수정', { data: { id: j.id } }) +
                btn('job-del', '삭제', { data: { id: j.id }, cls: 'btn-sm btn-quiet' }) +
              '</div></td>'
            : '') +
        '</tr>'
      );
    })
    .join('');

  return (
    pageHead(
      '채용공고',
      '관심 공고',
      '아직 지원하지 않았지만 지켜보고 있는 공고입니다. 지원을 마치면 [지원 회사]에 추가하세요.',
      btn('job-add', '+ 공고 추가', { cls: 'btn-primary btn-sm' })
    ) +
    banner() +
    (state.jobs.length
      ? '<div class="table-wrap"><table class="tbl">' +
          '<thead><tr>' +
            '<th style="width:100px">회사명</th>' +
            '<th style="min-width:190px">공고 제목</th>' +
            '<th style="width:100px">마감일</th>' +
            '<th style="width:200px">메모</th>' +
            '<th style="width:90px">링크</th>' +
            (canEdit() ? '<th style="width:92px"></th>' : '') +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table></div>'
      : '<div class="empty">등록된 공고가 없습니다.</div>')
  );
}

/* =========================================================
   페이지: 지원 회사 (목록 + 필터)
   ========================================================= */
const filterState = { scale: [], industry: [], status: [] };

function chipRow(label, key, options) {
  const selected = filterState[key];
  let html = '<div class="filter-row"><span class="filter-label">' + esc(label) + '</span>';
  html +=
    '<button class="chip' + (selected.length === 0 ? ' is-on' : '') + '" ' +
    'data-filter="' + key + '" data-value="__all__">전체</button>';
  options.forEach(function (opt) {
    const on = selected.indexOf(opt) !== -1;
    html +=
      '<button class="chip' + (on ? ' is-on' : '') + '" ' +
      'data-filter="' + key + '" data-value="' + esc(opt) + '">' + esc(opt) + '</button>';
  });
  return html + '</div>';
}

function matchesFilter(c) {
  const f = filterState;
  if (f.scale.length && f.scale.indexOf(c.scale) === -1) return false;
  if (f.industry.length && f.industry.indexOf(c.industry) === -1) return false;
  if (f.status.length && f.status.indexOf(c.status) === -1) return false;
  return true;
}

function pageCompanies() {
  const usedScales = [];
  state.companies.forEach(function (c) {
    if (c.scale && usedScales.indexOf(c.scale) === -1) usedScales.push(c.scale);
  });
  const scaleOptions = SCALES.concat(
    usedScales.filter(function (s) { return SCALES.indexOf(s) === -1; })
  );

  const list = sortedCompanies().filter(matchesFilter);

  const rows = list
    .map(function (c) {
      return (
        '<tr class="clickable" data-href="#/company/' + encodeURIComponent(c.id) + '">' +
          '<td class="cell-strong nowrap">' + esc(c.name) + '</td>' +
          '<td class="cell-muted nowrap">' + dash(c.industry) + '</td>' +
          '<td class="cell-muted nowrap">' + dash(c.scale) + '</td>' +
          '<td class="nowrap">' + statusBadge(c.status) + '</td>' +
          '<td class="cell-muted nowrap">' + dash(c.schedule && c.schedule.interview) + '</td>' +
          (canEdit()
            ? '<td class="nowrap"><div class="row-actions">' +
                btn('co-edit', '수정', { data: { id: c.id } }) +
                btn('co-del', '삭제', { data: { id: c.id }, cls: 'btn-sm btn-quiet' }) +
              '</div></td>'
            : '') +
        '</tr>'
      );
    })
    .join('');

  return (
    pageHead(
      '지원 회사',
      '지원 현황',
      '회사명 가나다순으로 정렬됩니다. 행을 클릭하면 상세 페이지로 이동합니다.',
      btn('co-add', '+ 회사 추가', { cls: 'btn-primary btn-sm' })
    ) +
    banner() +

    '<div class="filters">' +
      chipRow('규모', 'scale', scaleOptions) +
      chipRow('산업군', 'industry', allIndustries()) +
      chipRow('진행상태', 'status', STATUSES) +
    '</div>' +

    '<div class="result-count">' + list.length + '개 / 전체 ' + state.companies.length + '개</div>' +

    (list.length
      ? '<div class="table-wrap"><table class="tbl">' +
          '<thead><tr>' +
            '<th>회사명</th><th>산업군</th><th>규모</th><th>진행상태</th><th>면접일</th>' +
            (canEdit() ? '<th style="width:96px"></th>' : '') +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table></div>'
      : '<div class="empty">조건에 맞는 회사가 없습니다.</div>')
  );
}

/* =========================================================
   페이지: 회사 상세
   ========================================================= */
const SCHEDULE_LABELS = [
  ['applied', '지원일'],
  ['docResult', '서류 발표'],
  ['interview', '면접일'],
  ['finalResult', '최종 발표']
];

function pageCompanyDetail(id) {
  const c = state.companies.filter(function (x) { return String(x.id) === String(id); })[0];
  if (!c) {
    return (
      '<a class="back-link" href="#/companies">' + ICONS.back + ' 지원 회사</a>' +
      '<h1 class="page-title">찾을 수 없는 회사</h1>' +
      '<p class="page-desc">해당 회사를 찾지 못했습니다.</p>'
    );
  }

  const sched = c.schedule || {};
  const scheduleHtml = SCHEDULE_LABELS.map(function (pair) {
    return '<dt>' + pair[1] + '</dt><dd>' + dash(sched[pair[0]]) + '</dd>';
  }).join('');

  const notes = (c.interviewNotes || []).length
    ? c.interviewNotes
        .map(function (n, idx) {
          const qs = (n.questions || [])
            .map(function (q) { return '<li>' + esc(q) + '</li>'; })
            .join('');
          return (
            '<div class="note-card">' +
              '<div class="note-head">' +
                '<span class="note-round">' + esc(n.round || '면접') + '</span>' +
                '<span class="note-date">' + esc(n.date || '') + '</span>' +
                '<span class="spacer"></span>' +
                btn('note-del', '삭제', { data: { id: c.id, idx: idx }, cls: 'btn-sm btn-quiet' }) +
              '</div>' +
              (qs ? '<ul>' + qs + '</ul>' : '') +
              (n.review ? '<div class="note-review">' + esc(n.review) + '</div>' : '') +
            '</div>'
          );
        })
        .join('')
    : '<div class="empty">아직 기록된 면접 후기가 없습니다.</div>';

  const industryLink = c.industry
    ? '<a class="link-out" href="#/industry/' + encodeURIComponent(c.industry) + '">' +
        esc(c.industry) + ' 산업 분석 보기 →</a>'
    : '';

  function sectionHead(title, actions) {
    return (
      '<div class="section-head-row">' +
        '<h2 class="section-head">' + esc(title) + '</h2>' +
        (actions ? '<div class="section-actions">' + actions + '</div>' : '') +
      '</div>'
    );
  }

  return (
    '<a class="back-link" href="#/companies">' + ICONS.back + ' 지원 회사</a>' +
    banner() +
    '<div class="page-head">' +
      '<div>' +
        '<div class="page-label">' + esc(c.industry || '') + '</div>' +
        '<h1 class="page-title">' + esc(c.name) + '</h1>' +
      '</div>' +
      '<div class="page-actions">' + btn('co-edit', '기본 정보 수정', { data: { id: c.id } }) + '</div>' +
    '</div>' +
    '<div class="meta-row">' +
      statusBadge(c.status) +
      (c.scale ? '<span class="badge">' + esc(c.scale) + '</span>' : '') +
      (c.position ? '<span class="badge">' + esc(c.position) + '</span>' : '') +
    '</div>' +

    sectionHead('지원 상태 / 일정', btn('co-sched', '일정 수정', { data: { id: c.id } })) +
    '<dl class="kv">' +
      '<dt>진행상태</dt><dd>' + esc(c.status || '—') + '</dd>' +
      '<dt>세부 단계</dt><dd>' + dash(c.stage) + '</dd>' +
      scheduleHtml +
    '</dl>' +

    sectionHead('회사 분석', btn('co-text', '수정', { data: { id: c.id, field: 'companyAnalysis' } })) +
    (c.companyAnalysis
      ? '<p class="prose">' + esc(c.companyAnalysis) + '</p>'
      : '<div class="empty">아직 작성 전입니다.</div>') +

    sectionHead('산업 분석', btn('co-text', '수정', { data: { id: c.id, field: 'industryAnalysis' } })) +
    (c.industryAnalysis
      ? '<p class="prose">' + esc(c.industryAnalysis) + '</p>'
      : '<div class="empty">아직 작성 전입니다.</div>') +
    (industryLink ? '<p style="margin-top:10px">' + industryLink + '</p>' : '') +

    sectionHead('면접 후기 / 질문 정리', btn('note-add', '+ 후기 추가', { data: { id: c.id } })) +
    notes
  );
}

/* =========================================================
   페이지: 산업 분석
   ========================================================= */
function pageIndustries() {
  const items = allIndustries();
  const list = items
    .map(function (name) {
      const count = state.companies.filter(function (c) { return c.industry === name; }).length;
      const written = industryByName(name) ? '작성됨' : '작성 전';
      return (
        '<a class="card-link" href="#/industry/' + encodeURIComponent(name) + '">' +
          '<span>' +
            '<span class="cl-title">' + esc(name) + '</span><br>' +
            '<span class="cl-sub">등록 기업 ' + count + '개 · 분석 ' + written + '</span>' +
          '</span>' +
          '<span class="cl-sub">→</span>' +
        '</a>'
      );
    })
    .join('');

  return (
    pageHead(
      '산업 분석',
      '산업군',
      '지원 회사에 등록된 산업군에서 자동으로 생성됩니다. 새 산업군을 쓰면 이 목록과 사이드바에 자동으로 추가됩니다.'
    ) +
    banner() +
    (items.length ? '<div class="card-link-list">' + list + '</div>' : '<div class="empty">등록된 산업군이 없습니다.</div>')
  );
}

function pageIndustryDetail(name) {
  const data = industryByName(name) || {};
  const members = sortedCompanies().filter(function (c) { return c.industry === name; });

  if (!members.length && !industryByName(name)) {
    return (
      '<a class="back-link" href="#/industries">' + ICONS.back + ' 산업 분석</a>' +
      '<h1 class="page-title">' + esc(name) + '</h1>' +
      '<div class="empty">이 산업군에 해당하는 데이터가 없습니다.</div>'
    );
  }

  const section = function (title, text) {
    return (
      '<h2 class="section-head">' + title + '</h2>' +
      (text
        ? '<p class="prose">' + esc(text) + '</p>'
        : '<div class="empty">아직 작성 전입니다.</div>')
    );
  };

  const compareRows = members
    .map(function (c) {
      const summary = (c.companyAnalysis || '').split('\n')[0];
      return (
        '<tr class="clickable" data-href="#/company/' + encodeURIComponent(c.id) + '">' +
          '<td class="cell-strong nowrap">' + esc(c.name) + '</td>' +
          '<td class="cell-muted nowrap">' + dash(c.scale) + '</td>' +
          '<td class="nowrap">' + statusBadge(c.status) + '</td>' +
          '<td class="cell-memo">' + esc(summary) + '</td>' +
        '</tr>'
      );
    })
    .join('');

  const compareTable = members.length
    ? '<div class="table-wrap"><table class="tbl">' +
        '<thead><tr><th>회사명</th><th>규모</th><th>진행상태</th><th>한 줄 요약</th></tr></thead>' +
        '<tbody>' + compareRows + '</tbody>' +
      '</table></div>'
    : '<div class="empty">이 산업군에 등록된 지원 회사가 없습니다.</div>';

  return (
    '<a class="back-link" href="#/industries">' + ICONS.back + ' 산업 분석</a>' +
    banner() +
    '<div class="page-head">' +
      '<div>' +
        '<div class="page-label">산업 분석</div>' +
        '<h1 class="page-title">' + esc(name) + '</h1>' +
      '</div>' +
      '<div class="page-actions">' + btn('ind-edit', '분석 수정', { data: { name: name } }) + '</div>' +
    '</div>' +
    '<p class="page-desc">등록 기업 ' + members.length + '개</p>' +

    section('산업 개요', data.overview) +
    section('트렌드 · 이슈', data.trends) +

    '<h2 class="section-head">주요 기업 비교</h2>' +
    (data.comparison ? '<p class="prose" style="margin-bottom:16px">' + esc(data.comparison) + '</p>' : '') +
    compareTable +

    section('취업 관점 시사점', data.implications)
  );
}

/* =========================================================
   페이지: 목표 관리 (요약)
   ========================================================= */
function pageGoalsOverview() {
  const rows = PERIODS.map(function (p) {
    const list = goalsOf(p.key);
    return (
      '<a class="summary-row" href="#/goals/' + p.key + '">' +
        '<span class="summary-name">' + p.label +
          '<span class="summary-sub">' + p.ko + ' · ' + doneCount(p.key) + ' / ' + list.length + ' 완료</span>' +
        '</span>' +
        progressBar(periodAverage(p.key)) +
      '</a>'
    );
  }).join('');

  return (
    pageHead('목표 관리', 'Goals', '체크한 목표 수를 기준으로 계산된 진행률입니다. 줄을 클릭하면 해당 기간 페이지로 이동합니다.') +
    banner() +
    '<div class="summary-list">' + rows + '</div>'
  );
}

/* =========================================================
   페이지: 기간별 목표 (추가/수정/삭제)
   ========================================================= */
function pageGoalPeriod(periodKey) {
  const meta = periodMeta(periodKey);
  if (!meta) {
    return (
      '<a class="back-link" href="#/goals">' + ICONS.back + ' 목표 관리</a>' +
      '<h1 class="page-title">알 수 없는 기간</h1>'
    );
  }

  const list = goalsOf(meta.key).slice().sort(byNewest); // 최신순

  const goalRow = function (g) {
    const date = goalDateOf(g);
    return (
      '<div class="goal-row' + (g.isDone ? ' is-done' : '') + '">' +
        '<input type="checkbox" class="goal-check"' +
          (g.isDone ? ' checked' : '') +
          (canEdit()
            ? ' data-act="goal-toggle" data-id="' + esc(g.id) + '"'
            : ' disabled') +
          ' aria-label="' + esc(g.title) + ' 완료">' +
        '<div class="goal-body">' +
          '<div class="goal-row-top">' +
            '<span class="goal-name">' + esc(g.title) + '</span>' +
            (canEdit()
              ? '<span class="goal-controls">' +
                  btn('goal-edit', '수정', { data: { id: g.id } }) +
                  btn('goal-del', '삭제', { data: { id: g.id }, cls: 'btn-sm btn-quiet' }) +
                '</span>'
              : '') +
          '</div>' +
          (date ? '<div class="goal-date">' + esc(date) + '</div>' : '') +
          (g.detail ? '<p class="goal-detail">' + esc(g.detail) + '</p>' : '') +
        '</div>' +
      '</div>'
    );
  };

  const listHtml = function (items, emptyText) {
    return items.length
      ? '<div class="goal-list">' + items.map(goalRow).join('') + '</div>'
      : '<div class="empty">' + esc(emptyText) + '</div>';
  };

  /* 왼쪽 미완료 / 오른쪽 완료 두 칸 (모든 기간 공통) */
  const todo = list.filter(function (g) { return !g.isDone; });
  const done = list.filter(function (g) { return g.isDone; });
  const rows =
    '<div class="goal-columns">' +
      '<section class="goal-column">' +
        '<h2 class="column-head">미완료 <span class="column-count">' + todo.length + '</span></h2>' +
        listHtml(todo, '남은 목표가 없습니다.') +
      '</section>' +
      '<section class="goal-column">' +
        '<h2 class="column-head">완료 <span class="column-count">' + done.length + '</span></h2>' +
        listHtml(done, '아직 완료한 목표가 없습니다.') +
      '</section>' +
    '</div>';

  return (
    '<a class="back-link" href="#/goals">' + ICONS.back + ' 목표 관리</a>' +
    banner() +
    '<div class="page-head">' +
      '<div>' +
        '<div class="page-label">목표 관리</div>' +
        '<h1 class="page-title">' + meta.label + ' <span class="title-sub">· ' + meta.ko + '</span></h1>' +
      '</div>' +
      '<div class="page-actions">' +
        btn('goal-add', '+ 목표 추가', { data: { period: meta.key }, cls: 'btn-primary btn-sm' }) +
      '</div>' +
    '</div>' +

    '<div class="period-summary">' +
      '<span class="period-summary-label">' + doneCount(meta.key) + ' / ' + list.length + ' 완료</span>' +
      progressBar(periodAverage(meta.key)) +
    '</div>' +

    rows
  );
}

/* =========================================================
   액션 (추가 / 수정 / 삭제)
   ========================================================= */
function goalFields() {
  return [
    { name: 'title', label: '목표', required: true, placeholder: '예: 알고리즘 문제 풀기' },
    { name: 'goalDate', label: '날짜', type: 'date', hint: '비워두면 추가한 날짜로 표시됩니다' },
    {
      name: 'detail',
      label: '목표 디테일',
      type: 'textarea',
      rows: 10,
      placeholder: '어떻게 할 것인지, 무엇을 기준으로 완료로 볼 것인지 자유롭게 적어두세요.'
    }
  ];
}

function jobFields() {
  return [
    { name: 'company', label: '회사명', required: true },
    { name: 'title', label: '공고 제목' },
    { name: 'link', label: '공고 링크', placeholder: 'https://' },
    { name: 'deadline', label: '마감일', type: 'date', hint: '상시채용이면 비워 두세요' },
    { name: 'memo', label: '메모', type: 'textarea', rows: 3 }
  ];
}

function companyFields() {
  return [
    { name: 'name', label: '회사명', required: true },
    { name: 'industry', label: '산업군', datalist: allIndustries(), placeholder: '예: IT, 금융' },
    { name: 'scale', label: '규모', type: 'select', options: [''].concat(SCALES) },
    { name: 'status', label: '진행상태', type: 'select', options: STATUSES },
    { name: 'stage', label: '세부 단계', placeholder: '예: 1차 면접 대기' },
    { name: 'position', label: '지원 직무' }
  ];
}

async function toggleGoal(id) {
  const g = goalsApi.get(id);
  if (!g) return;
  const prev = !!g.isDone;

  g.isDone = !prev; // 낙관적 업데이트
  render();
  try {
    await goalsApi.update(id, { isDone: !prev });
  } catch (err) {
    g.isDone = prev;
    render();
    toast('저장하지 못했습니다: ' + (err.message || err), true);
  }
}

async function handleAction(el) {
  const act = el.getAttribute('data-act');
  const id = el.getAttribute('data-id');

  /* ---- 인증 ---- */
  if (act === 'signin') {
    try {
      await signInKakao();
    } catch (err) {
      toast(err.message || String(err), true);
    }
    return;
  }
  if (act === 'enter') {
    setEntered(true);
    render();
    return;
  }
  if (act === 'signout') {
    setEntered(false);
    await signOut();
    return;
  }
  if (act === 'seed') {
    el.disabled = true;
    try {
      await seedFromFiles();
      render();
      toast('예시 데이터를 넣었습니다.');
    } catch (err) {
      el.disabled = false;
      toast('실패: ' + (err.message || err), true);
    }
    return;
  }

  /* ---- 목표 ---- */
  if (act === 'goal-toggle') return toggleGoal(id);

  if (act === 'goal-add') {
    const period = el.getAttribute('data-period');
    const meta = periodMeta(period);
    openForm({
      title: (meta ? meta.label + ' ' : '') + '목표 추가',
      fields: goalFields(),
      values: { goalDate: todayStr() },
      onSubmit: async function (v) {
        await goalsApi.create({
          period: period,
          title: v.title,
          goalDate: v.goalDate,
          detail: v.detail,
          isDone: false
        });
        render();
        toast('목표를 추가했습니다.');
      }
    });
    return;
  }

  if (act === 'goal-edit') {
    const g = goalsApi.get(id);
    if (!g) return;
    openForm({
      title: '목표 수정',
      fields: goalFields(),
      values: g,
      onSubmit: async function (v) {
        await goalsApi.update(id, { title: v.title, goalDate: v.goalDate, detail: v.detail });
        render();
        toast('저장했습니다.');
      }
    });
    return;
  }

  if (act === 'goal-del') {
    const g = goalsApi.get(id);
    if (!g) return;
    openConfirm('"' + g.title + '" 목표를 삭제할까요?', async function () {
      await goalsApi.remove(id);
      render();
      toast('삭제했습니다.');
    });
    return;
  }

  /* ---- 채용공고 ---- */
  if (act === 'job-add') {
    openForm({
      title: '공고 추가',
      fields: jobFields(),
      onSubmit: async function (v) {
        await jobsApi.create(v);
        render();
        toast('공고를 추가했습니다.');
      }
    });
    return;
  }

  if (act === 'job-edit') {
    const j = jobsApi.get(id);
    if (!j) return;
    openForm({
      title: '공고 수정',
      fields: jobFields(),
      values: j,
      onSubmit: async function (v) {
        await jobsApi.update(id, v);
        render();
        toast('저장했습니다.');
      }
    });
    return;
  }

  if (act === 'job-del') {
    const j = jobsApi.get(id);
    if (!j) return;
    openConfirm('"' + j.company + ' — ' + (j.title || '') + '" 공고를 삭제할까요?', async function () {
      await jobsApi.remove(id);
      render();
      toast('삭제했습니다.');
    });
    return;
  }

  /* ---- 지원 회사 ---- */
  if (act === 'co-add') {
    openForm({
      title: '회사 추가',
      fields: companyFields(),
      values: { status: '진행중' },
      onSubmit: async function (v) {
        await companiesApi.create(v);
        render();
        toast('회사를 추가했습니다.');
      }
    });
    return;
  }

  if (act === 'co-edit') {
    const c = companiesApi.get(id);
    if (!c) return;
    openForm({
      title: '기본 정보 수정',
      fields: companyFields(),
      values: c,
      onSubmit: async function (v) {
        await companiesApi.update(id, v);
        render();
        toast('저장했습니다.');
      }
    });
    return;
  }

  if (act === 'co-del') {
    const c = companiesApi.get(id);
    if (!c) return;
    openConfirm('"' + c.name + '"을(를) 삭제할까요? 면접 후기까지 함께 지워집니다.', async function () {
      await companiesApi.remove(id);
      if (location.hash.indexOf('#/company/') === 0) location.hash = '#/companies';
      else render();
      toast('삭제했습니다.');
    });
    return;
  }

  if (act === 'co-sched') {
    const c = companiesApi.get(id);
    if (!c) return;
    openForm({
      title: '일정 수정',
      fields: SCHEDULE_LABELS.map(function (pair) {
        return { name: pair[0], label: pair[1], type: 'date' };
      }),
      values: c.schedule || {},
      onSubmit: async function (v) {
        const schedule = {};
        SCHEDULE_LABELS.forEach(function (pair) {
          if (v[pair[0]]) schedule[pair[0]] = v[pair[0]];
        });
        await companiesApi.update(id, { schedule: schedule });
        render();
        toast('저장했습니다.');
      }
    });
    return;
  }

  if (act === 'co-text') {
    const c = companiesApi.get(id);
    if (!c) return;
    const field = el.getAttribute('data-field');
    const label = field === 'companyAnalysis' ? '회사 분석' : '산업 분석';
    openForm({
      title: label + ' 수정',
      fields: [{ name: 'text', label: label, type: 'textarea', rows: 12 }],
      values: { text: c[field] || '' },
      onSubmit: async function (v) {
        const patch = {};
        patch[field] = v.text;
        await companiesApi.update(id, patch);
        render();
        toast('저장했습니다.');
      }
    });
    return;
  }

  if (act === 'note-add') {
    const c = companiesApi.get(id);
    if (!c) return;
    openForm({
      title: '면접 후기 추가',
      fields: [
        { name: 'round', label: '전형', required: true, placeholder: '예: 1차 기술면접' },
        { name: 'date', label: '날짜', type: 'date' },
        { name: 'questions', label: '질문', type: 'textarea', rows: 5, hint: '한 줄에 하나씩 적어주세요' },
        { name: 'review', label: '후기', type: 'textarea', rows: 5 }
      ],
      onSubmit: async function (v) {
        const note = {
          round: v.round,
          date: v.date || '',
          questions: String(v.questions || '')
            .split('\n')
            .map(function (s) { return s.trim(); })
            .filter(Boolean),
          review: v.review || ''
        };
        const notes = (c.interviewNotes || []).concat([note]);
        await companiesApi.update(id, { interviewNotes: notes });
        render();
        toast('후기를 추가했습니다.');
      }
    });
    return;
  }

  if (act === 'note-del') {
    const c = companiesApi.get(id);
    if (!c) return;
    const idx = Number(el.getAttribute('data-idx'));
    const target = (c.interviewNotes || [])[idx];
    openConfirm('"' + ((target && target.round) || '면접 후기') + '" 기록을 삭제할까요?', async function () {
      const notes = (c.interviewNotes || []).filter(function (_n, i) { return i !== idx; });
      await companiesApi.update(id, { interviewNotes: notes });
      render();
      toast('삭제했습니다.');
    });
    return;
  }

  /* ---- 산업 분석 ---- */
  if (act === 'ind-edit') {
    const name = el.getAttribute('data-name');
    const data = industryByName(name) || {};
    openForm({
      title: name + ' 분석 수정',
      fields: [
        { name: 'overview', label: '산업 개요', type: 'textarea', rows: 5 },
        { name: 'trends', label: '트렌드 · 이슈', type: 'textarea', rows: 5 },
        { name: 'comparison', label: '주요 기업 비교(메모)', type: 'textarea', rows: 4, hint: '비워두면 등록된 회사 표만 표시됩니다' },
        { name: 'implications', label: '취업 관점 시사점', type: 'textarea', rows: 5 }
      ],
      values: data,
      onSubmit: async function (v) {
        await saveIndustry(name, v);
        render();
        toast('저장했습니다.');
      }
    });
    return;
  }
}

/* =========================================================
   로그인 화면 (게이트)
   ========================================================= */
/* 로그인 후 "사이트로 들어가기"를 눌렀는지 (탭 단위로 기억) */
const ENTERED_KEY = 'sh-entered';

function hasEntered() {
  try {
    return sessionStorage.getItem(ENTERED_KEY) === '1';
  } catch (e) {
    return true; // sessionStorage를 못 쓰는 환경이면 환영 화면을 건너뜁니다
  }
}

function setEntered(v) {
  try {
    if (v) sessionStorage.setItem(ENTERED_KEY, '1');
    else sessionStorage.removeItem(ENTERED_KEY);
  } catch (e) { /* 무시 */ }
}

/* 1단계: 로그인 화면 */
function loginHtml() {
  return (
    '<div class="gate-card">' +
      '<div class="gate-brand">' +
        '<span class="site-mark"></span>' +
        '<span class="gate-title">SH site</span>' +
      '</div>' +
      '<p class="gate-desc">취업 준비 기록을 보려면 로그인해 주세요.</p>' +
      '<button type="button" class="btn btn-kakao gate-btn" data-act="signin">카카오로 로그인</button>' +
      (state.notice ? '<p class="gate-note gate-error">' + esc(state.notice) + '</p>' : '') +
      '<p class="gate-note">본인 계정으로만 열람할 수 있습니다.</p>' +
    '</div>'
  );
}

/* 2단계: 환영 화면 */
function welcomeHtml() {
  const meta = (state.user && state.user.user_metadata) || {};
  const avatar = meta.avatar_url || meta.picture || '';
  const total = state.goals.length;
  const done = state.goals.filter(function (g) { return g.isDone; }).length;

  return (
    '<div class="gate-card gate-welcome">' +
      (avatar
        ? '<img class="gate-avatar" src="' + esc(avatar) + '" alt="" referrerpolicy="no-referrer">'
        : '<div class="gate-avatar gate-avatar-blank"></div>') +
      '<p class="gate-hello">환영합니다</p>' +
      '<p class="gate-username">' + esc(userLabel()) + '님</p>' +
      (total
        ? '<p class="gate-summary">목표 ' + total + '개 중 ' + done + '개 완료</p>'
        : '<p class="gate-summary">오늘의 목표를 등록해 보세요</p>') +
      '<button type="button" class="btn btn-primary gate-btn" data-act="enter">사이트로 들어가기</button>' +
      '<button type="button" class="gate-link" data-act="signout">다른 계정으로 로그인</button>' +
    '</div>'
  );
}

function gateHtml(mode) {
  if (mode === 'loading') {
    return (
      '<div class="gate-card">' +
        '<div class="gate-brand">' +
          '<span class="site-mark"></span>' +
          '<span class="gate-title">SH site</span>' +
        '</div>' +
        '<p class="gate-desc">불러오는 중…</p>' +
      '</div>'
    );
  }
  return mode === 'welcome' ? welcomeHtml() : loginHtml();
}

/* 어떤 화면을 보여줄지 판단
   - 설정 전(로컬 개발 등)에는 예시 데이터를 그대로 보여준다
   - 로그인 전 → 로그인 화면 / 로그인 직후 → 환영 화면 */
function gateMode() {
  if (!isConfigured()) return null;
  if (!state.ready) return 'loading';
  if (!state.user) {
    setEntered(false);
    return 'login';
  }
  return hasEntered() ? null : 'welcome';
}

/* =========================================================
   라우터
   ========================================================= */
function render() {
  const gate = document.getElementById('gate');
  const layout = document.getElementById('layout');
  const mode = gateMode();

  if (mode) {
    gate.innerHTML = gateHtml(mode);
    gate.hidden = false;
    layout.hidden = true;
    return;
  }

  gate.hidden = true;
  gate.innerHTML = '';
  layout.hidden = false;

  const hash = location.hash || '#/home';
  const view = document.getElementById('view');
  let html = '';
  let focusPeriod = null;

  if (hash === '#/' || hash === '#/home' || hash === '') {
    html = pageHome();
  } else if (hash === '#/jobs') {
    html = pageJobs();
  } else if (hash === '#/companies') {
    html = pageCompanies();
  } else if (hash.indexOf('#/company/') === 0) {
    html = pageCompanyDetail(decodeURIComponent(hash.slice('#/company/'.length)));
  } else if (hash === '#/industries') {
    html = pageIndustries();
  } else if (hash.indexOf('#/industry/') === 0) {
    html = pageIndustryDetail(decodeURIComponent(hash.slice('#/industry/'.length)));
  } else if (hash === '#/goals') {
    html = pageGoalsOverview();
  } else if (hash.indexOf('#/goals/') === 0) {
    focusPeriod = hash.slice('#/goals/'.length);
    html = pageGoalPeriod(focusPeriod);
  } else {
    html =
      '<div class="page-label">404</div>' +
      '<h1 class="page-title">페이지를 찾을 수 없습니다</h1>' +
      '<p class="page-desc"><a class="link-out" href="#/home">홈으로 돌아가기</a></p>';
  }

  view.innerHTML = html;
  renderNav(hash);
  renderAuthbar();
}

/* ---------- 이벤트 위임 ---------- */
document.addEventListener('click', function (e) {
  const actEl = e.target.closest('[data-act]');
  if (actEl) {
    e.preventDefault();
    e.stopPropagation();
    handleAction(actEl);
    return;
  }

  const chip = e.target.closest('.chip');
  if (chip) {
    const key = chip.getAttribute('data-filter');
    const value = chip.getAttribute('data-value');
    if (key) {
      if (value === '__all__') {
        filterState[key] = [];
      } else {
        const arr = filterState[key];
        const i = arr.indexOf(value);
        if (i === -1) arr.push(value);
        else arr.splice(i, 1);
      }
      render();
    }
    return;
  }

  const row = e.target.closest('[data-href]');
  if (row) {
    location.hash = row.getAttribute('data-href');
  }
});

window.addEventListener('hashchange', function () {
  render();
  window.scrollTo(0, 0);
});

/* ---------- 시작 ---------- */
(async function bootstrap() {
  if (!location.hash) location.hash = '#/home';

  if (isConfigured()) {
    render(); // 로그인 확인 전에는 로딩 화면
  } else {
    await reload(); // 설정 전이면 예시 데이터로 바로 렌더
    render();
  }

  await init(function () { render(); });
  render();
})();
