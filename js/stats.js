// stats.js — 통계 페이지

// TODO: API 연동
// GET /api/sessions → SessionRecord[]
// GET /api/sessions/weekly-chart → [{ label, seconds }]

document.addEventListener('DOMContentLoaded', () => {
  initStats();
});

function initStats() {
  // TODO: 실제 API 호출로 교체
  const sessions = getDemoSessions();
  const weeklyChart = getDemoWeeklyChart();

  // 배너
  const totalFocused = sessions.reduce((a, s) => a + s.focusedTime, 0);
  document.getElementById('banner-total-time').textContent = totalFocused > 0 ? fmtSec(totalFocused) : '0분';
  document.getElementById('banner-total-sessions').textContent = `${sessions.length}회`;

  // KPI
  const avgRate = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + s.focusRate, 0) / sessions.length)
    : 0;
  const totalPoints = sessions.reduce((a, s) => a + s.pointsEarned, 0);
  const todaySessions = sessions.filter(s => isToday(s.date));
  const todayFocused = todaySessions.reduce((a, s) => a + s.focusedTime, 0);

  document.getElementById('kpi-total-time').textContent = totalFocused > 0 ? fmtSec(totalFocused) : '-';
  document.getElementById('kpi-today-time').textContent = `오늘 ${todayFocused > 0 ? fmtSec(todayFocused) : '0분'}`;
  document.getElementById('kpi-avg-rate').textContent = sessions.length > 0 ? `${avgRate}%` : '-';
  if (sessions.length > 0) document.getElementById('kpi-avg-rate').className = `stats-kpi-value ${rateClass(avgRate)}`;
  document.getElementById('kpi-total-sessions').textContent = sessions.length > 0 ? `${sessions.length}회` : '-';
  document.getElementById('kpi-today-sessions').textContent = `오늘 ${todaySessions.length}회`;
  document.getElementById('kpi-points').textContent = totalPoints > 0 ? `${totalPoints.toLocaleString()}P` : '-';

  // 주간 차트
  renderWeeklyChart(weeklyChart);

  // 오늘 공부 현황
  renderTodaySessions(todaySessions, todayFocused);

  // 최고 세션
  renderBestSession(sessions);

  // 세션 테이블
  renderSessionTable(sessions);

  // 네브바
  document.getElementById('nav-nickname').textContent = getDemoUser().nickname;
}

function renderWeeklyChart(chart) {
  const container = document.getElementById('weekly-chart');
  const maxVal = Math.max(...chart.map(c => c.seconds), 1);
  const hasData = chart.some(c => c.seconds > 0);

  if (!hasData) {
    container.innerHTML = `<div class="stats-empty"><span>📭</span><p>아직 공부 기록이 없어요</p></div>`;
    return;
  }

  container.innerHTML = chart.map(item => {
    const pct = Math.round((item.seconds / maxVal) * 100);
    const isToday = item.label === '오늘';
    return `
      <div class="stats-chart-col">
        <div class="stats-chart-bar-wrap">
          ${item.seconds > 0 ? `<div class="stats-chart-val">${item.seconds >= 3600 ? Math.floor(item.seconds/3600)+'h' : Math.floor(item.seconds/60)+'m'}</div>` : ''}
          <div class="stats-chart-bar ${isToday ? 'today' : ''}" style="height:${Math.max(pct, item.seconds > 0 ? 6 : 0)}%"></div>
        </div>
        <div class="stats-chart-label ${isToday ? 'today' : ''}">${item.label}</div>
      </div>`;
  }).join('');
}

function renderTodaySessions(sessions, totalFocused) {
  const container = document.getElementById('today-sessions-content');
  if (sessions.length === 0) {
    container.innerHTML = '<div class="stats-empty-sm">아직 오늘 세션이 없어요.</div>';
    return;
  }
  container.innerHTML = `
    <div class="stats-today-list">
      ${sessions.map(s => `
        <div class="stats-today-row">
          <span class="stats-today-time">${fmtTime(s.date)}</span>
          <div class="stats-today-bar-wrap">
            <div class="stats-today-bar ${rateClass(s.focusRate)}" style="width:${s.focusRate}%"></div>
          </div>
          <span class="stats-today-rate ${rateClass(s.focusRate)}">${s.focusRate}%</span>
        </div>`).join('')}
      <div class="stats-today-total">오늘 총 <strong>${fmtSec(totalFocused)}</strong> 집중</div>
    </div>`;
}

function renderBestSession(sessions) {
  const container = document.getElementById('best-session-content');
  if (sessions.length === 0) {
    container.innerHTML = '<div class="stats-empty-sm">세션을 시작해보세요.</div>';
    return;
  }
  const best = sessions.reduce((b, s) => !b || s.focusRate > b.focusRate ? s : b, null);
  container.innerHTML = `
    <div class="stats-best">
      <div class="stats-best-rate ${rateClass(best.focusRate)}">${best.focusRate}%</div>
      <div class="stats-best-info">
        <span>${fmtDate(best.date)} ${fmtTime(best.date)}</span>
        <span>${fmtSec(best.focusedTime + best.distractedTime)} 세션</span>
      </div>
    </div>`;
}

let currentPage = 1;
const PAGE_SIZE = 10;
let allSessions = [];

function renderSessionTable(sessions) {
  allSessions = sessions;
  document.getElementById('table-desc').textContent = `최근 ${Math.min(sessions.length, PAGE_SIZE)}개 세션`;
  renderPage(1);
}

function renderPage(page) {
  currentPage = page;
  const container = document.getElementById('sessions-table-content');
  if (allSessions.length === 0) {
    container.innerHTML = `<div class="stats-empty"><span>📋</span><p>아직 세션 기록이 없어요. 공부를 시작해보세요!</p></div>`;
    return;
  }

  const totalPages = Math.ceil(allSessions.length / PAGE_SIZE);
  const paged = allSessions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  let html = `<div class="stats-table-wrap">
    <table class="stats-table">
      <thead><tr><th>날짜</th><th>시간</th><th>세션 길이</th><th>집중률</th><th>집중 시간</th><th>포인트</th></tr></thead>
      <tbody>
        ${paged.map(s => {
          const total = s.focusedTime + s.distractedTime;
          const rc = rateClass(s.focusRate);
          return `<tr>
            <td class="stats-td-date">${fmtDate(s.date)}</td>
            <td class="stats-td-time">${fmtTime(s.date)}</td>
            <td>${fmtSec(total)}</td>
            <td>
              <div class="stats-td-rate-wrap">
                <div class="stats-td-bar-bg"><div class="stats-td-bar ${rc}" style="width:${s.focusRate}%"></div></div>
                <span class="stats-td-rate ${rc}">${s.focusRate}%</span>
              </div>
            </td>
            <td>${fmtSec(s.focusedTime)}</td>
            <td class="stats-td-points">+${s.pointsEarned}P</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;

  if (totalPages > 1) {
    html += `<div class="stats-pagination">
      <button class="stats-page-btn stats-page-arrow" onclick="renderPage(${page-1})" ${page===1?'disabled':''}>←</button>
      ${Array.from({length:totalPages},(_,i)=>i+1).map(n=>
        `<button class="stats-page-btn${n===page?' active':''}" onclick="renderPage(${n})">${n}</button>`
      ).join('')}
      <button class="stats-page-btn stats-page-arrow" onclick="renderPage(${page+1})" ${page===totalPages?'disabled':''}>→</button>
    </div>`;
  }

  html += '</div>';
  container.innerHTML = html;
}

function handleExit() {
  // TODO: POST /api/auth/logout
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
  const yesterday = new Date(); yesterday.setDate(today.getDate()-1);
  if (d.toDateString() === today.toDateString()) return '오늘';
  if (d.toDateString() === yesterday.toDateString()) return '어제';
  return `${d.getMonth()+1}월 ${d.getDate()}일`;
}
function fmtTime(iso) {
  const d = new Date(iso);
  const h = d.getHours();
  const m = String(d.getMinutes()).padStart(2,'0');
  return `${h<12?'오전':'오후'} ${h%12||12}:${m}`;
}
function isToday(iso) { return new Date(iso).toDateString() === new Date().toDateString(); }
function rateClass(r) { return r >= 70 ? 'good' : r >= 40 ? 'ok' : 'bad'; }

// ── 데모 데이터 ────────────────────────────────────────────

function getDemoUser() { return { nickname: '사용자' }; }

function getDemoSessions() {
  // TODO: GET /api/sessions
  return [];
}

function getDemoWeeklyChart() {
  // TODO: GET /api/sessions/weekly-chart
  const days = ['월', '화', '수', '목', '금', '토', '오늘'];
  return days.map(label => ({ label, seconds: 0 }));
}
