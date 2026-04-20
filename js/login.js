// login.js — 로그인 / 회원가입 UI

function switchTab(tab) {
  const loginForm = document.getElementById('form-login');
  const signupForm = document.getElementById('form-signup');
  const tabLogin = document.getElementById('tab-login');
  const tabSignup = document.getElementById('tab-signup');
  const subtitle = document.getElementById('login-subtitle');

  if (tab === 'login') {
    loginForm.style.display = 'flex';
    signupForm.style.display = 'none';
    tabLogin.classList.add('active');
    tabSignup.classList.remove('active');
    subtitle.textContent = '다시 오셨군요! 반가워요.';
  } else {
    loginForm.style.display = 'none';
    signupForm.style.display = 'flex';
    tabLogin.classList.remove('active');
    tabSignup.classList.add('active');
    subtitle.textContent = '함께 공부해봐요!';
  }
}

function togglePw(inputId, btn) {
  const input = document.getElementById(inputId);
  const isHidden = input.type === 'password';
  input.type = isHidden ? 'text' : 'password';
  btn.innerHTML = isHidden
    ? `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/>
        <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/>
        <line x1="1" y1="1" x2="23" y2="23"/>
      </svg>`
    : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>`;
}

function checkCustomDomain() {
  const select = document.getElementById('signup-email-domain');
  const customInput = document.getElementById('signup-email-custom');
  customInput.style.display = select.value === '직접입력' ? 'block' : 'none';
}

function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById('login-email').value.trim();
  const pw = document.getElementById('login-pw').value;
  const errorEl = document.getElementById('login-error');

  // TODO: API 호출 → POST /api/auth/login { email, password }
  // 임시: 이메일/비밀번호 입력 확인만
  if (!email || !pw) {
    showError(errorEl, '이메일과 비밀번호를 입력해 주세요.');
    return;
  }

  // 성공 시 메인 페이지 이동
  // TODO: 서버 응답에서 토큰/세션 처리 후 이동
  window.location.href = 'main.html';
}

function handleSignup(e) {
  e.preventDefault();
  const nickname = document.getElementById('signup-nickname').value.trim();
  const emailLocal = document.getElementById('signup-email-local').value.trim();
  const domain = document.getElementById('signup-email-domain').value;
  const customDomain = document.getElementById('signup-email-custom').value.trim();
  const pw = document.getElementById('signup-pw').value;
  const pwConfirm = document.getElementById('signup-pw-confirm').value;
  const errorEl = document.getElementById('signup-error');

  if (nickname.length < 2) {
    showError(errorEl, '닉네임은 2자 이상으로 입력해 주세요.');
    return;
  }
  if (!emailLocal) {
    showError(errorEl, '이메일 아이디를 입력해 주세요.');
    return;
  }
  if (domain === '직접입력' && !customDomain) {
    showError(errorEl, '도메인을 입력해 주세요.');
    return;
  }
  if (pw.length < 6) {
    showError(errorEl, '비밀번호는 6자 이상으로 입력해 주세요.');
    return;
  }
  if (pw !== pwConfirm) {
    showError(errorEl, '비밀번호가 일치하지 않아요.');
    return;
  }

  const fullEmail = `${emailLocal}@${domain === '직접입력' ? customDomain : domain}`;

  // TODO: API 호출 → POST /api/auth/register { nickname, email: fullEmail, password: pw }
  // 성공 시 메인 페이지 이동
  window.location.href = 'main.html';
}

function showError(el, msg) {
  el.textContent = '⚠ ' + msg;
  el.style.display = 'block';
}
