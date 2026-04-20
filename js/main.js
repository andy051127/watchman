// main.js — 메인 대시보드

// TODO: API에서 사용자 정보 및 세션 데이터 로드
// GET /api/users/me → { nickname, email, points, streak }
// GET /api/sessions/today → [{ focusedTime, distractedTime, focusRate, createdAt }]
// GET /api/sessions/week → [{ date, totalFocused }]
// GET /api/sessions/recent?limit=3 → [...]

document.addEventListener('DOMContentLoaded', () => {
  initPage();
});

function initPage() {
  // TODO: 실제 API 호출로 교체
  // 임시 데모 데이터
  const user = getDemoUser();
  const sessions = getDemoSessions();
  const isGuest = new URLSearchParams(window.location.search).get('guest') === '1';

  // 네브바 사용자 정보
  const nicknameEl = document.getElementById('nav-nickname');
  const exitBtn = document.getElementById('btn-exit');

  if (isGuest) {
    nicknameEl.textContent = '비회원';
    nicknameEl.classList.add('nav-guest');
    document.getElementById('nav-avatar').removeAttribute('href');
    exitBtn.textContent = '나가기';
    // 비회원 제한 링크 비활성화
    ['nav-stats', 'nav-group'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.style.opacity = '0.4'; el.style.pointerEvents = 'none'; }
    });
  } else {
    nicknameEl.textContent = user.nickname;
    // 배너 인사
    document.getElementById('banner-greeting').textContent = `${user.nickname}님, ${getGreeting()} 👋`;
  }

  // 통계 계산
  const todaySecs = sessions.filter(s => isToday(s.date)).reduce((a, s) => a + s.focusedTime, 0);
  const weekSecs = sessions.filter(s => isThisWeek(s.date)).reduce((a, s) => a + s.focusedTime, 0);
  const avgFocusRate = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + s.focusRate, 0) / sessions.length)
    : null;

  // 배너 칩
  document.getElementById('chip-today').textContent = todaySecs > 0 ? fmtSec(todaySecs) : '0분';
  document.getElementById('chip-week').textContent = weekSecs > 0 ? fmtSec(weekSecs) : '0시간';

  // 통계 카드
  document.getElementById('stat-today').textContent = todaySecs > 0 ? fmtSec(todaySecs) : '0분';
  document.getElementById('stat-today-sub').textContent = todaySecs > 0 ? '잘 하고 있어요!' : '아직 시작 전이에요';
  document.getElementById('stat-focus').textContent = avgFocusRate !== null ? `${avgFocusRate}%` : '-%';

  if (isGuest) {
    document.getElementById('stat-streak-card').innerHTML = `
      <div class="stat-card-label">🔥 연속 공부</div>
      <div class="stat-locked-msg">🔒 로그인 필요</div>`;
    document.getElementById('stat-points-card').innerHTML = `
      <div class="stat-card-label">⭐ 보유 포인트</div>
      <div class="stat-locked-msg">🔒 로그인 필요</div>`;
  } else {
    document.getElementById('stat-points').textContent = `${user.points.toLocaleString()}P`;
  }

  // 최근 세션
  renderRecentSessions(sessions.slice(0, 3), isGuest);
}

function renderRecentSessions(sessions, isGuest) {
  const container = document.getElementById('recent-sessions-content');
  const moreBtn = document.getElementById('btn-all-sessions');

  if (isGuest) {
    container.innerHTML = `
      <div class="guest-lock-state">
        <span class="guest-lock-icon">🔒</span>
        <p>세션 기록은 로그인 후 이용할 수 있어요.</p>
        <p class="guest-lock-sub">지금 공부는 할 수 있지만 기록은 저장되지 않아요.</p>
      </div>`;
    return;
  }

  if (sessions.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <span class="empty-state-icon">📋</span>
        아직 세션 기록이 없어요.<br />첫 번째 공부 세션을 시작해보세요!
      </div>`;
    return;
  }

  moreBtn.style.display = 'inline';
  container.innerHTML = `<div class="recent-session-list">${sessions.map(s => {
    const total = s.focusedTime + s.distractedTime;
    const rc = s.focusRate >= 70 ? 'good' : s.focusRate >= 40 ? 'ok' : 'bad';
    return `
      <div class="recent-session-row">
        <div class="rs-date">
          <span class="rs-date-label">${fmtDate(s.date)}</span>
          <span class="rs-time">${fmtTime(s.date)}</span>
        </div>
        <div class="rs-mid">
          <span class="rs-duration">${fmtSec(total)}</span>
          <div class="rs-bar-wrap">
            <div class="rs-bar ${rc}" style="width:${s.focusRate}%"></div>
          </div>
        </div>
        <div class="rs-rate ${rc}">${s.focusRate}%</div>
      </div>`;
  }).join('')}</div>`;
}

function handleExit() {
  // TODO: POST /api/auth/logout → 세션 만료 처리
  window.location.href = 'index.html';
}

// ── 유틸 ──────────────────────────────────────────────────

function fmtSec(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분`;
  return `${sec}초`;
}

function fmtDate(iso) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(); yesterday.setDate(today.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return '오늘';
  if (d.toDateString() === yesterday.toDateString()) return '어제';
  return `${d.getMonth() + 1}월 ${d.getDate()}일`;
}

function fmtTime(iso) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, '0');
  return `${h < 12 ? '오전' : '오후'} ${h % 12 || 12}:${m}`;
}

function isToday(iso) {
  return new Date(iso).toDateString() === new Date().toDateString();
}

function isThisWeek(iso) {
  const d = new Date(iso);
  const now = new Date();
  const weekStart = new Date(now); weekStart.setDate(now.getDate() - now.getDay());
  return d >= weekStart;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 6) return '밤에도 열심이네요';
  if (h < 12) return '좋은 아침이에요';
  if (h < 18) return '오후도 화이팅이에요';
  return '오늘 하루도 수고했어요';
}

// ── 데모 데이터 (실제 API로 교체 예정) ──────────────────────

function getDemoUser() {
  return { nickname: '사용자', points: 0, streak: 0 };
}

function getDemoSessions() {
  // TODO: GET /api/sessions → SessionRecord[]
  return [];
}
