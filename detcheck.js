// det-check.js — 하네스 결정성 완료 조건 검사 (TASK-02 §4)
// 동일 시드로 "실행 리듬을 일부러 바꿔가며" 3회 실행, 전 지표 완전 일치를 요구한다.
// 리듬이 같은 3회 일치는 통과가 아니다 — 우연이다. 그래서 회차마다 리듬을 다르게 준다.
//
// 사용:  node det-check.js            — 하네스 4종 전부 검사
//        SEED=123 node det-check.js   — 다른 시드로 검사
//        BUILD=civ D=hell node det-check.js — harness30 조건 변경
'use strict';
const { execSync } = require('child_process');
const fs = require('fs');
const dk = require('./detkit.js');

dk.ensureSrc(fs); // /tmp/v8.js 없으면 index.html에서 추출

const SEED = process.env.SEED || '4242';
const RHYTHMS = ['200:3', '337:6', '474:9']; // 회차별 양보 간격:양보 ms — 전부 다르다

const TARGETS = [
  { name: 'harness23',    cmd: 'node harness23.js',    env: {} },
  { name: 'harness30',    cmd: 'node harness30.js',
    env: { BUILD: process.env.BUILD || 'mixed', D: process.env.D || 'hard' } },
  { name: 'harness27_2p', cmd: 'node harness27_2p.js', env: {} },
  { name: 'diag',         cmd: 'node diag.js',
    env: { D: process.env.D || 'hard' } },
];

let allPass = true;

for (const t of TARGETS) {
  const outs = [];
  for (const rh of RHYTHMS) {
    let out;
    try {
      out = execSync(t.cmd, {
        cwd: __dirname,
        env: Object.assign({}, process.env, t.env, { SEED: SEED, RHYTHM: rh }),
        timeout: 15 * 60 * 1000, encoding: 'utf-8',
      });
    } catch (e) {
      out = 'EXEC-ERR: ' + String(e.message).slice(0, 200);
    }
    outs.push(out);
  }

  const same = outs[0] === outs[1] && outs[1] === outs[2];
  const detLines = outs.map(o => (o.match(/^DET\|.*$/gm) || []).join(' ; '));
  const rngs = outs.map(o => {
    const m = o.match(/rng(\d+)/g) || [];
    return m.map(x => +x.slice(3));
  });
  // 계측 생존: 모든 회차의 모든 rng 값이 0도 NaN도 아닌 정수
  const rngAlive = rngs.every(a => a.length > 0 && a.every(v => Number.isInteger(v) && v > 0));
  const pass = same && rngAlive;
  allPass = allPass && pass;

  console.log('━━ ' + t.name + ' (SEED=' + SEED + ', 리듬 ' + RHYTHMS.join(' / ') + ')');
  outs.forEach((o, i) => {
    console.log('  ' + (i + 1) + '회차: ' + (detLines[i] || '(DET 라인 없음) ' + o.trim().split('\n').slice(-1)[0]));
  });
  if (!same) {
    // 첫 불일치 지점을 보여준다
    const a = outs[0].split('\n'), b = (outs[0] === outs[1] ? outs[2] : outs[1]).split('\n');
    for (let i = 0; i < Math.max(a.length, b.length); i++)
      if (a[i] !== b[i]) { console.log('  ✗ 첫 불일치 줄 ' + (i + 1) + ':\n    A: ' + a[i] + '\n    B: ' + b[i]); break; }
  }
  if (!rngAlive) console.log('  ✗ 계측 사망: rng 카운터가 0이거나 NaN — §4 순서(선언→교체→평가) 위반 의심');
  console.log('  판정: ' + (pass ? '통과 ✓ (3회 stdout 완전 일치, 계측 생존)' : '실패 ✗'));
}

console.log(allPass ? '\nDET-CHECK 전부 통과 ✓' : '\nDET-CHECK 실패 항목 있음 ✗');
process.exit(allPass ? 0 : 1);
