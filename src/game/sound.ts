// Web Audio API 기반 무의존성 사운드 합성 엔진 (sound.ts)

let audioCtx: AudioContext | null = null;
let bgmGainNode: GainNode | null = null;
let bgmIntervalId: any = null;
let currentVolume = 0.15; // 기본 BGM 볼륨 (15%)
let isMuted = false;

// AudioContext 초기화 및 가드
function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined' || typeof (window as any).AudioContext === 'undefined') {
    return null; // Node.js 테스트 환경 등 브라우저 외 환경 가드
  }
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

// BGM 볼륨 설정
export function setBGMVolume(volume: number) {
  currentVolume = volume;
  if (bgmGainNode && !isMuted) {
    bgmGainNode.gain.setValueAtTime(volume, audioCtx ? audioCtx.currentTime : 0);
  }
}

// BGM 음소거 설정
export function setMute(mute: boolean) {
  isMuted = mute;
  if (bgmGainNode) {
    bgmGainNode.gain.setValueAtTime(mute ? 0 : currentVolume, audioCtx ? audioCtx.currentTime : 0);
  }
}

// BGM 실시간 프로그래밍 합성 루프
export function playBGM() {
  const ctx = getAudioContext();
  if (!ctx) return;

  if (bgmIntervalId) {
    clearInterval(bgmIntervalId);
  }

  // 볼륨 노드 연결
  bgmGainNode = ctx.createGain();
  bgmGainNode.gain.setValueAtTime(isMuted ? 0 : currentVolume, ctx.currentTime);
  bgmGainNode.connect(ctx.destination);

  let step = 0;
  // 사이버펑크 앰비언트 루프 패턴 (비트 및 코드 연주)
  const playBgmStep = () => {
    if (isMuted || !bgmGainNode) return;
    
    const now = ctx.currentTime;
    
    // 1. 저주파 신스 베이스 드론 (8분음표/4분음표 간격 펄스)
    // 멜로디 루프 코드 진행: Dm -> F -> C -> Bb
    const chords = [73.42, 87.31, 65.41, 58.27]; // D2, F2, C2, Bb1
    const chord = chords[Math.floor(step / 8) % chords.length];
    
    const bassOsc = ctx.createOscillator();
    const bassGain = ctx.createGain();
    
    // 사이버펑크 톱니파(sawtooth) 음색
    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(chord, now);
    
    // 로우패스 필터링으로 묵직한 톤 형성
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(250, now);
    
    bassGain.gain.setValueAtTime(0.06, now);
    bassGain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    
    bassOsc.connect(filter);
    filter.connect(bassGain);
    bassGain.connect(bgmGainNode);
    
    bassOsc.start(now);
    bassOsc.stop(now + 0.4);

    // 2. 가벼운 미래지향적 하이해트/비트 소음 (step 간격)
    if (step % 2 === 0) {
      // White Noise 버퍼 생성
      const bufferSize = ctx.sampleRate * 0.04;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.setValueAtTime(6000, now);
      
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.015, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);
      
      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(bgmGainNode);
      
      noise.start(now);
      noise.stop(now + 0.05);
    }

    // 3. 고음 테크노 신스 아르페지오 (16분음표 간격처럼 4스텝마다 가끔 격발)
    if (step % 4 === 2) {
      const melodyFreqs = [146.83, 174.61, 196.00, 220.00, 293.66]; // D3, F3, G3, A3, D4
      const note = melodyFreqs[Math.floor(Math.random() * melodyFreqs.length)];
      
      const leadOsc = ctx.createOscillator();
      const leadGain = ctx.createGain();
      
      leadOsc.type = 'triangle';
      leadOsc.frequency.setValueAtTime(note * 2, now);
      
      leadGain.gain.setValueAtTime(0.03, now);
      leadGain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
      
      leadOsc.connect(leadGain);
      leadGain.connect(bgmGainNode);
      
      leadOsc.start(now);
      leadOsc.stop(now + 0.25);
    }
    
    step = (step + 1) % 32;
  };

  // 180ms 간격으로 스텝 비트 구동
  bgmIntervalId = setInterval(playBgmStep, 180);
}

// BGM 정지
export function stopBGM() {
  if (bgmIntervalId) {
    clearInterval(bgmIntervalId);
    bgmIntervalId = null;
  }
  if (bgmGainNode) {
    bgmGainNode.disconnect();
    bgmGainNode = null;
  }
}

// === 효과음 (SFX) 믹서 ===

// 1. Click/Hover - 고주파 하이테크 비프
export function playClickSFX() {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(1800, now);
  osc.frequency.exponentialRampToValueAtTime(1000, now + 0.06);
  
  gain.gain.setValueAtTime(0.05, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.08);
}

// 2. Play/Install - 미래적인 사이파이 스윕 (Whoosh)
export function playInstallSFX() {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'triangle';
  osc.frequency.setValueAtTime(200, now);
  // 0.2초만에 200Hz에서 1200Hz로 주파수 상승 스윕
  osc.frequency.exponentialRampToValueAtTime(1200, now + 0.22);
  
  gain.gain.setValueAtTime(0.08, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.25);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.3);
}

// 3. Run Start - 긴장감 넘치는 사이파이 경보 비프
export function playAlarmSFX() {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(600, now);
  // 경보처럼 주기적인 주파수 오르내림
  osc.frequency.linearRampToValueAtTime(850, now + 0.08);
  osc.frequency.linearRampToValueAtTime(600, now + 0.16);
  osc.frequency.linearRampToValueAtTime(850, now + 0.24);
  
  gain.gain.setValueAtTime(0.07, now);
  gain.gain.linearRampToValueAtTime(0.07, now + 0.2);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.32);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.35);
}

// 4. Encounter ICE - 지직거리는 디지털 글리치 버즈
export function playGlitchSFX() {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  
  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.18;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  // 노이즈 버퍼에 주파수 변형 글리치 요소 가미
  for (let i = 0; i < bufferSize; i++) {
    const rawNoise = Math.random() * 2 - 1;
    // 특정 비트 격자마다 끊김과 버즈 효과 연출
    data[i] = rawNoise * (Math.sin(i / 18) > 0.3 ? 0.7 : 0.05);
  }
  
  const source = ctx.createBufferSource();
  source.buffer = buffer;
  
  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(1000, now);
  filter.Q.setValueAtTime(5, now);
  
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.06, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.17);
  
  source.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);
  
  source.start(now);
  source.stop(now + 0.2);
}

// 5. Run Success / Score - 밝고 아름다운 해독 성공 아르페지오
export function playSuccessSFX() {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6 아르페지오
  
  notes.forEach((freq, index) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const playTime = now + index * 0.07;
    
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, playTime);
    
    gain.gain.setValueAtTime(0.06, playTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, playTime + 0.16);
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    osc.start(playTime);
    osc.stop(playTime + 0.2);
  });
}

// 6. Failure / Damage - 둔탁한 저주파 에러 경고음
export function playFailureSFX() {
  const ctx = getAudioContext();
  if (!ctx || isMuted) return;
  
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(130, now);
  osc.frequency.linearRampToValueAtTime(80, now + 0.25);
  
  gain.gain.setValueAtTime(0.12, now);
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.28);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start(now);
  osc.stop(now + 0.3);
}
