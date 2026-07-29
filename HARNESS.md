# 하네스 사용법
전제: node 설치 환경(Claude 세션 내 제공). 게임 <script>를 /tmp/v8.js로 추출 후:
- 스모크: `node harness23.js` — 12분 2판, 에러·시대 진행 확인
- 2인 동기: `node harness27_2p.js` — 락스텝 완전 일치 검사
- 봇 매트릭스: `BUILD=mass|hero|civ|struct|mixed D=easy|normal|hard|hell node harness30.js`
  출력: 빌드|난이도|결과|**결착 시각**|시대|E건설|교착초|E해군|전술전환
  (2026-07-29 수술: 지휘부 사망 즉시 정지 — 판 길이가 진짜 결착 시각)
- A/B: `./runAB.sh 파일 0|1 빌드들` (0=자기평가 OFF, 1=ON)
- 진단: `D=난이도 node diag.js` — 수동 P 관전, 12초 적건설·시대 로그
한계 3: setTimeout 스텁 / 봇 입력 / UI 사각지대 — CLAUDE.md 참조.
