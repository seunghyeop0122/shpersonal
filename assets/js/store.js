/* =========================================================
   데이터 레이어 (Supabase + 로컬 시드 폴백)
   ---------------------------------------------------------
   · 설정이 채워져 있고 로그인돼 있으면  → Supabase 테이블에서 읽고 씀
   · 그렇지 않으면                        → data/*.js 예시 데이터를 읽기 전용으로 표시
   빌드 도구를 쓰지 않으므로 supabase-js 는 CDN에서 동적 import 합니다.
   (네트워크 문제로 로드에 실패해도 사이트는 시드 데이터로 그대로 동작)
   ========================================================= */

const SUPABASE_JS = 'https://esm.sh/@supabase/supabase-js@2';

export const state = {
  ready: false,
  source: 'seed', // 'supabase' | 'seed'
  user: null,
  goals: [],
  jobs: [],
  companies: [],
  industries: [],
  notice: ''
};

let sb = null;
let onChangeCb = function () {};

/* ---------- 설정 확인 ---------- */
function readConfig() {
  const cfg = window.SUPABASE_CONFIG || {};
  const url = String(cfg.url || '');
  const key = String(cfg.anonKey || '');
  const ok =
    /^https:\/\/[a-z0-9-]+\.supabase\.co\/?$/i.test(url) &&
    url.indexOf('YOUR-') === -1 &&
    key.length > 20 &&
    key.indexOf('YOUR-') === -1;
  return ok ? { url: url.replace(/\/$/, ''), key: key } : null;
}

export function isSupabaseEnabled() {
  return !!sb;
}

/* supabase-js 로드를 기다리지 않고 "설정이 채워져 있는지"만 즉시 판단 */
export function isConfigured() {
  return !!readConfig();
}

export function canEdit() {
  return !!sb && !!state.user;
}

/* 로그인 토큰이 유효하지 않을 때 나는 오류인지 판별
   (예: "JWT issued at future", "JWT expired", PGRST301) */
function isTokenError(e) {
  const text = [e && e.message, e && e.hint, e && e.details, e && e.code]
    .filter(Boolean)
    .join(' ');
  return /jwt|token|pgrst301|issued at future|expired/i.test(text);
}

/* ---------- 시드(예시) 데이터 ---------- */
function seedGoals() {
  return typeof GOALS !== 'undefined' ? GOALS.map(function (g) { return Object.assign({}, g); }) : [];
}

function seedJobs() {
  return typeof JOBS !== 'undefined' ? JOBS.map(function (j) { return Object.assign({}, j); }) : [];
}

function seedCompanies() {
  return typeof COMPANIES !== 'undefined'
    ? COMPANIES.map(function (c) { return JSON.parse(JSON.stringify(c)); })
    : [];
}

function seedIndustries() {
  if (typeof INDUSTRIES === 'undefined' || !INDUSTRIES) return [];
  return Object.keys(INDUSTRIES).map(function (name) {
    const v = INDUSTRIES[name] || {};
    return {
      id: 'seed-' + name,
      name: name,
      overview: v.overview || '',
      trends: v.trends || '',
      comparison: v.comparison || '',
      implications: v.implications || ''
    };
  });
}

/* ---------- 행 <-> 앱 객체 매핑 ---------- */
const map = {
  goals: {
    in: function (r) {
      return {
        id: r.id,
        period: r.period,
        title: r.title || '',
        detail: r.detail || '',
        goalDate: r.goal_date || '',
        isDone: !!r.is_done,
        createdAt: r.created_at || ''
      };
    },
    /* 부분 수정(patch)에도 쓰이므로 전달된 키만 내보냅니다 */
    out: function (g) {
      const out = {};
      if ('period' in g) out.period = g.period;
      if ('title' in g) out.title = g.title;
      if ('detail' in g) out.detail = g.detail || '';
      if ('goalDate' in g) out.goal_date = g.goalDate ? g.goalDate : null;
      if ('isDone' in g) out.is_done = !!g.isDone;
      return out;
    }
  },

  jobs: {
    in: function (r) {
      return {
        id: r.id,
        company: r.company || '',
        title: r.title || '',
        link: r.link || '',
        deadline: r.deadline || '',
        memo: r.memo || ''
      };
    },
    out: function (j) {
      const out = {};
      if ('company' in j) out.company = j.company;
      if ('title' in j) out.title = j.title || '';
      if ('link' in j) out.link = j.link || '';
      if ('deadline' in j) out.deadline = j.deadline ? j.deadline : null;
      if ('memo' in j) out.memo = j.memo || '';
      return out;
    }
  },

  companies: {
    in: function (r) {
      return {
        id: r.id,
        name: r.name || '',
        industry: r.industry || '',
        scale: r.scale || '',
        status: r.status || '진행중',
        stage: r.stage || '',
        position: r.position || '',
        schedule: r.schedule || {},
        companyAnalysis: r.company_analysis || '',
        industryAnalysis: r.industry_analysis || '',
        interviewNotes: Array.isArray(r.interview_notes) ? r.interview_notes : []
      };
    },
    out: function (c) {
      const out = {};
      if ('name' in c) out.name = c.name;
      if ('industry' in c) out.industry = c.industry || '';
      if ('scale' in c) out.scale = c.scale || '';
      if ('status' in c) out.status = c.status || '진행중';
      if ('stage' in c) out.stage = c.stage || '';
      if ('position' in c) out.position = c.position || '';
      if ('schedule' in c) out.schedule = c.schedule || {};
      if ('companyAnalysis' in c) out.company_analysis = c.companyAnalysis || '';
      if ('industryAnalysis' in c) out.industry_analysis = c.industryAnalysis || '';
      if ('interviewNotes' in c) out.interview_notes = c.interviewNotes || [];
      return out;
    }
  },

  industries: {
    in: function (r) {
      return {
        id: r.id,
        name: r.name || '',
        overview: r.overview || '',
        trends: r.trends || '',
        comparison: r.comparison || '',
        implications: r.implications || ''
      };
    },
    out: function (i) {
      const out = {};
      if ('name' in i) out.name = i.name;
      if ('overview' in i) out.overview = i.overview || '';
      if ('trends' in i) out.trends = i.trends || '';
      if ('comparison' in i) out.comparison = i.comparison || '';
      if ('implications' in i) out.implications = i.implications || '';
      return out;
    }
  }
};

/* ---------- 초기화 ---------- */
export async function init(onChange) {
  if (typeof onChange === 'function') onChangeCb = onChange;

  const cfg = readConfig();
  if (cfg) {
    try {
      const mod = await import(/* @vite-ignore */ SUPABASE_JS);
      sb = mod.createClient(cfg.url, cfg.key, {
        auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
      });
      const res = await sb.auth.getSession();
      state.user = (res.data && res.data.session && res.data.session.user) || null;
      sb.auth.onAuthStateChange(function (_event, session) {
        const next = (session && session.user) || null;
        const changed = (next && next.id) !== (state.user && state.user.id);
        state.user = next;
        if (changed) reload().then(function () { onChangeCb(); });
      });
    } catch (e) {
      sb = null;
      state.notice = 'Supabase 라이브러리를 불러오지 못해 예시 데이터를 표시합니다.';
      console.warn('[store] supabase-js 로드 실패', e);
    }
  }

  await reload();
  state.ready = true;
}

export async function reload() {
  if (sb && state.user) {
    try {
      const r = await Promise.all([
        sb.from('goals').select('*').order('created_at', { ascending: true }),
        sb.from('jobs').select('*').order('created_at', { ascending: true }),
        sb.from('companies').select('*').order('created_at', { ascending: true }),
        sb.from('industries').select('*').order('created_at', { ascending: true })
      ]);
      const err = r.filter(function (x) { return x.error; })[0];
      if (err) throw err.error;

      state.goals = r[0].data.map(map.goals.in);
      state.jobs = r[1].data.map(map.jobs.in);
      state.companies = r[2].data.map(map.companies.in);
      state.industries = r[3].data.map(map.industries.in);
      state.source = 'supabase';
      state.notice = '';
      return;
    } catch (e) {
      console.error('[store] 데이터를 불러오지 못했습니다', e);

      /* 토큰 문제(만료·시각 불일치 등)는 세션을 정리하고 다시 로그인하도록 안내 */
      if (isTokenError(e)) {
        try { await sb.auth.signOut(); } catch (_) { /* 이미 끊긴 세션 */ }
        state.user = null;
        state.notice =
          '로그인 세션이 유효하지 않아 로그아웃했습니다. 왼쪽 아래에서 다시 로그인해 주세요.';
      } else {
        state.notice = '데이터를 불러오지 못했습니다: ' + (e.message || e);
      }
    }
  }

  state.goals = seedGoals();
  state.jobs = seedJobs();
  state.companies = seedCompanies();
  state.industries = seedIndustries();
  state.source = 'seed';
}

/* ---------- 인증 ---------- */
export async function signInKakao() {
  if (!sb) throw new Error('Supabase 설정이 아직 채워지지 않았습니다. assets/js/supabase-config.js 를 확인하세요.');
  const redirectTo = location.origin + location.pathname;
  const res = await sb.auth.signInWithOAuth({ provider: 'kakao', options: { redirectTo: redirectTo } });
  if (res.error) throw res.error;
}

export async function signOut() {
  if (!sb) return;
  await sb.auth.signOut();
  state.user = null;
  await reload();
  onChangeCb();
}

export function userLabel() {
  const u = state.user;
  if (!u) return '';
  const m = u.user_metadata || {};
  return m.name || m.full_name || m.nickname || m.preferred_username || u.email || '로그인됨';
}

/* ---------- 공통 CRUD ---------- */
function requireEdit() {
  if (!sb) throw new Error('Supabase가 설정되지 않았습니다.');
  if (!state.user) throw new Error('로그인이 필요합니다.');
}

async function insertRow(table, payload) {
  requireEdit();
  const res = await sb.from(table).insert(payload).select().single();
  if (res.error) throw res.error;
  return map[table].in(res.data);
}

async function updateRow(table, id, payload) {
  requireEdit();
  const res = await sb.from(table).update(payload).eq('id', id).select().single();
  if (res.error) throw res.error;
  return map[table].in(res.data);
}

async function deleteRow(table, id) {
  requireEdit();
  const res = await sb.from(table).delete().eq('id', id);
  if (res.error) throw res.error;
}

function replaceIn(list, item) {
  const i = list.findIndex(function (x) { return x.id === item.id; });
  if (i !== -1) list[i] = item;
  return item;
}

function makeApi(table, listName) {
  return {
    async create(obj) {
      const row = await insertRow(table, map[table].out(obj));
      state[listName].push(row);
      return row;
    },
    async update(id, patch) {
      const row = await updateRow(table, id, map[table].out(patch));
      return replaceIn(state[listName], row);
    },
    async remove(id) {
      await deleteRow(table, id);
      const i = state[listName].findIndex(function (x) { return x.id === id; });
      if (i !== -1) state[listName].splice(i, 1);
    },
    get(id) {
      return state[listName].filter(function (x) { return x.id === id; })[0] || null;
    }
  };
}

export const goalsApi = makeApi('goals', 'goals');
export const jobsApi = makeApi('jobs', 'jobs');
export const companiesApi = makeApi('companies', 'companies');
export const industriesApi = makeApi('industries', 'industries');

/* 산업군 본문은 이름 기준으로 있으면 수정, 없으면 생성 */
export async function saveIndustry(name, patch) {
  const found = state.industries.filter(function (x) { return x.name === name; })[0];
  if (found) return industriesApi.update(found.id, Object.assign({ name: name }, patch));
  return industriesApi.create(Object.assign({ name: name }, patch));
}

export function industryByName(name) {
  return state.industries.filter(function (x) { return x.name === name; })[0] || null;
}

/* ---------- 예시 데이터 넣기 ---------- */
export function isEmpty() {
  return (
    state.goals.length === 0 &&
    state.jobs.length === 0 &&
    state.companies.length === 0 &&
    state.industries.length === 0
  );
}

export async function seedFromFiles() {
  requireEdit();

  const payloads = [
    ['goals', seedGoals().map(map.goals.out)],
    ['jobs', seedJobs().map(map.jobs.out)],
    ['companies', seedCompanies().map(map.companies.out)],
    ['industries', seedIndustries().map(map.industries.out)]
  ];

  for (const pair of payloads) {
    if (!pair[1].length) continue;
    const res = await sb.from(pair[0]).insert(pair[1]);
    if (res.error) throw res.error;
  }
  await reload();
}
