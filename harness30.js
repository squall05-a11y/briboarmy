// 봇 매트릭스: BUILD=mass|hero|civ|struct|mixed D=easy|normal|hard|hell
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
  const B=process.env.BUILD||"mixed";
  DIFF=DIFFS[process.env.D||"hard"];
  __vtReset(${SEED});
  muted=true; // 사운드 난수 절도 차단 — 게임 시작 직전
  startGame();
  let ci=0;const cyc=["pop","wep","civ"];
  let hireT=0;
  for(let i=0;i<12*60*30;i++){
    __rhSpin(i);
    __vtTick(1/30);update(1/30);__vtFlush();
    if(P.era>0&&!P._t1)P._t1=gameTime;
    if(!running)break;
    if(P.cmdHp<=0||E.cmdHp<=0){running=false;break;} // 함락 즉시 정지 — 진짜 결착 시각
    if(activePanel){slotTimers.forEach(t=>clearInterval(t));closePanel();}
    panelQueue.length=0;
    // ── 삼각형 정책 ──
    if(triadOffer){
      let k;
      if(B==="civ")k="civ";
      else if(B==="hero")k=(ci%2?"pop":"wep");
      else if(B==="mass")k=(ci%2?"pop":"wep");
      else if(B==="struct")k=(P.unlockIdx<(ERA_UNLOCKS[P.era]||[]).length?"civ":"wep");
      else k=cyc[ci%3];
      let c=triadOffer[k];
      if(c.cost&&P.gold<c.cost)c=triadOffer.wep;
      c.f(P);triadOffer=null;ci++;
    }
    hireT+=1/30;
    const pn=army.filter(u=>u.side===P).length;
    const gar=army.filter(u=>u.side===P&&u.mode==="hold").length;
    // ── 빌드별 고용/건설 ──
    if(hireT>0.8){hireT=0;
      const heroDef=UNITS.find(x=>x.era===P.era&&x.hero);
      const heroAlive=heroDef&&army.some(x=>x.side===P&&x.id===heroDef.id);
      if(B==="hero"){
        if(heroDef&&!heroAlive&&P.gold>=Math.round(heroDef.cost*(P.heroCostMul||1)))hireHero(P);
        else if(P.gold>=heroUpCost(P)+150)buyHeroUp(P);
        else{const av=UNITS.filter(u=>u.era===P.era&&!u.hidden&&!u.hero&&isUnlocked(P,u.id));
          const u=av[Math.floor(Math.random()*av.length)];if(u&&P.gold>=u.cost+120)tryBuy(u);}
      } else if(B==="struct"){
        let built=false;
        for(const [kk,cc,fn,cap] of [["tw",250,buildTower,3],["hosp",400,buildHospital,2],["snip",350,buildSniper,2],["ic",500,buildIntercept,1]]){
          if(isUnlocked(P,kk)&&P.gold>=cc+150){
            const cnt=structures.filter(t=>t.side===P&&t.kind===kk).length;
            if(cnt<cap&&fn(P)){P.gold-=cc;built=true;break;}
          }
        }
        if(!built){const av=UNITS.filter(u=>u.era===P.era&&!u.hidden&&!u.hero&&isUnlocked(P,u.id));
          const u=av[Math.floor(Math.random()*av.length)];if(u&&P.gold>=u.cost)tryBuy(u);}
      } else {
        const av=UNITS.filter(u=>u.era===P.era&&!u.hidden&&!u.hero&&isUnlocked(P,u.id));
        const u=av[Math.floor(Math.random()*av.length)];
        if(u&&P.gold>=u.cost*(B==="civ"?2.2:1))tryBuy(u);
      }
    }
    // ── 스탠스 ──
    const thresh=B==="hero"?18:(B==="struct"?80:(B==="civ"?70:55));
    if(P.stance==="hold"&&armyCount(P)>=thresh){P.stance="attack";for(const u of army)if(u.side===P&&Math.random()<0.7)u.mode="attack";}
    if(P.stance==="attack"&&gar>=14){army.filter(u=>u.side===P&&u.mode==="hold").slice(0,gar-6).forEach(u=>u.mode="attack");}
    if(P.stance==="attack"&&pn<=4){P.stance="hold";for(const u of army)if(u.side===P)u.mode="hold";}
    if(P.ult>=100)castUlt(P);
    if(P.skillCd<=0&&P.stance==="attack")\{P.rallyT=10;P.skillCd=40;P.skillCdMax=40;\}
    if(P.nukeReady)launchNukeAt(P,VW*0.5,VH*0.10);
  }
  const res=P.cmdHp<=0?"패배":(E.cmdHp<=0?"승리":"교착");
  const t1=P._t1?Math.round(P._t1)+"s":"-";
  const st=Math.round((window._so?window._so.sec:0));const nv=army.filter(x=>x.side===E&&unitDef(x.id).naval).length;const eb=structures.filter(t=>t.side===E&&t.kind!=="monu"&&t.kind!=="mtw").length;console.log(B+"|"+(process.env.D||"hard")+"|"+res+"|"+Math.round(gameTime)+"s|P"+P.era+"E"+E.era+"|E건설"+eb+"|교착"+st+"s|E해군"+nv+"|전환"+(window._tacSw||0)+"|E핵기지"+(structures.some(t=>t.side===E&&t.kind==="msb")?1:0)+"|E항모"+(army.some(x=>x.side===E&&x.id==="cv")?1:0));
  console.log("DET|t"+Math.round(gameTime)+"|kP"+P.kills+"|kE"+E.kills
    +"|eP"+P.era+"|eE"+E.era+"|gP"+Math.round(P.gold)+"|gE"+Math.round(E.gold)
    +"|hP"+Math.round(P.cmdHp)+"|hE"+Math.round(E.cmdHp)+"|n"+army.length
    +"|rng"+__rngN+"|vtQ"+__vtPending()+"|vtErr"+__vtErrs.length);
}catch(e){console.log((process.env.BUILD||"?")+"|ERR: "+String(e).slice(0,80));}
})();`;
eval(src);
