const vm=require('vm');
const fs=require('fs');
const src=fs.readFileSync('/tmp/v8.js','utf-8');

// ── 공유 가짜 릴레이 ──
const bus={q:[],subs:{h:[],g:[]},send(role,topic,payload,delay){
  bus.q.push({t:topic,p:payload,at:bus.now+delay});},
  now:0,
  flush(){const rest=[];for(const m of bus.q){
    if(m.at<=bus.now){
      for(const side of ["h","g"])
        for(const sub of bus.subs[side])
          if(sub.topic===m.t)sub.fn(m.t,{toString:()=>m.p});
    } else rest.push(m);}
    bus.q=rest;}
};

function mkCtx(name){
  const elems={};
  function mkEl(){const el={style:{},_cls:new Set(),dataset:{},
    classList:{add(c){el._cls.add(c)},remove(c){el._cls.delete(c)},toggle(){},contains(c){return el._cls.has(c)}},
    set className(v){el._c=v},get className(){return el._c||""},
    textContent:"",innerHTML:"",appendChild(){},remove(){},value:"",
    querySelector(){return mkEl()},querySelectorAll(){return[]},children:[],firstChild:null,
    addEventListener(){},onclick:null,
    getBoundingClientRect:()=>({width:390,height:560,left:0,top:0}),
    getContext:()=>new Proxy({},{get:(t,p)=>{
      if(p==='createLinearGradient')return()=>({addColorStop(){}});
      return()=>{};},set:()=>true}),width:0,height:0};return el;}
  const g={};
  g.errors=[];
  g.performance={now:()=>Date.now()};
  g.document={addEventListener(){},getElementById:id=>elems[id]||(elems[id]=mkEl()),
    createElement:()=>mkEl(),querySelectorAll:()=>[]};
  g.window=g; g.addEventListener=(ev,fn)=>{if(ev==="error")g._errFn=fn;};
  g.navigator={}; g.devicePixelRatio=2;
  g.requestAnimationFrame=()=>{};
  g.setInterval=()=>0; g.clearInterval=()=>{}; g.setTimeout=()=>0;
  g.console=console;
  g.AudioContext=function(){this.state="running";this.currentTime=0;this.sampleRate=44100;this.destination={};
    this.createOscillator=()=>({type:"",frequency:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){},start(){},stop(){}});
    this.createGain=()=>({gain:{setValueAtTime(){},exponentialRampToValueAtTime(){}},connect(){}});
    this.createBuffer=()=>({getChannelData:()=>new Float32Array(100)});
    this.createBufferSource=()=>({connect(){},start(){}});
    this.createBiquadFilter=()=>({type:"",frequency:{},connect(){}});
    this.resume=()=>{}};
  const role=name;
  g.mqtt={connect:()=>{
    const client={handlers:{},
      on(ev,fn){client.handlers[ev]=fn;if(ev==="connect")fn();},
      subscribe(topic){bus.subs[role].push({topic,fn:(t,m)=>client.handlers.message&&client.handlers.message(t,m)});},
      publish(topic,payload){bus.send(role,topic,payload,3);}, // 3틱 지연
    };return client;}};
  const ctx=vm.createContext(g);
  vm.runInContext(src,ctx);
  vm.runInContext('showErr=(m)=>{errors.push(String(m));};',ctx);
  return ctx;
}

try{
const H=mkCtx("h"), G=mkCtx("g");
vm.runInContext('startPvp("h","7777")',H);
bus.flush();
vm.runInContext('startPvp("g","7777")',G);
// 핸드셰이크 펌프
for(let i=0;i<10;i++){bus.now++;bus.flush();}
for(const C of [H,G])vm.runInContext(`
  window._rc=0;window._cl=[];
  (function(){const _R=SR;SR=()=>{_rc++;return _R();};
    const _ap=applyCmd;applyCmd=(r,t,d)=>{_cl.push(NET.tick+":"+r+":"+t);return _ap(r,t,d);};})();
`,C);
console.log("시작상태 H:",vm.runInContext('NET.started+" tick"+NET.tick',H),
            "| G:",vm.runInContext('NET.started+" tick"+NET.tick',G));

// 60초 구동 + 10초 지점 방장 삼각형/게스트 고용 명령
for(let f=0;f<70*30;f++){
  bus.now++;
  vm.runInContext('if(NET.started)netTick(1/30)',H);
  vm.runInContext('if(NET.started)netTick(1/30)',G);
  bus.flush();
  if(f===300)vm.runInContext('if(triadOffer)issueCmd("triad",{k:"pop"})',H);
  if(f===330)vm.runInContext('issueCmd("hire",{u:"club"})',G);
  if(f===600){vm.runInContext('issueCmd("stance")',H);vm.runInContext('issueCmd("stance")',G);}
  if(f===700)vm.runInContext('issueCmd("rally")',H);
  for(const [nm,C] of [["H",H],["G",G]]){
    const eg=vm.runInContext('Math.round(E.gold)',C);
    if(!C._eg)C._eg=eg;
    if(Math.abs(eg-C._eg)>60)console.log("  💥"+nm+" E골드 점프 t"+vm.runInContext('NET.tick',C)+": "+C._eg+"→"+eg);
    C._eg=eg;
  }
  if(f%300===0&&f>0){
    console.log("  R소비 H:"+vm.runInContext('_rc',H)+" G:"+vm.runInContext('_rc',G)
      +" | 명령 H:["+vm.runInContext('_cl.join(",")',H)+"] G:["+vm.runInContext('_cl.join(",")',G)+"]");
    const h=vm.runInContext('NET.tick+"t P보유:"+(triadOffer?"O":"-")+" Ppend:"+P.pendingChoices+" Egold:"+Math.round(E.gold)+" Pn:"+army.filter(u=>u.side===P).length+" En:"+army.filter(u=>u.side===E).length',H);
    const g2=vm.runInContext('NET.tick+"t E오퍼:"+(E.triadOffer?"O":"-")+" EQ:"+(E.aiChoiceQ||0)+" Egold:"+Math.round(E.gold)+" Pn:"+army.filter(u=>u.side===P).length+" En:"+army.filter(u=>u.side===E).length',G);
    console.log("H["+h+"]  G["+g2+"]");
  }
}
console.log("에러 H:",vm.runInContext('errors.slice(0,3).join(" | ")||"없음"',H));
console.log("에러 G:",vm.runInContext('errors.slice(0,3).join(" | ")||"없음"',G));
// 비동기화 검사
const hs=vm.runInContext('army.length+","+Math.round(P.gold)+","+Math.round(E.gold)',H);
const gs=vm.runInContext('army.length+","+Math.round(P.gold)+","+Math.round(E.gold)',G);
console.log("동기화 검사 H:["+hs+"] G:["+gs+"] →",hs===gs?"일치 ✓":"불일치 ✗ DESYNC");
}catch(e){console.log("HARNESS ERR:",e.stack);}
