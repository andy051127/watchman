// mypage.js — 마이페이지 UI

// TODO: API 연동
// GET /api/users/me → { nickname, email, createdAt }
// GET /api/sessions → SessionRecord[]
// PUT /api/users/me/nickname → { nickname }
// PUT /api/users/me/password → { currentPassword, newPassword }
// PUT /api/users/me/avatar → FormData { file }
// DELETE /api/users/me → 회원 탈퇴

document.addEventListener('DOMContentLoaded', () => {
  initMyPage();
});

function initMyPage() {
  // TODO: 실제 API 호출로 교체
  const user = getDemoUser();
  const sessions = getDemoSessions();

  // 프로필 정보
  document.getElementById('nav-nickname').textContent = user.nickname;
  document.getElementById('profile-name').textContent = user.nickname;
  document.getElementById('profile-email').textContent = user.email;
  document.getElementById('profile-joined').textContent = `가입일 ${fmtJoinDate(user.createdAt)}`;
  document.getElementById('nick-display').textContent = user.nickname;

  // 통계
  const totalFocused = sessions.reduce((a, s) => a + s.focusedTime, 0);
  const avgRate = sessions.length > 0
    ? Math.round(sessions.reduce((a, s) => a + s.focusRate, 0) / sessions.length)
    : 0;
  document.getElementById('my-total-time').textContent = totalFocused > 0 ? fmtSec(totalFocused) : '-';
  document.getElementById('my-total-sessions').textContent = sessions.length > 0 ? `${sessions.length}회` : '-';
  document.getElementById('my-avg-rate').textContent = sessions.length > 0 ? `${avgRate}%` : '-';
}

// ── 프로필 사진 ────────────────────────────────────────────

function handleFileChange(e) {
  const file = e.target.files[0];
  if (!file || !file.type.startsWith('image/')) return;

  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = 200; canvas.height = 200;
      const ctx = canvas.getContext('2d');
      const size = Math.min(img.width, img.height);
      const sx = (img.width - size) / 2;
      const sy = (img.height - size) / 2;
      ctx.drawImage(img, sx, sy, size, size, 0, 0, 200, 200);
      const base64 = canvas.toDataURL('image/jpeg', 0.85);

      // TODO: PUT /api/users/me/avatar (FormData로 전송)
      // 임시: base64 미리보기만
      showAvatarImg(base64);
      document.getElementById('avatar-status').textContent = '사진이 설정되어 있어요.';
      document.getElementById('btn-remove-avatar').style.display = 'inline';
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
  e.target.value = '';
}

function showAvatarImg(src) {
  document.getElementById('mypage-avatar-emoji').style.display = 'none';
  const imgEl = document.getElementById('mypage-avatar-img');
  imgEl.src = src;
  imgEl.style.display = 'block';
}

function removeAvatar() {
  // TODO: DELETE /api/users/me/avatar
  document.getElementById('mypage-avatar-emoji').style.display = 'flex';
  document.getElementById('mypage-avatar-img').style.display = 'none';
  document.getElementById('mypage-avatar-img').src = '';
  document.getElementById('avatar-status').textContent = '기본 이모지가 사용 중이에요.';
  document.getElementById('btn-remove-avatar').style.display = 'none';
}

// ── 닉네임 변경 ────────────────────────────────────────────

function toggleNickEdit() {
  document.getElementById('nick-row').style.display = 'none';
  document.getElementById('nick-edit-row').style.display = 'flex';
  document.getElementById('nick-input').value = document.getElementById('nick-display').textContent;
  document.getElementById('nick-input').focus();
}

function cancelNickEdit() {
  document.getElementById('nick-row').style.display = 'flex';
  document.getElementById('nick-edit-row').style.display = 'none';
  document.getElementById('nick-msg').textContent = '';
}

function saveNickname() {
  const val = document.getElementById('nick-input').value.trim();
  const msg = document.getElementById('nick-msg');
  if (!val) { showMsg(msg, '닉네임을 입력해 주세요.', false); return; }

  // TODO: PUT /api/users/me/nickname { nickname: val }
  document.getElementById('nick-display').textContent = val;
  document.getElementById('profile-name').textContent = val;
  document.getElementById('nav-nickname').textContent = val;
  showMsg(msg, '닉네임이 변경됐어요!', true);
  setTimeout(cancelNickEdit, 1000);
}

// ── 비밀번호 변경 ──────────────────────────────────────────

function togglePwEdit() {
  document.getElementById('pw-row').style.display = 'none';
  document.getElementById('pw-edit-row').style.display = 'flex';
}

function cancelPwEdit() {
  document.getElementById('pw-row').style.display = 'flex';
  document.getElementById('pw-edit-row').style.display = 'none';
  ['cur-pw','new-pw','confirm-pw'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('pw-msg').textContent = '';
}

function savePassword() {
  const cur = document.getElementById('cur-pw').value;
  const nw = document.getElementById('new-pw').value;
  const con = document.getElementById('confirm-pw').value;
  const msg = document.getElementById('pw-msg');

  if (!cur || !nw || !con) { showMsg(msg, '모든 항목을 입력해 주세요.', false); return; }
  if (nw.length < 4) { showMsg(msg, '비밀번호는 4자 이상이어야 해요.', false); return; }
  if (nw !== con) { showMsg(msg, '새 비밀번호가 일치하지 않아요.', false); return; }

  // TODO: PUT /api/users/me/password { currentPassword: cur, newPassword: nw }
  showMsg(msg, '비밀번호가 변경됐어요!', true);
  setTimeout(cancelPwEdit, 1000);
}

function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
}

// ── 회원 탈퇴 ──────────────────────────────────────────────

function showDeleteConfirm() {
  document.getElementById('delete-btn-area').style.display = 'none';
  document.getElementById('delete-confirm-area').style.display = 'block';
}

function hideDeleteConfirm() {
  document.getElementById('delete-btn-area').style.display = 'block';
  document.getElementById('delete-confirm-area').style.display = 'none';
}

function handleDelete() {
  // TODO: DELETE /api/users/me
  window.location.href = 'index.html';
}

function handleExit() {
  // TODO: POST /api/auth/logout
  window.location.href = 'index.html';
}

// ── 유틸 ──────────────────────────────────────────────────

function showMsg(el, text, ok) {
  el.textContent = text;
  el.className = `mypage-msg ${ok ? 'ok' : 'err'}`;
}

function fmtSec(sec) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분`;
  return `${sec}초`;
}

function fmtJoinDate(iso) {
  const d = new Date(iso);
  return `${d.getFullYear()}년 ${d.getMonth()+1}월 ${d.getDate()}일`;
}

// ── 데모 데이터 ────────────────────────────────────────────

function getDemoUser() {
  return { nickname: '사용자', email: 'user@example.com', createdAt: new Date().toISOString() };
}

function getDemoSessions() {
  // TODO: GET /api/sessions
  return [];
}
