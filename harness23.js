// v6 가로축 스모크: 무크래시 + 승패 발생 + 삼각형 독 자동 소비
global.performance={now:()=>Date.now()};
const elems={};
function mkEl(){const el={style:{},_cls:new Set(),dataset:{},
  classList:{add(c){el._cls.add(c)},remove(c){el._cls.delete(c)},toggle(){},contains(c){return el._cls.has(c)}},
  set className(v){el._c=v},get className(){return el._c||""},
  textContent:"",innerHTML:"",appendChild(){},remove(){},
  querySelector(){return mkEl()},querySelectorAll(){return[]},children:[],firstChild:null,
  addEventListener(){},onclick:null,
  getBoundingClientRect:()=>({width:390,height:560,left:0,top:0}),
  getContext:()=>new Proxy({},{get:(t,p)=>{
    if(p==='createLinearGradient')return()=>({addColorStop(){}});
    return()=>{};}, set:()=>true}),width:0,height:0};return el;}
global.document={getElementById:id=>elems[id]||(elems[id]=mkEl()),
  createElement:()=>mkEl(),querySelectorAll:()=>[]};
global.window=global; global.addEventListener=()=>{};
global.navigator={}; global.devicePixelRatio=2;
global.requestAnimationFrame=()=>{};
global.setInterval=()=>0; global.clearInterval=()=>{}; global.setTimeout=()=>0;
global.AudioContext=function(){this.state="running";this.currentTime=0;this.sampleRate=44100;this.destination={};
  this.createOscillator=()=>({type:"",frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){},stop(){}});
  this.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}});
  this.createBuffer=()=>({getChannelData:()=>new Float32Array(100)});
  this.createBufferSource=()=>({connect(){},start(){}});
  this.createBiquadFilter=()=>({type:"",frequency:{},connect(){}});
  this.resume=()=>{}};
let src=require('fs').readFileSync('/tmp/v8.js','utf-8');
src+=`
;(function(){
try{
  for(let run=0;run<6;run++){
    DIFF=DIFFS[run<3?"normal":"hard"];
    startGame();
    let ci=0,hireT=0,tactT=0;
    const cycle=["pop","wep","civ"];
    for(let i=0;i<12*60*30;i++){
      update(1/30);draw();
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
  }
  console.log("SMOKE OK");
}catch(e){console.log("ERR:",e.stack||String(e));}
})();`;
eval(src);
