// 진단: 수동 P 관전, 12초 적건설·시대 로그 (D=난이도)
// TASK-02: detkit 결정성 키트 적용 — 시드 난수·가상 시계·가상 타이머 큐·muted
const dk = require('./detkit.js');
const SEED = +(process.env.SEED || 4242);
dk.stubDom(global);
global.__rh = dk.rhythm();
const fs = require('fs');
let src = dk.boot(SEED, { timers: true }) + fs.readFileSync(dk.ensureSrc(fs), 'utf-8');
src+=`
;(function(){try{
  DIFF=DIFFS[process.env.D||"hard"];
  __vtReset(${SEED});
  muted=true; // 사운드 난수 절도 차단 — 게임 시작 직전
  startGame();
  const _dt=dealTo;
  let hits=0;
  dealTo=(t,d2,fs)=>{
    if(t.isCmd&&t.side===E&&hits<12){hits++;
      console.log("EcmdHit t="+Math.round(gameTime)+" dmg="+Math.round(d2)+" from="+(fs===P?"P":"E?"));}
    return _dt(t,d2,fs);
  };
  for(let i2=0;i2<12*60*30;i2++){
    __rhSpin(i2);
    __vtTick(1/30);update(1/30);__vtFlush();
    if(!running)break;
    if(P.cmdHp<=0||E.cmdHp<=0){running=false;break;} // 결착 즉시 정지
    if(activePanel){slotTimers.forEach(t=>clearInterval(t));closePanel();}
    panelQueue.length=0;triadOffer=null;
    if(Math.round(gameTime*30)===12*30)console.log("12s 적건설="+structures.filter(t=>t.side===E&&t.kind!=="monu").length);
    if(Math.round(gameTime*30)===60*30)console.log("VH@60s="+(VH/H).toFixed(2)+" zoom="+zoom.toFixed(2));
    if(Math.round(gameTime*30)===300*30)console.log("VH@300s="+(VH/H).toFixed(2));
  }
  const twE=structures.filter(t=>t.side===E&&(t.kind==="tw"||t.kind==="bank"||t.kind==="wall")).length;
  console.log("결과: "+(running?"TIMEOUT":(P.cmdHp>0?"승리(수동인데!)":"패배"))+" t="+Math.round(gameTime)+" E건설="+twE+" P.cmdHp="+Math.round(P.cmdHp)+" E.cmdHp="+Math.round(E.cmdHp));
  console.log("DET|t"+Math.round(gameTime)+"|kP"+P.kills+"|kE"+E.kills
    +"|eP"+P.era+"|eE"+E.era+"|gP"+Math.round(P.gold)+"|gE"+Math.round(E.gold)
    +"|hP"+Math.round(P.cmdHp)+"|hE"+Math.round(E.cmdHp)+"|n"+army.length
    +"|rng"+__rngN+"|vtQ"+__vtPending()+"|vtErr"+__vtErrs.length);
}catch(e){console.log("ERR:",String(e).slice(0,120));}})();`;
eval(src);
