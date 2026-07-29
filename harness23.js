// v6 가로축 스모크: 무크래시 + 승패 발생 + 삼각형 독 자동 소비
// TASK-02: detkit 결정성 키트 적용 — 시드 난수·가상 시계·가상 타이머 큐·muted
const dk = require('./detkit.js');
const SEED = +(process.env.SEED || 4242);
dk.stubDom(global);
global.__rh = dk.rhythm();
const fs = require('fs');
let src = dk.boot(SEED, { timers: true }) + fs.readFileSync(dk.ensureSrc(fs), 'utf-8');
src+=`
;(function(){
try{
  for(let run=0;run<6;run++){
    __vtReset(${SEED}+run*1000);
    DIFF=DIFFS[run<3?"normal":"hard"];
    muted=true; // 사운드 난수 절도 차단 — 게임 시작 직전
    startGame();
    let ci=0,hireT=0,tactT=0;
    const cycle=["pop","wep","civ"];
    for(let i=0;i<12*60*30;i++){
      __rhSpin(i);
      __vtTick(1/30);update(1/30);__vtFlush();draw();
      if(!running)break;
    if(P.cmdHp<=0||E.cmdHp<=0){running=false;break;} // 결착 즉시 정지
      if(triadOffer){
        let c=triadOffer[cycle[ci%3]];
        if(c.cost&&P.gold<c.cost)c=triadOffer.wep;
        c.f(P);triadOffer=null;ci++;}
      if(activePanel){slotTimers.forEach(t=>clearInterval(t));closePanel();}
      panelQueue.length=0;
      hireT+=1/30;
      if(hireT>1.0){hireT=0;
        if(P.gold>=180){for(let k=0;k<5;k++){
          const av=UNITS.filter(u=>u.era<=P.era&&!u.hidden&&P.gold>=u.cost);
          if(!av.length)break;
          const u=av[Math.floor(Math.random()*av.length)];
          P.gold-=u.cost;addUnit(P,u.id,u.pack||1,true);}}}
      tactT+=1/30;
      if(tactT>5&&P.skillCd<=0){tactT=0;useTactic(P);}
      if(P.ult>=100)castUlt(P);
      if(P.nukeReady)launchNukeAt(P,cmdPos(E).x,cmdPos(E).y+80);
      if(E.nukeReady)launchNukeAt(E,cmdPos(P).x,cmdPos(P).y-80);
      const pn=army.filter(u=>u.side===P).length;
      if(P.stance==="hold"&&pn>=12){P.stance="attack";
        if(P.skillCd<=0){P.rallyT=10;P.skillCd=60;P.skillCdMax=60;}}
      if(P.stance==="attack"&&pn<=4)P.stance="hold";
    }
    const res=running?"TIMEOUT12분":(P.cmdHp<=0?"패배":"승리")+" "+gameTime.toFixed(0)+"s";
    console.log("["+(run<3?"보통":"어려움")+"] vs "+E.faction.name+" → "+res+" | 시대P"+P.era+"E"+E.era+" 병력"+P.maxArmy);
    console.log("DET|g"+run+"|t"+Math.round(gameTime)+"|kP"+P.kills+"|kE"+E.kills
      +"|eP"+P.era+"|eE"+E.era+"|gP"+Math.round(P.gold)+"|gE"+Math.round(E.gold)
      +"|hP"+Math.round(P.cmdHp)+"|hE"+Math.round(E.cmdHp)+"|n"+army.length
      +"|rng"+__rngN+"|vtQ"+__vtPending()+"|vtErr"+__vtErrs.length);
  }
  console.log("SMOKE OK");
}catch(e){console.log("ERR:",e.stack||String(e));}
})();`;
eval(src);
