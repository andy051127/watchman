// planner.js — 플래너 (달력 + 노트북 + D-Day)

// TODO: API 연동
// GET /api/planner/todos?date=YYYY-MM-DD → Todo[]
// POST /api/planner/todos { date, text } → Todo
// PUT /api/planner/todos/:id { done }
// DELETE /api/planner/todos/:id
// GET /api/planner/ddays → DDay[]
// POST /api/planner/ddays { name, date }
// DELETE /api/planner/ddays/:id
// GET /api/planner/timetable?date=YYYY-MM-DD → { [hour]: text }
// PUT /api/planner/timetable/:date/:hour { text }

let currentYear, currentMonth, selectedDate;
let todos = {}; // { 'YYYY-MM-DD': [{ id, text, done }] }
let ddays = [];  // [{ id, name, date }]
let timetable = {}; // { 'YYYY-MM-DD': { [hour]: text } }

document.addEventListener('DOMContentLoaded', () => {
  const now = new Date();
  currentYear = now.getFullYear();
  currentMonth = now.getMonth();
  selectedDate = toDateStr(now);

  initCalendar();
  renderNotebook();
  renderDdays();
  updateStats();

  const nickEl = document.getElementById('nav-nickname');
  if (nickEl) nickEl.textContent = '사용자';
});

// ── 달력 ──────────────────────────────────────────────────

function changeMonth(delta) {
  currentMonth += delta;
  if (currentMonth < 0) { currentMonth = 11; currentYear--; }
  if (currentMonth > 11) { currentMonth = 0; currentYear++; }
  initCalendar();
}

function initCalendar() {
  const label = document.getElementById('cal-month-label');
  label.textContent = `${currentYear}년 ${currentMonth + 1}월`;

  const grid = document.getElementById('calendar-grid');
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  let html = days.map(d => `<div class="cal-day-header">${d}</div>`).join('');

  const firstDay = new Date(currentYear, currentMonth, 1).getDay();
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const daysInPrev = new Date(currentYear, currentMonth, 0).getDate();

  // 이전 달
  for (let i = firstDay - 1; i >= 0; i--) {
    html += `<div class="cal-day other-month"><span class="cal-day-num">${daysInPrev - i}</span></div>`;
  }

  const today = toDateStr(new Date());

  for (let d = 1; d <= daysInMonth; d++) {
    const dateStr = `${currentYear}-${String(currentMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const dow = new Date(currentYear, currentMonth, d).getDay();
    const isToday = dateStr === today;
    const isSel = dateStr === selectedDate;
    const hasTodos = (todos[dateStr] || []).length > 0;
    const cls = [
      'cal-day',
      dow === 0 ? 'sunday' : dow === 6 ? 'saturday' : '',
      isToday && !isSel ? 'today' : '',
      isSel ? 'selected' : ''
    ].filter(Boolean).join(' ');

    html += `<div class="${cls}" onclick="selectDate('${dateStr}')">
      <span class="cal-day-num">${d}</span>
      ${hasTodos ? '<div class="cal-day-dot"></div>' : ''}
    </div>`;
  }

  // 다음 달
  const total = firstDay + daysInMonth;
  const remaining = total % 7 === 0 ? 0 : 7 - (total % 7);
  for (let d = 1; d <= remaining; d++) {
    html += `<div class="cal-day other-month"><span class="cal-day-num">${d}</span></div>`;
  }

  grid.innerHTML = html;
}

function selectDate(dateStr) {
  selectedDate = dateStr;
  initCalendar();
  renderNotebook();
}

function toDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// ── 노트북 ─────────────────────────────────────────────────

const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
const MONTHS_KR = ['1월','2월','3월','4월','5월','6월','7월','8월','9월','10월','11월','12월'];

function renderNotebook() {
  const d = new Date(selectedDate + 'T00:00:00');
  document.getElementById('nb-day').textContent = d.getDate();
  document.getElementById('nb-weekday').textContent = WEEKDAYS[d.getDay()];
  document.getElementById('nb-month-year').textContent = `${d.getFullYear()}년 ${MONTHS_KR[d.getMonth()]}`;

  renderTodoList();
  renderTimetable();
}

// ── 할 일 ──────────────────────────────────────────────────

function renderTodoList() {
  const list = todos[selectedDate] || [];
  const container = document.getElementById('todo-list');

  container.innerHTML = list.map((item, i) => `
    <div class="todo-item">
      <input type="checkbox" class="todo-checkbox" ${item.done ? 'checked' : ''}
        onchange="toggleTodo(${i})" />
      <span class="todo-text ${item.done ? 'done' : ''}">${escHtml(item.text)}</span>
      <button class="todo-delete-btn" onclick="deleteTodo(${i})">✕</button>
    </div>`).join('');

  updateStats();
}

function addTodo() {
  const input = document.getElementById('todo-input');
  const text = input.value.trim();
  if (!text) return;

  if (!todos[selectedDate]) todos[selectedDate] = [];
  // TODO: POST /api/planner/todos { date: selectedDate, text }
  todos[selectedDate].push({ id: Date.now(), text, done: false });
  input.value = '';
  renderTodoList();
  initCalendar(); // 점 업데이트
}

function toggleTodo(index) {
  const list = todos[selectedDate];
  if (!list || !list[index]) return;
  // TODO: PUT /api/planner/todos/:id { done: !list[index].done }
  list[index].done = !list[index].done;
  renderTodoList();
}

function deleteTodo(index) {
  const list = todos[selectedDate];
  if (!list) return;
  // TODO: DELETE /api/planner/todos/:id
  list.splice(index, 1);
  renderTodoList();
  initCalendar();
}

// ── 시간표 ──────────────────────────────────────────────────

function renderTimetable() {
  const container = document.getElementById('timetable-grid');
  const dayTable = (timetable[selectedDate] || {});

  let html = '';
  for (let h = 6; h <= 23; h++) {
    const label = `${h < 12 ? '오전' : '오후'} ${h <= 12 ? h : h-12}시`;
    const val = dayTable[h] || '';
    html += `
      <div class="timetable-row">
        <span class="timetable-hour">${h}시</span>
        <div class="timetable-cell ${val ? 'filled' : ''}" onclick="editTimetableCell(${h}, this)">
          ${val ? escHtml(val) : ''}
        </div>
      </div>`;
  }
  container.innerHTML = html;
}

function editTimetableCell(hour, cell) {
  const current = cell.textContent.trim();
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'timetable-cell-input';
  input.value = current;
  input.placeholder = '일정 입력...';
  cell.innerHTML = '';
  cell.appendChild(input);
  input.focus();

  function save() {
    const val = input.value.trim();
    if (!timetable[selectedDate]) timetable[selectedDate] = {};
    // TODO: PUT /api/planner/timetable/:date/:hour { text: val }
    timetable[selectedDate][hour] = val;
    renderTimetable();
  }
  input.addEventListener('blur', save);
  input.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } });
}

// ── D-Day ──────────────────────────────────────────────────

function addDday() {
  const name = document.getElementById('dday-name').value.trim();
  const date = document.getElementById('dday-date').value;
  if (!name || !date) return;

  // TODO: POST /api/planner/ddays { name, date }
  ddays.push({ id: Date.now(), name, date });
  document.getElementById('dday-name').value = '';
  document.getElementById('dday-date').value = '';
  renderDdays();
  updateStats();
}

function removeDday(id) {
  // TODO: DELETE /api/planner/ddays/:id
  ddays = ddays.filter(d => d.id !== id);
  renderDdays();
  updateStats();
}

function renderDdays() {
  const container = document.getElementById('dday-list');
  if (ddays.length === 0) {
    container.innerHTML = '<span class="dday-empty">D-Day를 추가해 보세요.</span>';
    return;
  }
  const today = new Date(); today.setHours(0,0,0,0);
  container.innerHTML = ddays.map(d => {
    const target = new Date(d.date); target.setHours(0,0,0,0);
    const diff = Math.round((target - today) / (1000 * 60 * 60 * 24));
    const label = diff === 0 ? 'D-Day' : diff > 0 ? `D-${diff}` : `D+${Math.abs(diff)}`;
    return `
      <div class="dday-badge">
        <span class="dday-badge-name">${escHtml(d.name)}</span>
        <span class="dday-badge-count">${label}</span>
        <button class="dday-delete-btn" onclick="removeDday(${d.id})">✕</button>
      </div>`;
  }).join('');
}

// ── 통계 칩 업데이트 ────────────────────────────────────────

function updateStats() {
  const list = todos[selectedDate] || [];
  document.getElementById('stat-todo-total').textContent = `${list.length}개`;
  document.getElementById('stat-todo-done').textContent = `${list.filter(t => t.done).length}개`;

  const today = new Date(); today.setHours(0,0,0,0);
  const nearestDday = ddays
    .map(d => { const t = new Date(d.date); t.setHours(0,0,0,0); return { name: d.name, diff: Math.round((t-today)/(1000*60*60*24)) }; })
    .filter(d => d.diff >= 0)
    .sort((a,b) => a.diff - b.diff)[0];
  document.getElementById('stat-dday').textContent = nearestDday
    ? (nearestDday.diff === 0 ? 'D-Day!' : `D-${nearestDday.diff}`)
    : '없음';

}

// ── 유틸 ──────────────────────────────────────────────────

function escHtml(s) {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function handleExit() {
  window.location.href = 'index.html';
}
