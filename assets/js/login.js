/* =========================================================
   로그인 페이지 (index.html)
   ---------------------------------------------------------
   1단계  로그인 전   → 카카오 로그인 버튼
   2단계  로그인 후   → 환영 화면 + "사이트로 들어가기" → ./app.html
   ========================================================= */

import {
  state,
  init,
  isConfigured,
  signInKakao,
  signOut,
  userLabel
} from './store.js';

const SITE_URL = './app.html#/home';
const gate = document.getElementById('gate');

function esc(v) {
  return String(v == null ? '' : v)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function card(inner, extraClass) {
  return '<div class="gate-card' + (extraClass ? ' ' + extraClass : '') + '">' + inner + '</div>';
}

function brand() {
  return (
    '<div class="gate-brand">' +
      '<span class="site-mark"></span>' +
      '<span class="gate-title">SH site</span>' +
    '</div>'
  );
}

/* 1단계 */
function loginHtml() {
  return card(
    brand() +
    '<p class="gate-desc">취업 준비 기록을 보려면 로그인해 주세요.</p>' +
    '<button type="button" class="btn btn-kakao gate-btn" data-act="signin">카카오로 로그인</button>' +
    (state.notice ? '<p class="gate-note gate-error">' + esc(state.notice) + '</p>' : '') +
    '<p class="gate-note">본인 계정으로만 열람할 수 있습니다.</p>'
  );
}

/* 2단계 */
function welcomeHtml() {
  const meta = (state.user && state.user.user_metadata) || {};
  const avatar = meta.avatar_url || meta.picture || '';
  const total = state.goals.length;
  const done = state.goals.filter(function (g) { return g.isDone; }).length;

  return card(
    (avatar
      ? '<img class="gate-avatar" src="' + esc(avatar) + '" alt="" referrerpolicy="no-referrer">'
      : '<div class="gate-avatar gate-avatar-blank"></div>') +
    '<p class="gate-hello">환영합니다</p>' +
    '<p class="gate-username">' + esc(userLabel()) + '님</p>' +
    (total
      ? '<p class="gate-summary">목표 ' + total + '개 중 ' + done + '개 완료</p>'
      : '<p class="gate-summary">오늘의 목표를 등록해 보세요</p>') +
    '<a class="btn btn-primary gate-btn" href="' + SITE_URL + '">사이트로 들어가기</a>' +
    '<button type="button" class="gate-link" data-act="signout">다른 계정으로 로그인</button>',
    'gate-welcome'
  );
}

function loadingHtml() {
  return card(brand() + '<p class="gate-desc">불러오는 중…</p>');
}

function render() {
  if (!state.ready) {
    gate.innerHTML = loadingHtml();
    return;
  }
  gate.innerHTML = state.user ? welcomeHtml() : loginHtml();
}

/* ---------- 이벤트 ---------- */
document.addEventListener('click', async function (e) {
  const el = e.target.closest ? e.target.closest('[data-act]') : null;
  if (!el) return;
  const act = el.getAttribute('data-act');

  if (act === 'signin') {
    e.preventDefault();
    el.disabled = true;
    try {
      await signInKakao();
    } catch (err) {
      el.disabled = false;
      state.notice = err && err.message ? err.message : String(err);
      render();
    }
    return;
  }

  if (act === 'signout') {
    e.preventDefault();
    await signOut();
    render();
  }
});

/* ---------- 시작 ---------- */
(async function bootstrap() {
  /* Supabase 설정 전(로컬 개발)에는 로그인 단계를 건너뜁니다 */
  if (!isConfigured()) {
    location.replace(SITE_URL);
    return;
  }

  render();
  await init(function () { render(); });
  render();
})();
