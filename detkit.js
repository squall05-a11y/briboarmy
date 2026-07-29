// detkit.js — 하네스 결정성 키트 (TASK-02)
// 네 하네스(harness23 / harness27_2p / harness30 / diag)가 공유한다.
// 게임 스크립트를 평가하기 "전에" boot() 문자열을 앞에 붙여 평가한다.
// 순서 계약: ① __rngN=0 선언 → ② Math.random 교체 → ③ 게임 스크립트 평가.
'use strict';

// 게임/봇 코드와 같은 스코프(또는 vm 렐름)에서 평가할 부트스트랩 소스를 만든다.
// opts.timers=true 이면 가상 타이머 큐까지 설치한다(2단계). false면 rng/시계/rAF만(1단계).
function boot(seed, opts) {
  const timers = !!(opts && opts.timers);
  return `
;globalThis.__rngN = 0;                                   // ① 카운터 선언 — 교체보다 먼저
(function(){
  let __s = ${seed | 0};
  globalThis.__reseed = function (x) { __s = x | 0; globalThis.__rngN = 0; };
  Math.random = function () {                              // ② 교체 — 스크립트 평가보다 먼저
    globalThis.__rngN++;
    __s = (__s + 0x6D2B79F5) | 0;
    let t = Math.imul(__s ^ (__s >>> 15), 1 | __s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
})();
(function(){
  // ── 가상 시계: 하네스가 시뮬 시각 T(초)를 소유한다 ──
  let T = 0;
  globalThis.performance = { now: function () { return T * 1000; } };
  globalThis.requestAnimationFrame = function () { return 0; }; // 이중 스텝 차단
  globalThis.cancelAnimationFrame = function () {};
  globalThis.__vtNow = function () { return T; };
${timers ? `
  // ── 가상 타이머 큐 (TASK-02 §2 명세) ──
  let q = [], seq = 0, nextId = 1;
  globalThis.__vtErrs = [];
  globalThis.setTimeout = function (fn, ms) {
    const id = nextId++;
    if (typeof fn === 'function')
      q.push({ id: id, due: T + (ms || 0) / 1000, seq: seq++, fn: fn,
               args: Array.prototype.slice.call(arguments, 2), every: null });
    return id;
  };
  globalThis.setInterval = function (fn, ms) {
    const id = nextId++;
    if (typeof fn === 'function')
      q.push({ id: id, due: T + (ms || 0) / 1000, seq: seq++, fn: fn,
               args: Array.prototype.slice.call(arguments, 2),
               every: Math.max((ms || 0) / 1000, 0.001) });
    return id;
  };
  globalThis.clearTimeout = globalThis.clearInterval = function (id) {
    for (let i = q.length - 1; i >= 0; i--) if (q[i].id === id) q.splice(i, 1);
  };
  globalThis.__vtTick = function (dt) { T += dt; };
  globalThis.__vtFlush = function () {
    // 만기분 스냅샷 — 콜백 실행 중 새로 등록된 타이머는 이번 라운드에서 실행하지 않는다
    const due = q.filter(function (e) { return e.due <= T; })
                 .sort(function (a, b) { return (a.due - b.due) || (a.seq - b.seq); });
    for (const e of due) {
      const i = q.indexOf(e);
      if (i < 0) continue;                                 // 앞선 콜백이 clear한 항목
      if (e.every != null) { e.due += e.every; e.seq = seq++; }
      else q.splice(i, 1);
      try { e.fn.apply(null, e.args); }
      catch (err) { globalThis.__vtErrs.push(String(err && err.message || err)); }
    }
  };
  globalThis.__vtReset = function (seedX) {
    T = 0; q = []; seq = 0; globalThis.__vtErrs = [];
    if (seedX !== undefined) globalThis.__reseed(seedX);
  };
  globalThis.__vtPending = function () { return q.length; };
` : `
  // (1단계) 타이머 큐 미설치 — setTimeout/setInterval은 하네스의 무력 스텁 유지
  globalThis.__vtTick = function (dt) { T += dt; };
  globalThis.__vtFlush = function () {};
  globalThis.__vtReset = function (seedX) { T = 0; if (seedX !== undefined) globalThis.__reseed(seedX); };
  globalThis.__vtPending = function () { return 0; };
`}
  // ── 실행 리듬 훅: 결정성 검사에서 벽시계 리듬을 일부러 흔들 때 쓴다 ──
  globalThis.__rhSpin = function (i) {
    const r = globalThis.__rh;
    if (r && r.every && i % r.every === 0) { const t0 = Date.now(); while (Date.now() - t0 < r.ms); }
  };
})();
`;
}

// RHYTHM 환경변수("스텝수:ms")를 파싱한다. 예: RHYTHM=337:6
function rhythm(env) {
  const s = (env || process.env.RHYTHM || '').split(':');
  return s[0] ? { every: +s[0], ms: +s[1] || 0 } : null;
}

// 공용 DOM·오디오 스텁. g에 설치한다 (harness27_2p는 vm 샌드박스 객체를 넘긴다).
// 주의: setTimeout류는 여기서 무력 스텁으로 깔고, boot(timers:true)가 나중에 덮어쓴다.
function stubDom(g) {
  const elems = {};
  function mkEl() {
    const el = {
      style: {}, _cls: new Set(), dataset: {},
      classList: { add(c) { el._cls.add(c); }, remove(c) { el._cls.delete(c); }, toggle() {}, contains(c) { return el._cls.has(c); } },
      set className(v) { el._c = v; }, get className() { return el._c || ''; },
      textContent: '', innerHTML: '', appendChild() {}, remove() {}, value: '',
      querySelector() { return mkEl(); }, querySelectorAll() { return []; }, children: [], firstChild: null,
      addEventListener() {}, onclick: null,
      getBoundingClientRect: () => ({ width: 390, height: 560, left: 0, top: 0 }),
      getContext: () => new Proxy({}, { get: (t, p) => {
        if (p === 'createLinearGradient') return () => ({ addColorStop() {} });
        return () => {}; }, set: () => true }),
      width: 0, height: 0,
    };
    return el;
  }
  g.performance = { now: () => 0 };   // boot()가 가상 시계로 덮어쓴다
  g.document = { addEventListener() {}, getElementById: id => elems[id] || (elems[id] = mkEl()),
    createElement: () => mkEl(), querySelectorAll: () => [] };
  g.window = g;
  g.addEventListener = (ev, fn) => { if (ev === 'error') g._errFn = fn; };
  try { g.navigator = {}; } catch (e) { /* node 전역의 navigator는 getter 전용 — 게임은 존재만 확인하므로 무시 */ }
  g.devicePixelRatio = 2;
  g.requestAnimationFrame = () => 0;
  g.setInterval = () => 0; g.clearInterval = () => {}; g.setTimeout = () => 0; g.clearTimeout = () => {};
  g.AudioContext = function () {
    this.state = 'running'; this.currentTime = 0; this.sampleRate = 44100; this.destination = {};
    this.createOscillator = () => ({ type: '', frequency: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {}, start() {}, stop() {} });
    this.createGain = () => ({ gain: { setValueAtTime() {}, exponentialRampToValueAtTime() {} }, connect() {} });
    this.createBuffer = () => ({ getChannelData: () => new Float32Array(100) });
    this.createBufferSource = () => ({ connect() {}, start() {} });
    this.createBiquadFilter = () => ({ type: '', frequency: {}, connect() {} });
    this.resume = () => {};
  };
  return g;
}

// /tmp/v8.js가 없으면 index.html에서 <script> 본문을 추출해 만들어 준다.
function ensureSrc(fs, path) {
  const out = path || '/tmp/v8.js';
  if (fs.existsSync(out)) return out;
  const html = fs.readFileSync(require('path').join(__dirname, 'index.html'), 'utf-8');
  const seg = html.split('<script>');
  const body = seg[seg.length - 1].split('</script>')[0];
  fs.writeFileSync(out, body);
  return out;
}

module.exports = { boot, rhythm, stubDom, ensureSrc };
