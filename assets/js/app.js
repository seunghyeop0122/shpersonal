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
  projectsApi,
  snsPostsApi,
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
/* 지원 회사 진행상태 (전형 순서대로) */
const STATUSES = ['서류 지원', '서류 탈락', '서류 합격', '인적성·필기', '1차 면접', '2차 면접', '최종 면접', '최종 합격', '최종 탈락'];
const PERIODS = [
  { key: 'daily', label: 'Daily', ko: '일간' },
  { key: 'monthly', label: 'Monthly', ko: '월간' },
  { key: 'quarterly', label: 'Quarterly', ko: '분기' },
  { key: 'yearly', label: 'Yearly', ko: '연간' }
];

/* 프로젝트 진행 상태 */
const PROJECT_STATUSES = ['진행중', '보류', '완료'];

/* 태스크 상태 (클릭하면 이 순서로 순환) */
const TASK_STATUSES = [
  { key: 'todo', label: '진행 전', cls: 'ts-todo' },
  { key: 'doing', label: '진행 중', cls: 'ts-doing' },
  { key: 'done', label: '완료', cls: 'ts-done' }
];

/* 태스크 우선순위 */
const PRIORITIES = [
  { key: '', label: '—', cls: 'pr-none' },
  { key: 'high', label: '높음', cls: 'pr-high' },
  { key: 'mid', label: '중간', cls: 'pr-mid' },
  { key: 'low', label: '낮음', cls: 'pr-low' }
];

/* SNS 기획 컨셉은 고정하지 않고, 동기화된 데이터에서 자동으로 뽑습니다
   (산업 분석이 회사 데이터에서 산업군을 뽑는 방식과 동일). snsConcepts() 참고. */

/* 플랫폼 표시 이름 */
const PLATFORM_LABELS = { threads: 'Threads', xhs: '샤홍슈', 小红书: '샤홍슈' };

/* ---------- 아이콘 ---------- */
const ICONS = {
  home: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V20h14V9.5"/></svg>',
  jobs: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7"/></svg>',
  companies: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="10" height="18" rx="1.5"/><path d="M14 9h6v12h-6"/><path d="M7 7h4M7 11h4M7 15h4"/></svg>',
  industry: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 20V10l6 4V10l6 4V6l4-2v16z"/></svg>',
  goals: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3.5"/></svg>',
  projects: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><path d="M3 9h18"/><path d="M7.5 13h5M7.5 16.5h8"/></svg>',
  sns: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.5A2.5 2.5 0 0 1 5.5 6h6L17 3v13l-5.5-3h-6A2.5 2.5 0 0 1 3 10.5z"/><path d="M20 8c1 1.2 1 4.8 0 6"/></svg>',
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

/* 합격 = 초록, 탈락 = 회색, 그 외(진행 중인 전형) = 파랑 */
function statusBadge(status) {
  const cls =
    status === '최종 합격' ? 'badge badge-pass' :
    /탈락/.test(status || '') ? 'badge badge-done' : 'badge badge-on';
  return '<span class="' + cls + '">' + esc(status || '—') + '</span>';
}

function periodMeta(key) {
  return PERIODS.filter(function (p) { return p.key === key; })[0] || null;
}

/* ---------- 프로젝트 ---------- */
function uid() {
  return 't' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

function taskStatusMeta(key) {
  if (key === 'blocked') key = 'doing'; // 예전 '막힘' 데이터는 진행 중으로 표시
  return TASK_STATUSES.filter(function (s) { return s.key === key; })[0] || TASK_STATUSES[0];
}

function priorityMeta(key) {
  return PRIORITIES.filter(function (p) { return p.key === (key || ''); })[0] || PRIORITIES[0];
}

function tasksOf(project) {
  return Array.isArray(project && project.tasks) ? project.tasks : [];
}

function projectDone(project) {
  return tasksOf(project).filter(function (t) { return t.status === 'done'; }).length;
}

function projectProgress(project) {
  const list = tasksOf(project);
  if (!list.length) return 0;
  return pct(projectDone(project), list.length);
}

function sortedProjects() {
  const rank = { '진행중': 0, '보류': 1, '완료': 2 };
  return state.projects.slice().sort(function (a, b) {
    const ra = rank[a.status] == null ? 0 : rank[a.status];
    const rb = rank[b.status] == null ? 0 : rank[b.status];
    if (ra !== rb) return ra - rb;
    return byKo(a.name, b.name);
  });
}

function projectById(id) {
  return state.projects.filter(function (x) { return String(x.id) === String(id); })[0] || null;
}

function priorityBadge(key) {
  const m = priorityMeta(key);
  if (!m.key) return '<span class="cell-muted">—</span>';
  return '<span class="tbadge ' + m.cls + '">' + esc(m.label) + '</span>';
}

function projectStatusBadge(status) {
  const cls =
    status === '완료' ? 'badge badge-done' :
    status === '보류' ? 'badge' : 'badge badge-on';
  return '<span class="' + cls + '">' + esc(status || '진행중') + '</span>';
}

/* ---------- SNS 기획 ---------- */
/* 시간순(오름차순): plan_date → 같은 날짜면 추가한 순서 */
function snsSorted() {
  return state.snsPosts.slice().sort(function (a, b) {
    const da = a.planDate || '';
    const db = b.planDate || '';
    if (da !== db) return da < db ? -1 : 1;
    const ca = a.createdAt || '';
    const cb = b.createdAt || '';
    if (ca !== cb) return ca < cb ? -1 : 1;
    return 0;
  });
}

function snsByConcept(concept) {
  const list = snsSorted();
  return concept ? list.filter(function (p) { return p.concept === concept; }) : list;
}

/* 동기화된 글에서 실제 쓰인 컨셉을 자동 추출 (가나다순) */
function snsConcepts() {
  const set = [];
  state.snsPosts.forEach(function (p) {
    if (p.concept && set.indexOf(p.concept) === -1) set.push(p.concept);
  });
  return set.sort(byKo);
}

function conceptBadge(concept) {
  if (!concept) return '';
  const idx = snsConcepts().indexOf(concept);
  const n = (idx < 0 ? 0 : idx % 6) + 1;
  return '<span class="tbadge sns-concept sns-c-' + n + '">' + esc(concept) + '</span>';
}

function platformLabel(platform) {
  return PLATFORM_LABELS[platform] || platform || '';
}

function snsStatusBadge(status) {
  const cls = status === '발행완료' ? 'badge badge-done' : 'badge badge-on';
  return '<span class="' + cls + '">' + esc(status || '컨펌대기') + '</span>';
}

/* 컨셉 필터 칩 (라우트 기반 링크) */
function conceptChips(active) {
  let html = '<div class="filter-row"><span class="filter-label">컨셉</span>';
  html +=
    '<a class="chip' + (!active ? ' is-on' : '') + '" href="#/sns">전체</a>';
  snsConcepts().forEach(function (c) {
    const on = active === c;
    const count = state.snsPosts.filter(function (p) { return p.concept === c; }).length;
    html +=
      '<a class="chip' + (on ? ' is-on' : '') + '" href="#/sns/' + encodeURIComponent(c) + '">' +
        esc(c) + (count ? ' <span class="chip-count">' + count + '</span>' : '') +
      '</a>';
  });
  return html + '</div>';
}

/* 반응 지표 한 줄 */
function snsMetricsLine(p) {
  return (
    '<span class="sns-metric" title="좋아요">♥ ' + (p.likes || 0) + '</span>' +
    '<span class="sns-metric" title="댓글">💬 ' + (p.comments || 0) + '</span>' +
    '<span class="sns-metric" title="DM">✉ ' + (p.dms || 0) + '</span>'
  );
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
  const projectChildren = sortedProjects().map(function (p) {
    return { label: p.name, route: '#/project/' + encodeURIComponent(p.id), icon: ICONS.dot };
  });
  const snsChildren = snsConcepts().map(function (c) {
    return { label: c, route: '#/sns/' + encodeURIComponent(c), icon: ICONS.dot };
  });

  return [
    { group: '취업 준비' },
    { label: '홈', route: '#/home', icon: ICONS.home },
    { label: '채용공고', route: '#/jobs', icon: ICONS.jobs },
    { label: '지원 회사', route: '#/companies', icon: ICONS.companies },
    { label: '산업 분석', route: '#/industries', icon: ICONS.industry, children: industryChildren },
    { label: '목표 관리', route: '#/goals', icon: ICONS.goals, children: goalChildren },
    { label: '프로젝트 관리', route: '#/projects', icon: ICONS.projects, children: projectChildren },
    { group: '샤홍슈' },
    { label: 'SNS 기획', route: '#/sns', icon: ICONS.sns, children: snsChildren }
  ];
}

function isActive(route, hash) {
  if (route === '#/companies') return hash.indexOf('#/companies') === 0 || hash.indexOf('#/company/') === 0;
  if (route === '#/industries') return hash.indexOf('#/industr') === 0;
  if (route === '#/jobs') return hash.indexOf('#/jobs') === 0;
  if (route === '#/goals') return hash.indexOf('#/goals') === 0;
  if (route === '#/projects') return hash.indexOf('#/projects') === 0 || hash.indexOf('#/project/') === 0;
  if (route === '#/sns') return hash.indexOf('#/sns') === 0;
  if (route === '#/home') return hash === '#/home' || hash === '#/' || hash === '';
  return hash === route;
}

function renderNav(hash) {
  let html = '';
  navConfig().forEach(function (item) {
    if (item.group) {
      html += '<div class="nav-group">' + esc(item.group) + '</div>';
      return;
    }
    const parentActive = isActive(item.route, hash);
    const exactParent =
      hash === item.route ||
      (item.route === '#/home' && (hash === '' || hash === '#/')) ||
      (item.route === '#/companies' && hash.indexOf('#/company/') === 0) ||
      (item.route === '#/projects' && hash.indexOf('#/project/') === 0);

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

  /* 프로젝트: 상태별(진행중 → 보류 → 완료)로 묶어서, 프로젝트가 있는 상태만 표시 */
  const projectGroups = PROJECT_STATUSES.map(function (st) {
    const list = sortedProjects().filter(function (p) { return (p.status || '진행중') === st; });
    if (!list.length) return '';
    return (
      '<div class="home-proj-group">' +
        '<div class="home-proj-head">' + projectStatusBadge(st) + '<span class="column-count">' + list.length + '</span></div>' +
        '<div class="summary-list">' +
          list.map(function (p) {
            return (
              '<a class="summary-row" href="#/project/' + encodeURIComponent(p.id) + '">' +
                '<span class="summary-name">' + esc(p.name) +
                  '<span class="summary-sub">' + projectDone(p) + ' / ' + tasksOf(p).length + ' 완료' +
                    (p.dueOn ? ' · 마감 ' + esc(p.dueOn) : '') + '</span>' +
                '</span>' +
                progressBar(projectProgress(p)) +
              '</a>'
            );
          }).join('') +
        '</div>' +
      '</div>'
    );
  }).join('');

  return (
    pageHead('홈 대시보드', 'SH site', '목표, 프로젝트, 일정을 한 화면에서 확인합니다.') +
    banner() +
    seedBtn +

    '<h2 class="section-head first">Goals</h2>' +
    '<div class="goal-grid">' + cards + '</div>' +

    '<h2 class="section-head"><a class="section-link" href="#/projects">프로젝트 관리</a></h2>' +
    (projectGroups || '<div class="empty">아직 등록된 프로젝트가 없습니다.</div>') +

    '<h2 class="section-head">일정표</h2>' +
    '<div class="calendar-wrap">' +
      '<iframe src="' + esc(CALENDAR_EMBED_URL) + '" title="구글 캘린더" loading="lazy" ' +
      'frameborder="0" scrolling="no"></iframe>' +
    '</div>' +
    '<p class="section-sub" style="margin-top:8px">' +
      '내 캘린더로 바꾸려면 assets/js/app.js 상단의 CALENDAR_EMBED_URL 값을 수정하세요.' +
    '</p>'
  );
}

/* =========================================================
   페이지: 채용공고
   ========================================================= */
/* 채용공고 탭 (공고 피드 / 관심 공고) */
function jobsTabs(active) {
  const tab = function (key, href, label) {
    return '<a class="jobs-tab' + (active === key ? ' is-on' : '') + '" href="' + href + '">' + label + '</a>';
  };
  return (
    '<div class="jobs-tabs">' +
      tab('feed', '#/jobs', '공고 피드 <span class="chip-count">' + activePostings().length + '</span>') +
      tab('saved', '#/jobs/saved', '관심 공고 <span class="chip-count">' + state.jobs.length + '</span>') +
    '</div>'
  );
}

/* =========================================================
   페이지: 채용공고 — 공고 피드 (사람인 자동 수집)
   ========================================================= */
const JOB_CATEGORIES = ['구매·조달', '해외영업', '사업기획·상사', '마케팅·브랜드'];

function postingDate(p) {
  return p.deadline ? fmtDate(p.deadline) : '';
}

/* 접수마감일이 정해진 공고인지 (상시·채용시 마감은 날짜가 의미 없음) */
function hasFixedDeadline(p) {
  return !!postingDate(p) && (!p.closeType || p.closeType === '접수마감일');
}

/* 마감이 지나지 않은 공고 */
function activePostings() {
  return state.jobPostings.filter(function (p) {
    const d = dday(postingDate(p));
    return d === null || d >= 0;
  });
}

function isSavedPosting(p) {
  return !!p.url && state.jobs.some(function (j) { return j.link === p.url; });
}

function pageJobFeed() {
  const cats = filterState.jobCat;
  const urgent = filterState.jobUrgent.length > 0;

  const list = activePostings()
    .filter(function (p) {
      if (cats.length && !p.categories.some(function (c) { return cats.indexOf(c) !== -1; })) return false;
      if (urgent) {
        const d = dday(postingDate(p));
        if (!hasFixedDeadline(p) || d > 7) return false;
      }
      return true;
    })
    .sort(function (a, b) {
      const da = hasFixedDeadline(a) ? postingDate(a) : '';
      const db = hasFixedDeadline(b) ? postingDate(b) : '';
      if (da !== db) {
        if (!da) return 1;
        if (!db) return -1;
        return da < db ? -1 : 1;
      }
      return byKo(a.company, b.company);
    });

  const lastFetched = state.jobPostings.reduce(function (acc, p) {
    return p.fetchedAt && p.fetchedAt > acc ? p.fetchedAt : acc;
  }, '');

  const rows = list
    .map(function (p) {
      let deadlineCell;
      if (!hasFixedDeadline(p)) {
        deadlineCell = '<span class="badge">' + esc(p.closeType || '상시') + '</span>';
      } else {
        const date = postingDate(p);
        const d = dday(date);
        deadlineCell =
          '<div class="nowrap">' + esc(date) + '</div>' +
          '<span class="' + (d <= 3 ? 'badge badge-urgent' : 'badge') + '" style="margin-top:4px">' +
            (d === 0 ? 'D-DAY' : 'D-' + d) +
          '</span>';
      }

      let saveCell = '';
      if (canEdit()) {
        saveCell = isSavedPosting(p)
          ? '<td class="nowrap"><span class="saved-mark">★ 저장됨</span></td>'
          : '<td class="nowrap">' + btn('posting-save', '☆ 관심', { data: { id: p.id } }) + '</td>';
      }

      return (
        '<tr>' +
          '<td class="cell-strong nowrap">' + esc(p.company) + '</td>' +
          '<td>' +
            (p.url
              ? '<a class="posting-title" href="' + esc(p.url) + '" target="_blank" rel="noopener">' + esc(p.title) + '</a>'
              : esc(p.title)) +
            '<div class="posting-tags">' +
              p.categories.map(function (c) { return '<span class="tbadge sns-plat">' + esc(c) + '</span>'; }).join('') +
            '</div>' +
          '</td>' +
          '<td class="cell-muted">' +
            '<div class="nowrap">' + dash(p.experience) + '</div>' +
            '<div class="posting-sub">' + esc(p.location) + '</div>' +
          '</td>' +
          '<td class="nowrap">' + deadlineCell + '</td>' +
          saveCell +
        '</tr>'
      );
    })
    .join('');

  const empty = state.jobPostings.length === 0
    ? '아직 수집된 공고가 없습니다. 사람인 API 키를 설정하면 매일 아침 8시에 자동으로 채워집니다.'
    : '조건에 맞는 공고가 없습니다.';

  return (
    pageHead(
      '채용공고',
      '공고 피드',
      '관심 직무의 신입 공채(코스피 상장사·정규직)를 매일 아침 자동으로 모읍니다. ☆ 관심을 누르면 관심 공고로 저장됩니다.'
    ) +
    banner() +
    jobsTabs('feed') +
    '<div class="filters">' +
      chipRow('직무', 'jobCat', JOB_CATEGORIES) +
      chipRow('마감', 'jobUrgent', ['7일 이내']) +
    '</div>' +
    '<div class="result-count">' +
      list.length + '개 공고' +
      (lastFetched ? ' · 마지막 수집 ' + esc(fmtDate(lastFetched)) : '') +
      ' · <a class="link-out" href="https://www.saramin.co.kr" target="_blank" rel="noopener">사람인 제공</a>' +
    '</div>' +
    (list.length
      ? '<div class="table-wrap"><table class="tbl">' +
          '<thead><tr>' +
            '<th style="width:120px">회사</th>' +
            '<th style="min-width:240px">공고</th>' +
            '<th style="width:130px">경력 · 지역</th>' +
            '<th style="width:100px">마감</th>' +
            (canEdit() ? '<th style="width:80px"></th>' : '') +
          '</tr></thead>' +
          '<tbody>' + rows + '</tbody>' +
        '</table></div>'
      : '<div class="empty">' + esc(empty) + '</div>')
  );
}

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
    jobsTabs('saved') +
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
const filterState = { scale: [], industry: [], status: [], jobCat: [], jobUrgent: [] };

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
      chipRow('진행상태', 'status', statusOptions()) +
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
   페이지: 프로젝트 관리 (목록)
   ========================================================= */
function pageProjects() {
  const list = sortedProjects();

  const cards = list
    .map(function (p) {
      const total = tasksOf(p).length;
      const desc = (p.description || '').split('\n')[0];
      return (
        '<a class="goal-card project-card" href="#/project/' + encodeURIComponent(p.id) + '">' +
          '<div class="project-card-top">' +
            '<div class="card-title">' + esc(p.name) + '</div>' +
            projectStatusBadge(p.status) +
          '</div>' +
          '<div class="card-meta">' +
            projectDone(p) + ' / ' + total + ' 완료' +
            (p.dueOn ? ' · 마감 ' + esc(p.dueOn) : '') +
          '</div>' +
          (desc ? '<p class="project-card-desc">' + esc(desc) + '</p>' : '') +
          progressBar(projectProgress(p)) +
        '</a>'
      );
    })
    .join('');

  return (
    pageHead(
      '프로젝트 관리',
      '프로젝트',
      '프로젝트별로 태스크 진행 상황을 확인합니다. 카드를 클릭하면 해당 프로젝트로 이동합니다.',
      btn('proj-add', '+ 프로젝트 추가', { cls: 'btn-primary btn-sm' })
    ) +
    banner() +
    (list.length
      ? '<div class="goal-grid">' + cards + '</div>'
      : '<div class="empty">아직 등록된 프로젝트가 없습니다.' +
        (canEdit() ? ' 오른쪽 위 [+ 프로젝트 추가]로 시작해 보세요.' : '') + '</div>')
  );
}

/* =========================================================
   페이지: 프로젝트 상세 (태스크 보드)
   ========================================================= */
function pageProjectDetail(id) {
  const p = projectById(id);
  if (!p) {
    return (
      '<a class="back-link" href="#/projects">' + ICONS.back + ' 프로젝트 관리</a>' +
      '<h1 class="page-title">찾을 수 없는 프로젝트</h1>' +
      '<p class="page-desc">해당 프로젝트를 찾지 못했습니다.</p>'
    );
  }

  const total = tasksOf(p).length;

  /* 칸 안 정렬: 마감이 빠른 순(마감 없음은 아래) → 같으면 우선순위(높음→낮음) */
  const prRank = { high: 0, mid: 1, low: 2, '': 3 };
  const byDueThenPriority = function (a, b) {
    if (a.due !== b.due) {
      if (!a.due) return 1;
      if (!b.due) return -1;
      return a.due < b.due ? -1 : 1;
    }
    return prRank[a.priority || ''] - prRank[b.priority || ''];
  };

  const card = function (t, col) {
    let due = '';
    if (t.due) {
      const d = dday(t.due);
      if (col === 'done' || d === null) {
        due = '<span class="task-due">' + esc(t.due.slice(5).replace('-', '/')) + '</span>';
      } else {
        const label = d < 0 ? '지남' : d === 0 ? 'D-DAY' : 'D-' + d;
        due =
          '<span class="task-due' + (d <= 3 ? ' is-urgent' : '') + '">' +
            esc(t.due.slice(5).replace('-', '/')) + ' · ' + label +
          '</span>';
      }
    }

    const actions = canEdit()
      ? '<div class="task-card-actions">' +
          /* 상태 변경: 고르면 바로 그 칸으로 이동 (click 위임과 겹치지 않게 data-change-act 사용) */
          '<select class="task-status-select" data-change-act="task-move" data-id="' + esc(p.id) +
            '" data-task="' + esc(t.id) + '" aria-label="상태 변경">' +
            TASK_STATUSES.map(function (s) {
              return '<option value="' + s.key + '"' + (s.key === col ? ' selected' : '') + '>' + esc(s.label) + '</option>';
            }).join('') +
          '</select>' +
          '<span class="spacer"></span>' +
          btn('task-edit', '수정', { data: { id: p.id, task: t.id }, cls: 'btn-sm btn-quiet' }) +
          btn('task-del', '삭제', { data: { id: p.id, task: t.id }, cls: 'btn-sm btn-quiet' }) +
        '</div>'
      : '';

    return (
      '<div class="task-card' + (col === 'done' ? ' is-done' : '') + '">' +
        '<div class="task-card-title">' + esc(t.title) + '</div>' +
        ((t.priority || due)
          ? '<div class="task-card-meta">' + (t.priority ? priorityBadge(t.priority) : '') + due + '</div>'
          : '') +
        (t.memo ? '<p class="task-card-memo">' + esc(t.memo) + '</p>' : '') +
        actions +
      '</div>'
    );
  };

  const columns = TASK_STATUSES.map(function (s) {
    const items = tasksOf(p)
      .filter(function (t) { return taskStatusMeta(t.status).key === s.key; })
      .sort(byDueThenPriority);
    return (
      '<section class="task-col">' +
        '<h3 class="task-col-head">' + esc(s.label) + ' <span class="column-count">' + items.length + '</span></h3>' +
        items.map(function (t) { return card(t, s.key); }).join('') +
        (items.length || canEdit() ? '' : '<div class="task-col-empty">비어 있음</div>') +
        (canEdit()
          ? '<button type="button" class="task-col-add" data-act="task-add" data-id="' + esc(p.id) +
            '" data-status="' + s.key + '">+ 여기에 추가</button>'
          : '') +
      '</section>'
    );
  }).join('');

  return (
    '<a class="back-link" href="#/projects">' + ICONS.back + ' 프로젝트 관리</a>' +
    banner() +
    '<div class="page-head">' +
      '<div>' +
        '<div class="page-label">프로젝트 관리</div>' +
        '<h1 class="page-title">' + esc(p.name) + '</h1>' +
      '</div>' +
      '<div class="page-actions">' + btn('proj-edit', '프로젝트 수정', { data: { id: p.id } }) + '</div>' +
    '</div>' +
    '<div class="meta-row">' +
      projectStatusBadge(p.status) +
      (p.startedOn ? '<span class="badge">시작 ' + esc(p.startedOn) + '</span>' : '') +
      (p.dueOn ? '<span class="badge">마감 ' + esc(p.dueOn) + '</span>' : '') +
    '</div>' +

    (p.description ? '<p class="prose" style="margin-bottom:24px">' + esc(p.description) + '</p>' : '') +

    '<div class="period-summary">' +
      '<span class="period-summary-label">' + projectDone(p) + ' / ' + total + ' 완료</span>' +
      progressBar(projectProgress(p)) +
    '</div>' +

    '<div class="section-head-row">' +
      '<h2 class="section-head">태스크</h2>' +
      (canEdit()
        ? '<div class="section-actions">' +
            btn('task-add', '+ 태스크 추가', { data: { id: p.id }, cls: 'btn-primary btn-sm' }) +
          '</div>'
        : '') +
    '</div>' +

    '<div class="task-board">' + columns + '</div>'
  );
}

/* =========================================================
   페이지: SNS 기획 (샤홍슈)
   ========================================================= */
function pageSns(concept) {
  const list = snsByConcept(concept);
  const all = concept ? snsByConcept(null) : list;

  /* 요약: 총 편수 / 발행완료 / 총 반응 (현재 필터 기준) */
  const published = list.filter(function (p) { return p.status === '발행완료'; }).length;
  const sum = function (k) {
    return list.reduce(function (acc, p) { return acc + (Number(p[k]) || 0); }, 0);
  };

  const rows = list
    .map(function (p, i) {
      const isDone = p.status === '발행완료';
      const canConfirm = canEdit() && !isDone;
      const checkbox =
        '<input type="checkbox" class="goal-check"' +
        (isDone ? ' checked' : '') +
        (canConfirm
          ? ' data-act="sns-confirm" data-id="' + esc(p.id) + '"'
          : ' disabled') +
        ' title="' + (isDone ? '발행완료' : '체크하면 발행완료로 넘어갑니다') + '"' +
        ' aria-label="' + esc(p.hook) + ' 발행완료">';

      return (
        '<div class="goal-row sns-row' + (isDone ? ' is-done' : '') + '">' +
          '<span class="sns-index">' + (i + 1) + '</span>' +
          checkbox +
          '<div class="goal-body">' +
            '<div class="goal-row-top">' +
              '<span class="goal-name">' + esc(p.hook || '(제목 없음)') + '</span>' +
              (canEdit()
                ? '<span class="goal-controls">' +
                    btn('sns-metrics', '반응 입력', { data: { id: p.id } }) +
                  '</span>'
                : '') +
            '</div>' +
            '<div class="sns-meta">' +
              conceptBadge(p.concept) +
              (p.platform ? '<span class="tbadge sns-plat">' + esc(platformLabel(p.platform)) + '</span>' : '') +
              snsStatusBadge(p.status) +
              (p.planDate ? '<span class="sns-date">' + esc(p.planDate) + '</span>' : '') +
            '</div>' +
            (p.conclusion ? '<p class="sns-conclusion">' + esc(p.conclusion) + '</p>' : '') +
            '<div class="sns-metrics">' + snsMetricsLine(p) + '</div>' +
          '</div>' +
        '</div>'
      );
    })
    .join('');

  return (
    pageHead(
      'SNS 기획 · 샤홍슈',
      concept ? concept : '전체 기획',
      'SNS_Vault에서 기획한 글이 시간순으로 쌓입니다. 컨펌대기 글은 체크하면 발행완료로 넘어가고, 좋아요·댓글·DM은 직접 입력합니다.'
    ) +
    banner() +

    conceptChips(concept) +

    '<div class="sns-summary">' +
      '<span class="sns-summary-item"><b>' + list.length + '</b> 편' +
        (concept ? '' : ' / 전체 ' + all.length) + '</span>' +
      '<span class="sns-summary-item">발행완료 <b>' + published + '</b></span>' +
      '<span class="sns-summary-item">♥ <b>' + sum('likes') + '</b></span>' +
      '<span class="sns-summary-item">💬 <b>' + sum('comments') + '</b></span>' +
      '<span class="sns-summary-item">✉ <b>' + sum('dms') + '</b></span>' +
    '</div>' +

    (list.length
      ? '<div class="goal-list sns-list">' + rows + '</div>'
      : '<div class="empty">' +
          (concept ? '이 컨셉의 기획 글이 아직 없습니다.' : '아직 동기화된 SNS 기획 글이 없습니다.') +
        '</div>')
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

/* 전형 목록 + 실제로 쓰인 예전 값(목록에 없는 것) — 필터와 폼이 함께 씀 */
function statusOptions() {
  const extra = [];
  state.companies.forEach(function (c) {
    if (c.status && STATUSES.indexOf(c.status) === -1 && extra.indexOf(c.status) === -1) extra.push(c.status);
  });
  return STATUSES.concat(extra);
}

function companyFields() {
  return [
    { name: 'name', label: '회사명', required: true },
    { name: 'industry', label: '산업군', datalist: allIndustries(), placeholder: '예: IT, 금융' },
    { name: 'scale', label: '규모', type: 'select', options: [''].concat(SCALES) },
    { name: 'status', label: '진행상태', type: 'select', options: statusOptions() },
    { name: 'position', label: '지원 직무' }
  ];
}

function projectFields() {
  return [
    { name: 'name', label: '프로젝트 이름', required: true, placeholder: '예: 포트폴리오 웹사이트' },
    { name: 'status', label: '진행 상태', type: 'select', options: PROJECT_STATUSES },
    { name: 'startedOn', label: '시작일', type: 'date' },
    { name: 'dueOn', label: '마감일', type: 'date', hint: '없으면 비워 두세요' },
    { name: 'description', label: '설명', type: 'textarea', rows: 4 }
  ];
}

function taskFields() {
  return [
    { name: 'title', label: '태스크', required: true, placeholder: '예: 메인 페이지 레이아웃' },
    {
      name: 'status', label: '상태', type: 'select',
      options: TASK_STATUSES.map(function (s) { return s.label; })
    },
    {
      name: 'priority', label: '우선순위', type: 'select',
      options: PRIORITIES.map(function (p) { return p.label; })
    },
    { name: 'due', label: '마감일', type: 'date' },
    { name: 'memo', label: '메모', type: 'textarea', rows: 3 }
  ];
}

/* 폼의 라벨(한글) ↔ 저장 키 변환 */
function taskStatusKeyFromLabel(label) {
  const m = TASK_STATUSES.filter(function (s) { return s.label === label; })[0];
  return m ? m.key : 'todo';
}

function priorityKeyFromLabel(label) {
  const m = PRIORITIES.filter(function (p) { return p.label === label; })[0];
  return m ? m.key : '';
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
  const act = el.getAttribute('data-act') || el.getAttribute('data-change-act');
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
  if (act === 'signout') {
    await signOut();
    location.replace(LOGIN_URL);
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

  /* ---- 공고 피드 → 관심 공고 저장 ---- */
  if (act === 'posting-save') {
    const p = state.jobPostings.filter(function (x) { return String(x.id) === String(id); })[0];
    if (!p) return;
    if (isSavedPosting(p)) {
      toast('이미 관심 공고에 있습니다.');
      return;
    }
    el.disabled = true;
    try {
      await jobsApi.create({
        company: p.company,
        title: p.title,
        link: p.url,
        deadline: hasFixedDeadline(p) ? postingDate(p) : '',
        memo: ''
      });
      render();
      toast('관심 공고에 저장했습니다.');
    } catch (err) {
      el.disabled = false;
      toast('저장하지 못했습니다: ' + (err.message || err), true);
    }
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
      values: { status: '서류 지원' },
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

  /* ---- 프로젝트 ---- */
  if (act === 'proj-add') {
    openForm({
      title: '프로젝트 추가',
      fields: projectFields(),
      values: { status: '진행중' },
      onSubmit: async function (v) {
        const created = await projectsApi.create({
          name: v.name,
          status: v.status,
          startedOn: v.startedOn,
          dueOn: v.dueOn,
          description: v.description,
          tasks: []
        });
        render();
        toast('프로젝트를 추가했습니다.');
        if (created && created.id) location.hash = '#/project/' + encodeURIComponent(created.id);
      }
    });
    return;
  }

  if (act === 'proj-edit') {
    const p = projectsApi.get(id);
    if (!p) return;
    openForm({
      title: '프로젝트 수정',
      fields: projectFields(),
      values: p,
      onSubmit: async function (v) {
        await projectsApi.update(id, {
          name: v.name,
          status: v.status,
          startedOn: v.startedOn,
          dueOn: v.dueOn,
          description: v.description
        });
        render();
        toast('저장했습니다.');
      }
    });
    return;
  }

  if (act === 'proj-del') {
    const p = projectsApi.get(id);
    if (!p) return;
    openConfirm('"' + p.name + '" 프로젝트를 삭제할까요? 태스크까지 함께 지워집니다.', async function () {
      await projectsApi.remove(id);
      if (location.hash.indexOf('#/project/') === 0) location.hash = '#/projects';
      else render();
      toast('삭제했습니다.');
    });
    return;
  }

  /* ---- 태스크 (프로젝트 안의 jsonb 배열) ---- */
  if (act === 'task-move') {
    const p = projectsApi.get(id);
    if (!p) return;
    const taskId = el.getAttribute('data-task');
    const task = tasksOf(p).filter(function (t) { return t.id === taskId; })[0];
    if (!task) return;

    const to = el.value || el.getAttribute('data-to');
    const prev = task.status;
    if (!to || taskStatusMeta(prev).key === to) return;
    task.status = to; // 낙관적 업데이트
    render();
    try {
      await projectsApi.update(id, { tasks: tasksOf(p) });
    } catch (err) {
      task.status = prev;
      render();
      toast('저장하지 못했습니다: ' + (err.message || err), true);
    }
    return;
  }

  if (act === 'task-add') {
    const p = projectsApi.get(id);
    if (!p) return;
    openForm({
      title: '태스크 추가',
      fields: taskFields(),
      values: {
        status: taskStatusMeta(el.getAttribute('data-status') || 'todo').label,
        priority: '—'
      },
      onSubmit: async function (v) {
        const task = {
          id: uid(),
          title: v.title,
          status: taskStatusKeyFromLabel(v.status),
          priority: priorityKeyFromLabel(v.priority),
          due: v.due || '',
          memo: v.memo || ''
        };
        const tasks = tasksOf(p).concat([task]);
        await projectsApi.update(id, { tasks: tasks });
        render();
        toast('태스크를 추가했습니다.');
      }
    });
    return;
  }

  if (act === 'task-edit') {
    const p = projectsApi.get(id);
    if (!p) return;
    const taskId = el.getAttribute('data-task');
    const task = tasksOf(p).filter(function (t) { return t.id === taskId; })[0];
    if (!task) return;
    openForm({
      title: '태스크 수정',
      fields: taskFields(),
      values: {
        title: task.title,
        status: taskStatusMeta(task.status).label,
        priority: priorityMeta(task.priority).label,
        due: task.due || '',
        memo: task.memo || ''
      },
      onSubmit: async function (v) {
        const tasks = tasksOf(p).map(function (t) {
          if (t.id !== taskId) return t;
          return {
            id: t.id,
            title: v.title,
            status: taskStatusKeyFromLabel(v.status),
            priority: priorityKeyFromLabel(v.priority),
            due: v.due || '',
            memo: v.memo || ''
          };
        });
        await projectsApi.update(id, { tasks: tasks });
        render();
        toast('저장했습니다.');
      }
    });
    return;
  }

  if (act === 'task-del') {
    const p = projectsApi.get(id);
    if (!p) return;
    const taskId = el.getAttribute('data-task');
    const task = tasksOf(p).filter(function (t) { return t.id === taskId; })[0];
    openConfirm('"' + ((task && task.title) || '태스크') + '"을(를) 삭제할까요?', async function () {
      const tasks = tasksOf(p).filter(function (t) { return t.id !== taskId; });
      await projectsApi.update(id, { tasks: tasks });
      render();
      toast('삭제했습니다.');
    });
    return;
  }

  /* ---- SNS 기획 ---- */
  if (act === 'sns-confirm') {
    const p = snsPostsApi.get(id);
    if (!p || p.status === '발행완료') return;

    p.status = '발행완료'; // 낙관적 업데이트
    render();
    try {
      await snsPostsApi.update(id, { status: '발행완료' });
      toast('발행완료로 넘겼습니다.');
    } catch (err) {
      p.status = '컨펌대기';
      render();
      toast('저장하지 못했습니다: ' + (err.message || err), true);
    }
    return;
  }

  if (act === 'sns-metrics') {
    const p = snsPostsApi.get(id);
    if (!p) return;
    openForm({
      title: '반응 입력',
      fields: [
        { name: 'likes', label: '좋아요', type: 'number' },
        { name: 'comments', label: '댓글', type: 'number' },
        { name: 'dms', label: 'DM', type: 'number' }
      ],
      values: { likes: p.likes || 0, comments: p.comments || 0, dms: p.dms || 0 },
      onSubmit: async function (v) {
        await snsPostsApi.update(id, {
          likes: Number(v.likes) || 0,
          comments: Number(v.comments) || 0,
          dms: Number(v.dms) || 0
        });
        render();
        toast('저장했습니다.');
      }
    });
    return;
  }
}

/* 로그인 페이지 주소 (index.html) */
const LOGIN_URL = './';

/* =========================================================
   라우터
   ========================================================= */
function render() {
  const hash = location.hash || '#/home';
  const view = document.getElementById('view');
  let html = '';
  let focusPeriod = null;

  if (hash === '#/' || hash === '#/home' || hash === '') {
    html = pageHome();
  } else if (hash === '#/jobs') {
    html = pageJobFeed();
  } else if (hash === '#/jobs/saved') {
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
  } else if (hash === '#/projects') {
    html = pageProjects();
  } else if (hash.indexOf('#/project/') === 0) {
    html = pageProjectDetail(decodeURIComponent(hash.slice('#/project/'.length)));
  } else if (hash === '#/sns') {
    html = pageSns(null);
  } else if (hash.indexOf('#/sns/') === 0) {
    html = pageSns(decodeURIComponent(hash.slice('#/sns/'.length)));
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
/* 선택 상자(상태 변경 등)는 click 이 아니라 change 로 처리 */
document.addEventListener('change', function (e) {
  const el = e.target.closest('[data-change-act]');
  if (el) handleAction(el);
});

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

  if (!isConfigured()) {
    /* Supabase 설정 전(로컬 개발)에는 예시 데이터로 그대로 동작 */
    await reload();
    render();
    await init(function () { render(); });
    render();
    return;
  }

  document.getElementById('view').innerHTML = '<div class="empty">불러오는 중…</div>';

  await init(function () {
    if (!state.user) location.replace(LOGIN_URL);
    else render();
  });

  /* 로그인하지 않았다면 본문을 보여주지 않고 로그인 페이지로 되돌립니다 */
  if (!state.user) {
    location.replace(LOGIN_URL);
    return;
  }
  render();
})();
