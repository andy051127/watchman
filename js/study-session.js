// study-session.js — 스터디 세션 UI (카메라 + 상태 관리)
// MediaPipe 연동은 백엔드 연결 후 구현 예정
// 현재는 UI 상태 전환 및 타이머만 동작

const MUSIC_TRACKS = [
  {name: 'Space', artist: 'Charlieonnafirday', file: 'Space.mp3'},
  {name: 'Side Effects', artist: 'Zayn', file: 'Side-effects.mp3'},
  {name: 'Planez', artist: 'Jeremih', file: 'Planez.mp3'},
];

const musicAudio = new Audio();
musicAudio.volume = 0.6;
musicAudio.addEventListener('ended', () => musicNext());

let currentTrackIdx = 0;
let isMusicPlaying = false;
let isShuffle = false;

function toggleMusic() {
  if (MUSIC_TRACKS.length === 0) return;
  if (isMusicPlaying) {
    musicAudio.pause();
    isMusicPlaying = false;
  } else {
    if (!musicAudio.src || musicAudio.src === window.location.href) loadTrack(currentTrackIdx, false);
    musicAudio.play();
    isMusicPlaying = true;
  }
  updateMusicUI();
}

function musicPrev() {
  if (MUSIC_TRACKS.length === 0) return;
  currentTrackIdx = (currentTrackIdx - 1 + MUSIC_TRACKS.length) % MUSIC_TRACKS.length;
  loadTrack(currentTrackIdx, true);
}

function musicNext() {
  if (MUSIC_TRACKS.length === 0) return;
  if (isShuffle) {
    let next;
    do { next = Math.floor(Math.random() * MUSIC_TRACKS.length); } while (next === currentTrackIdx && MUSIC_TRACKS.length > 1);
    currentTrackIdx = next;
  } else {
    currentTrackIdx = (currentTrackIdx + 1) % MUSIC_TRACKS.length;
  }
  loadTrack(currentTrackIdx, true);
}

function loadTrack(idx, andPlay = false) {
  const t = MUSIC_TRACKS[idx];
  document.getElementById('music-track-name').textContent = t.name;
  document.getElementById('music-track-artist').textContent = t.artist;
  musicAudio.src = `assets/music/${t.file}`;
  if (andPlay) { musicAudio.play(); isMusicPlaying = true; }
  updateMusicUI();
}

function setMusicVolume(val) {
  document.getElementById('music-vol-pct').textContent = `${val}%`;
  musicAudio.volume = parseInt(val) / 100;
}

function toggleShuffle() {
  isShuffle = !isShuffle;
  document.getElementById('btn-shuffle').classList.toggle('active', isShuffle);
}

function updateMusicUI() {
  const btn = document.getElementById('btn-music-play');
  const hasTrack = MUSIC_TRACKS.length > 0;
  btn.textContent = isMusicPlaying ? '⏸ 일시정지' : '▶ 재생';
  btn.classList.toggle('active', isMusicPlaying);
  btn.disabled = !hasTrack;
}

document.addEventListener('DOMContentLoaded', () => {
  if (MUSIC_TRACKS.length > 0) {
    document.getElementById('music-track-name').textContent = MUSIC_TRACKS[0].name;
    document.getElementById('music-track-artist').textContent = MUSIC_TRACKS[0].artist;
  } else {
    document.getElementById('music-track-name').textContent = '트랙 없음';
    document.getElementById('music-track-artist').textContent = 'assets/music/ 에 MP3를 추가하세요';
  }
  updateMusicUI();
});

// ── 앰비언스 믹서 (MP3) ─────────────────────────────────────
// MP3 파일은 assets/ambient/ 폴더에 넣으세요.
// 파일명: rain.mp3 / cafe.mp3 / nature.mp3 / fire.mp3

const AMBIENT_FILES = {
  rain:   'assets/ambient/rain.mp3',
  cafe:   'assets/ambient/cafe.mp3',
  nature: 'assets/ambient/nature.mp3',
  fire:   'assets/ambient/fire.mp3',
};

const ambientAudios = {};

function getAmbientAudio(type) {
  if (!ambientAudios[type]) {
    const audio = new Audio(AMBIENT_FILES[type]);
    audio.loop = true;
    audio.volume = 0;
    ambientAudios[type] = audio;
  }
  return ambientAudios[type];
}

function setAmbient(type, val) {
  document.getElementById(`pct-${type}`).textContent = `${val}%`;
  const volume = parseInt(val) / 100;
  const audio = getAmbientAudio(type);
  audio.volume = volume;
  if (volume > 0 && audio.paused) audio.play();
  if (volume === 0 && !audio.paused) audio.pause();
}

// ── 세션 상태 ──────────────────────────────────────────────

let sessionState = 'idle'; // 'idle' | 'camera_on' | 'studying'
let stream = null;
let timerInterval = null;
let totalSec = 0;
let focusedSec = 0;
let distractedSec = 0;
const isGuest = new URLSearchParams(window.location.search).get('guest') === '1';

// ── 카메라 버튼 ────────────────────────────────────────────

async function handleCamBtn() {
  const btn = document.getElementById('btn-cam');
  if (sessionState === 'idle') {
    await startCamera();
  } else {
    if (sessionState === 'studying') pauseSession();
    stopCamera();
    setState('idle');
  }
}

async function startCamera() {
  const btn = document.getElementById('btn-cam');
  btn.disabled = true;
  btn.textContent = '연결 중...';
  document.getElementById('cam-off-msg').style.display = 'none';
  document.getElementById('cam-loading').style.display = 'flex';

  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: true });
    const video = document.getElementById('webcam-video');
    video.srcObject = stream;
    video.play();
    document.getElementById('cam-loading').style.display = 'none';
    document.getElementById('cam-off-msg').style.display = 'none';

    // TODO: MediaPipe FaceLandmarker 초기화
    // await initDetector();

    setState('camera_on');
    btn.disabled = false;
    btn.textContent = '카메라 끄기';

    // 카메라 켜짐 배지
    const badge = document.getElementById('focus-badge');
    badge.className = 'session-badge standby';
    badge.textContent = '카메라 켜짐';
    badge.style.display = 'inline';

  } catch (err) {
    document.getElementById('cam-loading').style.display = 'none';
    document.getElementById('cam-off-msg').style.display = 'flex';
    document.getElementById('cam-error').textContent = '카메라 접근이 거부됐어요. 브라우저 설정을 확인해 주세요.';
    document.getElementById('cam-error').style.display = 'block';
    btn.disabled = false;
    btn.textContent = '카메라 켜기';
  }
}

function stopCamera() {
  if (stream) {
    stream.getTracks().forEach(t => t.stop());
    stream = null;
    document.getElementById('webcam-video').srcObject = null;
  }
  document.getElementById('cam-off-msg').style.display = 'flex';
  document.getElementById('focus-badge').style.display = 'none';
}

// ── 스터디 시작/종료 버튼 ─────────────────────────────────

function handleStudyBtn() {
  if (sessionState === 'camera_on') {
    startStudy();
  } else if (sessionState === 'studying') {
    const ok = confirm('스터디가 진행 중입니다.\n종료하면 현재 스터디가 끝납니다. 종료하시겠습니까?');
    if (!ok) return;
    endStudy(true);
  }
}

function startStudy() {
  setState('studying');
  startTimer();

  // TODO: MediaPipe 감지 루프 시작
  // startDetectionLoop();

  // 시뮬레이션: 랜덤하게 집중/비집중 상태 토글 (실제 MediaPipe로 교체)
  simulateFocusState();
}

function pauseSession() {
  clearInterval(timerInterval);
  timerInterval = null;
}

function endStudy(save = true) {
  clearInterval(timerInterval);
  timerInterval = null;
  stopCamera();

  if (!isGuest && save && (focusedSec + distractedSec) > 0) {
    const total = focusedSec + distractedSec;
    const focusRate = Math.round((focusedSec / total) * 100);
    // TODO: POST /api/sessions {
    //   focusedTime: focusedSec,
    //   distractedTime: distractedSec,
    //   focusRate
    // }
    console.log('세션 저장 예정:', { focusedSec, distractedSec, focusRate });
  }

  window.location.href = 'main.html';
}

// ── 타이머 ──────────────────────────────────────────────

function startTimer() {
  timerInterval = setInterval(() => {
    totalSec++;
    updateTimerDisplay();
  }, 1000);
}

function updateTimerDisplay() {
  const fmt = sec => {
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (h > 0) return `${h}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
    return `${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')}`;
  };

  document.getElementById('timer-display').textContent = fmt(totalSec);
  document.getElementById('nav-timer').textContent = fmt(totalSec);
  document.getElementById('stat-focused-time').textContent = fmt(focusedSec);
  document.getElementById('stat-distracted-time').textContent = fmt(distractedSec);

  const total = focusedSec + distractedSec;
  const rate = total > 0 ? Math.round((focusedSec / total) * 100) : 0;
  const rateEl = document.getElementById('stat-focus-rate');
  rateEl.textContent = `${rate}%`;
  rateEl.className = 'ssc-row-val ' + rateClass(rate);
  document.getElementById('focus-rate-bar').style.width = `${rate}%`;
  document.getElementById('focus-rate-bar').className = `ssc-bar-fill ${rateClass(rate)}`;
}

function rateClass(r) { return r >= 70 ? 'good' : r >= 40 ? 'ok' : 'bad'; }

// ── 집중 상태 시뮬레이션 (실제 MediaPipe로 교체 예정) ─────

let isFocused = true;
let simInterval = null;

function simulateFocusState() {
  updateFocusUI(true); // 초기 집중 상태
  // 실제 구현 시 MediaPipe 감지 결과로 교체
  // setInterval(() => { updateFocusUI(detectionResult.isFocused); }, 200);
  simInterval = setInterval(() => {
    if (sessionState !== 'studying') { clearInterval(simInterval); return; }
    // 타이머에서 집중/비집중 시간 누적
    if (isFocused) focusedSec++; else distractedSec++;
  }, 1000);
}

function updateFocusUI(focused) {
  isFocused = focused;
  const pill = document.getElementById('status-pill');
  const label = document.getElementById('status-label');
  const badge = document.getElementById('focus-badge');
  const overlay = document.getElementById('distraction-overlay');
  const frame = document.getElementById('camera-frame');

  if (focused) {
    pill.className = 'session-status-pill focused';
    label.textContent = '집중 중';
    badge.className = 'session-badge focused';
    badge.textContent = '집중 중';
    overlay.style.display = 'none';
    frame.classList.remove('distracted');
  } else {
    pill.className = 'session-status-pill distracted';
    label.textContent = '딴짓 감지!';
    badge.className = 'session-badge distracted';
    badge.textContent = '딴짓 감지!';
    overlay.style.display = 'block';
    frame.classList.add('distracted');
  }
  badge.style.display = 'inline';
}

// ── 상태 전환 ─────────────────────────────────────────────

function setState(state) {
  sessionState = state;
  const camBtn = document.getElementById('btn-cam');
  const studyBtn = document.getElementById('btn-study');
  const hint = document.getElementById('controls-hint');
  const timerSub = document.getElementById('timer-sub');
  const navTimer = document.getElementById('nav-timer');
  const timerDisplay = document.getElementById('timer-display');
  const statusPill = document.getElementById('status-pill');
  const statusLabel = document.getElementById('status-label');

  if (state === 'idle') {
    camBtn.textContent = '카메라 켜기';
    studyBtn.textContent = '스터디 시작하기';
    studyBtn.className = 'btn-study-main inactive';
    studyBtn.disabled = true;
    hint.textContent = '카메라를 켜면 스터디를 시작할 수 있어요';
    timerSub.textContent = totalSec > 0 ? '일시정지됨 — 카메라를 켜서 이어하세요' : '카메라를 켜고 시작해보세요';
    navTimer.style.display = 'none';
    timerDisplay.classList.remove('running');
    statusPill.className = 'session-status-pill';
    statusLabel.textContent = '대기 중';
  } else if (state === 'camera_on') {
    camBtn.textContent = '카메라 끄기';
    studyBtn.textContent = '스터디 시작하기';
    studyBtn.className = 'btn-study-main active';
    studyBtn.disabled = false;
    hint.textContent = '카메라가 켜졌어요. 스터디를 시작해보세요!';
    timerSub.textContent = '스터디 시작 버튼을 눌러보세요';
    statusPill.className = 'session-status-pill';
    statusLabel.textContent = '대기 중';
  } else if (state === 'studying') {
    camBtn.textContent = '카메라 끄기 / 일시정지';
    studyBtn.textContent = '스터디 종료';
    studyBtn.className = 'btn-study-main active';
    studyBtn.disabled = false;
    hint.textContent = '카메라를 끄면 일시정지돼요. 이어서 할 수 있어요';
    timerSub.textContent = '타이머 진행 중';
    navTimer.style.display = 'inline';
    timerDisplay.classList.add('running');
  }
}
