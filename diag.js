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
;(function(){try{
  DIFF=DIFFS[process.env.D||"hard"];
  startGame();
  const _dt=dealTo;
  let hits=0;
  dealTo=(t,d2,fs)=>{
    if(t.isCmd&&t.side===E&&hits<12){hits++;
      console.log("EcmdHit t="+Math.round(gameTime)+" dmg="+Math.round(d2)+" from="+(fs===P?"P":"E?"));}
    return _dt(t,d2,fs);
  };
  for(let i2=0;i2<12*60*30;i2++){
    update(1/30);
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
}catch(e){console.log("ERR:",String(e).slice(0,120));}})();`;
eval(src);
