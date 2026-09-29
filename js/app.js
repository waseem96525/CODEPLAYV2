const ALL = [...(typeof HTML_CHALLENGES!=="undefined"?HTML_CHALLENGES:[]), ...(typeof CSS_CHALLENGES!=="undefined"?CSS_CHALLENGES:[]), ...(typeof JS_CHALLENGES!=="undefined"?JS_CHALLENGES:[])];
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let cur = null, cm = null, mode = "preview", checkToken = 0;
let selTrack = "html", selLevel = "beginner";

function show(id){
  $$(".view").forEach(v=>v.classList.remove("active"));
  $("#view-"+id).classList.add("active");
  $$("[data-nav]").forEach(b=>b.classList.toggle("primary", b.dataset.nav===id));
  window.scrollTo(0,0);
}
function langOf(ch){ return ch.track==="js"?"javascript":ch.track==="css"?"htmlmixed":"htmlmixed"; }

function initEditor(textarea, lang){
  const ta = textarea;
  try{
    if (window.CodeMirror && window.CodeMirror.fromTextArea) {
      if (cm) { cm.toTextArea(); cm=null; }
      cm = CodeMirror.fromTextArea(ta, {lineNumbers:true, mode:lang, theme: Store.state.settings.theme==="light"?"default":"material-darker", autoCloseBrackets:true, matchBrackets:true, indentUnit:2, tabSize:2});
      cm.setSize("100%", 420);
      cm.getDoc().setValue(Store.getCode(cur?.id||"pg", ta.value));
      cm.on("change", ()=>{ Store.setCode(cur?.id||"pg", cm.getValue()); debouncePreview(); });
      applyFont();
      return {get:()=>cm.getValue(), set:v=>cm.getDoc().setValue(v)};
    }
  }catch(e){}
  ta.value = Store.getCode(cur?.id||"pg", ta.value);
  ta.oninput = ()=>{ Store.setCode(cur?.id||"pg", ta.value); debouncePreview(); };
  return {get:()=>ta.value, set:v=>ta.value=v};
}
function edGet(){ return cm ? cm.getValue() : $("#codeArea").value; }
function edSet(v){ if(cm) cm.getDoc().setValue(v); else $("#codeArea").value=v; }

let pvT=null;
function debouncePreview(){ clearTimeout(pvT); pvT=setTimeout(livePreview, 600); }
function livePreview(){
  if(!cur) return;
  const code = edGet();
  Store.setCode(cur.id, code); Store.save();
  $("#previewFrame").srcdoc = Runner.previewOnly(cur, code);
}
function runCheck(){
  if(!cur) return;
  const code = edGet();
  Store.setCode(cur.id, code);
  const token = ++checkToken; mode="check";
  $("#checkBtn").disabled = true; $("#checkBtn").textContent = "Checking...";
  $("#previewFrame").srcdoc = Runner.buildDoc(cur, code, "check");
  setTimeout(()=>{ if(token===checkToken && mode==="check"){ finishTimeout(); } }, 4000);
}
function finishTimeout(){
  $("#checkBtn").disabled=false; $("#checkBtn").textContent="Run / Check (Ctrl+Enter)";
  showResult(false, [{label:"Timeout", msg:"No answer in 3s. Infinite loop? Check i++ in while loops."}], [], "Loop/timeout");
}
window.addEventListener("message", e=>{
  const d = e.data;
  if(!d || !d.__cp) return;
  if(d.mode!=="check") return;
  $("#checkBtn").disabled=false; $("#checkBtn").textContent="Run / Check (Ctrl+Enter)";
  const res = d.results||[];
  const pass = res.length>0 && res.every(r=>r.ok);
  showResult(pass, res, d.logs||[], d.err||"");
  renderConsole(d.logs||[], d.err||"");
  if(pass && cur){
    const isNew = !Store.isDone(cur.id);
    Store.complete(cur.id);
    if(isNew) Store.addXP(10);
    if(window.__daily && !Store.state.daily[todayStr()]){ Store.state.daily[todayStr()]=cur.id; Store.addXP(5); }
    if(chalT0){ const secs=Math.round((Date.now()-chalT0)/1000); const b=Store.state.best; if(!b[cur.id]||secs<b[cur.id]) b[cur.id]=secs; Store.save(); }
    const nu = checkBadges();
    confetti();
    nu.forEach(id=>{ const b=BADGES.find(x=>x.id===id); if(b) toast("🏅 Badge unlocked: "+b.n+" — "+b.d); });
    if(isNew) toast("+10 XP"+(window.__daily?" (+5 daily bonus)":""));
    refreshHome(); renderList(); renderBadges(); updateChalBadge();
  }
});
function renderConsole(logs, err){
  let t = logs.join("\n");
  if(err) t += (t?"\n":"")+"Error: "+err;
  $("#consoleOut").textContent = t || "(console empty — use console.log)";
}
function showResult(pass, res, logs, err){
  const el = $("#resultBox");
  el.className = "result "+(pass?"pass":"fail");
  const fails = res.filter(r=>!r.ok);
  el.innerHTML = (pass?"✅ Pass! Great job. Press Next.":"❌ Fail — "+fails.length+" test(s) failed.") +
    "<ul>"+res.map(r=>`<li>${r.ok?"✅":"❌"} ${r.label}${r.msg?" — "+escapeHtml(r.msg):""}</li>`).join("")+"</ul>";
  if(cur){ const nx = nextChal(); if(pass&&nx) el.innerHTML += `<button class="blue" onclick="openChal('${nx.id}')">Next: ${escapeHtml(nx.title)} →</button>`; }
}
function escapeHtml(s){ return String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])); }

// ---- navigation / lists ----
function refreshHome(){
  ["html","css","js"].forEach(t=>{
    const st = Store.trackStats(t, ALL);
    $("#pb-"+t).style.width = st.pct+"%";
    $("#pt-"+t).textContent = `${st.done}/${st.total} (${st.pct}%)`;
  });
  const total = ALL.length, done = ALL.filter(c=>Store.isDone(c.id)).length;
  $("#streak").textContent = "🔥 Streak: "+(Store.state.streak.count||0)+" days";
  $("#totalDone").textContent = `Total: ${done}/${total}`;
  renderDaily(); updateXP();
}
function pickTrack(t){ selTrack=t; $$("#trackRow .chip").forEach(c=>c.classList.toggle("active",c.dataset.t===t)); renderList(); }
function pickLevel(l){ selLevel=l; $$("#levelRow .chip").forEach(c=>c.classList.toggle("active",c.dataset.l===l)); renderList(); }
function renderList(){
  const q = ($("#searchChal").value||"").toLowerCase();
  const list = ALL.filter(c=>c.track===selTrack && c.level===selLevel && (!q || c.title.toLowerCase().includes(q)));
  $("#chalCount").textContent = list.length+" challenges";
  $("#chalList").innerHTML = list.map((c,i)=>{
    const done = Store.isDone(c.id);
    return `<div class="card item ${done?"done":""}"><div class="badge ${done?"done":""}">${done?"✓":(i+1)}</div><div style="flex:1"><b>${escapeHtml(c.title)}</b><div class="muted" style="font-size:13px">${c.id}</div></div><button onclick="openChal('${c.id}')">Open</button></div>`;
  }).join("") || `<p class="muted">Nothing found.</p>`;
}
function nextChal(){
  const list = ALL.filter(c=>c.track===cur.track && c.level===cur.level);
  const i = list.findIndex(c=>c.id===cur.id);
  return list[i+1]||null;
}
function prevChal(){
  const list = ALL.filter(c=>c.track===cur.track && c.level===cur.level);
  const i = list.findIndex(c=>c.id===cur.id);
  return list[i-1]||null;
}
window.openChal = (id, opts={}) => {
  cur = ALL.find(c=>c.id===id); if(!cur) return;
  window.__daily = !!(opts && opts.daily);
  selTrack=cur.track; selLevel=cur.level;
  show("challenge");
  $("#chalWrap").dataset.tab="code";
  $("#cTitle").textContent = `${cur.id.toUpperCase()} · ${cur.title}`;
  $("#cMeta").textContent = `${cur.track.toUpperCase()} · ${cur.level}`;
  $("#cDesc").textContent = cur.description;
  $("#cExpected").textContent = "Expected: "+(cur.expected||"—");
  $("#resultBox").className="result"; $("#resultBox").innerHTML="";
  $("#hintBox").innerHTML = cur.hints.map((h,i)=>`<div class="hint" id="hint${i}">💡 Hint ${i+1}: ${escapeHtml(h)}</div>`).join("");
  $("#solBox").style.display="none"; $("#solCode").textContent="";
  updateChalBadge();
  // editor
  $("#codeArea").value = cur.starterCode;
  initEditor($("#codeArea"), langOf(cur));
  edSet(Store.getCode(cur.id, cur.starterCode));
  const db=$("#dailyBanner");
  if(window.__daily){ db.style.display="block"; db.innerHTML = Store.state.daily[todayStr()] ? "📅 Daily challenge — already done today. Great consistency!" : "📅 Daily challenge — finish it for +5 bonus XP!"; }
  else if(db) db.style.display="none";
  livePreview(); renderConsole([],""); startTimer();
  const list = ALL.filter(c=>c.track===cur.track&&c.level===cur.level);
  const i = list.findIndex(c=>c.id===cur.id);
  $("#prevBtn").disabled = i<=0; $("#nextBtn").disabled = i>=list.length-1;
};
function updateChalBadge(){
  const best = (Store.state.best||{})[cur.id];
  $("#doneBadge").textContent = (Store.isDone(cur.id)?"✅ Done":"⬜ Todo") + (best?` · ⚡${best}s best`:"");
}
window.showHint = i => { const el=$("#hint"+i); if(el) el.classList.add("show"); };
window.showSolution = () => { if(!confirm("View the solution? Try it yourself first!"))return; $("#solBox").style.display="block"; $("#solCode").textContent=cur.solution; };
window.useSolution = () => { edSet(cur.solution); livePreview(); };
window.markToggle = () => { Store.isDone(cur.id)?Store.uncomplete(cur.id):Store.complete(cur.id); updateChalBadge(); refreshHome(); };
window.goNext = () => { const n=nextChal(); if(n) openChal(n.id); };
window.goPrev = () => { const p=prevChal(); if(p) openChal(p.id); };
window.setTab = t => { $("#chalWrap").dataset.tab=t; };
window.resetCode = () => { if(confirm("Restore the starter code?")){ edSet(cur.starterCode); livePreview(); } };

// ---- playground ----
let pgEd=null, pgTab="html";
function pgGet(){ return {html:$("#pgHtml").value, css:$("#pgCss").value, js:$("#pgJs").value}; }
function pgPreview(){
  const p=pgGet(); Store.state.playground=p; Store.save();
  $("#pgFrame").srcdoc=`<!DOCTYPE html><html><head><meta charset="utf-8"><style>${p.css}</style></head><body>${p.html}<script>try{${p.js.replace(/<\/script/gi,"<\\/script")}}catch(e){document.body.insertAdjacentHTML("beforeend","<pre style=color:red>Error: "+e.message+"</pre>")}<\/script></body></html>`;
}
window.pgTabSw = t => { pgTab=t; ["html","css","js"].forEach(k=>{$("#pg"+k[0].toUpperCase()+k.slice(1)).style.display=(k===t?"block":"none")}); };
window.pgShare = async () => {
  const p=pgGet(); const s=btoa(unescape(encodeURIComponent(JSON.stringify(p))));
  const url=location.origin+location.pathname+"#pg="+s;
  try{ await navigator.clipboard.writeText(url); alert("Share link copied!"); }catch(e){ prompt("Copy the link:",url); }
};
window.pgDownload = () => {
  const p=pgGet(); const blob=new Blob([`<!DOCTYPE html><html><head><style>${p.css}</style></head><body>${p.html}<script>${p.js}<\/script></body></html>`],{type:"text/html"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="codeplay.html"; a.click();
};
function loadPgFromHash(){
  if(location.hash.startsWith("#pg=")){ try{ const p=JSON.parse(decodeURIComponent(escape(atob(location.hash.slice(4))))); Object.assign(Store.state.playground,p);}catch(e){} }
}

// ---- cheats / progress / settings ----
function renderCheats(){
  const q=($("#cheatQ").value||"").toLowerCase(), t=$("#cheatT").value;
  $("#cheatList").innerHTML="<table class='ref'>"+CHEATS.filter(c=>(t==="all"||c.t===t)&&(!q||(c.n+c.d).toLowerCase().includes(q))).map(c=>`<tr><td><b>${escapeHtml(c.n)}</b><br><span class="muted">${escapeHtml(c.d)}</span></td><td>${c.t.toUpperCase()}</td></tr>`).join("")+"</table>";
}
function renderProgress(){
  const done=ALL.filter(c=>Store.isDone(c.id)).length;
  const lv=levelFor(Store.state.xp||0);
  $("#pgStats").innerHTML=`<p><b>${done}/${ALL.length}</b> complete · 🔥 ${Store.state.streak.count||0} day streak · ⚡ ${Store.state.xp||0} XP (Lv ${lv.level} ${lv.title})</p>`+
   ["html","css","js"].map(t=>{const s=Store.trackStats(t,ALL);return `<p>${t.toUpperCase()} — ${s.done}/${s.total}</p><div class="progress"><div style="width:${s.pct}%"></div></div>`}).join("");
}
window.doExport = () => { const blob=new Blob([Store.export()],{type:"application/json"}); const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download="codeplay-progress.json"; a.click(); };
window.doImport = f => { const r=new FileReader(); r.onload=()=>{ try{Store.import(r.result);alert("Import complete!");location.reload();}catch(e){alert("Invalid file: "+e.message)} }; r.readAsText(f); };
window.setTheme = t => { Store.state.settings.theme=t; Store.save(); document.documentElement.dataset.theme=t==="light"?"light":""; if(cm)cm.setOption("theme",t==="light"?"default":"material-darker"); };
window.fontAdj = d => { Store.state.settings.font=Math.min(24,Math.max(12,(Store.state.settings.font||15)+d)); Store.save(); applyFont(); };
function applyFont(){ document.documentElement.style.setProperty("--editor-font",Store.state.settings.font+"px"); const el=$(".CodeMirror"); if(el)el.style.fontSize=Store.state.settings.font+"px"; if(cm)cm.refresh(); }
function insertKey(k){
  if(k==="Tab")k="  ";
  if(cm){ cm.replaceSelection(k); cm.focus(); }
  else { const t=$("#codeArea"); const s=t.selectionStart; t.value=t.value.slice(0,s)+k+t.value.slice(t.selectionEnd); t.focus(); }
  debouncePreview();
}

// ---- gamification: toast, confetti, timer, daily, XP, badges, projects ----
function toast(msg){
  const t=document.createElement("div"); t.className="toast"; t.textContent=msg;
  document.body.appendChild(t);
  setTimeout(()=>t.classList.add("show"),50);
  setTimeout(()=>{ t.classList.remove("show"); setTimeout(()=>t.remove(),400); },2600);
}
function confetti(){
  let c=$("#confettiCanvas");
  if(!c){ c=document.createElement("canvas"); c.id="confettiCanvas"; document.body.appendChild(c); }
  const x=c.getContext("2d"); c.width=innerWidth; c.height=innerHeight;
  const cols=["#22c55e","#3b82f6","#f59e0b","#ef4444","#a78bfa"];
  const P=[...Array(120)].map(()=>({x:Math.random()*c.width,y:-20-Math.random()*c.height*0.3,w:6+Math.random()*6,h:8+Math.random()*8,vy:2+Math.random()*3,vx:-1.5+Math.random()*3,r:Math.random()*Math.PI,vr:-0.1+Math.random()*0.2,col:cols[Math.floor(Math.random()*cols.length)]}));
  let f=0;
  (function anim(){
    x.clearRect(0,0,c.width,c.height);
    P.forEach(p=>{ p.x+=p.vx; p.y+=p.vy; p.r+=p.vr; x.save(); x.translate(p.x,p.y); x.rotate(p.r); x.fillStyle=p.col; x.fillRect(-p.w/2,-p.h/2,p.w,p.h); x.restore(); });
    if(++f<90) requestAnimationFrame(anim); else x.clearRect(0,0,c.width,c.height);
  })();
}
let chalT0=null, chalTimerInt=null;
function startTimer(){
  stopTimer(); chalT0=Date.now();
  const el=$("#timer");
  const tick=()=>{ if(!$("#view-challenge").classList.contains("active"))return;
    const s=Math.floor((Date.now()-chalT0)/1000);
    if(el) el.textContent="⏱ "+String(Math.floor(s/60)).padStart(2,"0")+":"+String(s%60).padStart(2,"0");
  };
  tick(); chalTimerInt=setInterval(tick,1000);
}
function stopTimer(){ if(chalTimerInt)clearInterval(chalTimerInt); chalTimerInt=null; }
function todayStr(){ return new Date().toISOString().slice(0,10); }
function dailyId(){ if(!ALL.length) return null; const day=Math.floor(Date.now()/864e5); return ALL[day%ALL.length].id; }
window.openDaily = () => { const id=dailyId(); if(id) openChal(id, {daily:true}); else toast("Challenges not loaded yet."); };
function renderDaily(){
  const el=$("#dailyInfo"); if(!el) return;
  const id=dailyId(); const d=id&&ALL.find(c=>c.id===id);
  if(!d){ el.textContent="No challenges loaded."; return; }
  const done=!!(Store.state.daily||{})[todayStr()];
  el.innerHTML=`<b>${escapeHtml(d.title)}</b> <span class="muted">${d.track.toUpperCase()} · ${d.level}</span> ${done?"✅ done today":""}`;
}
function updateXP(){
  const xp=Store.state.xp||0, lv=levelFor(xp);
  const pill=$("#xpPill"); if(pill) pill.textContent=`⚡ ${xp} XP · Lv ${lv.level} ${lv.title}`;
  const hx=$("#homeXP"); if(hx) hx.textContent=`⚡ ${xp} XP — Level ${lv.level} ${lv.title} (${xp%100}/100 to next level)`;
}
function renderBadges(){
  const mine=Store.state.badges||[];
  const html=BADGES.map(b=>{
    const un=mine.includes(b.id);
    const parts=b.n.split(" "); const emoji=parts.pop(); const name=parts.join(" ");
    return `<div class="badge-card ${un?"":"locked"}"><div style="font-size:26px">${un?emoji:"🔒"}</div><b>${escapeHtml(name)}</b><div class="muted" style="font-size:12px">${escapeHtml(b.d)}</div></div>`;
  }).join("");
  const g=$("#badgeGrid"); if(g) g.innerHTML=html;
  const hb=$("#homeBadges"); if(hb) hb.textContent=`🏅 Badges: ${mine.length}/${BADGES.length}`;
}
function renderProjects(){
  const el=$("#projList"); if(!el) return;
  el.innerHTML=PROJECTS.map(p=>{
    const checks=Store.state.proj[p.id]||[];
    const doneN=checks.filter(Boolean).length;
    return `<div class="card"><h3>${p.icon} ${escapeHtml(p.n)}</h3><p class="muted">${escapeHtml(p.d)}</p>
    <p style="font-size:13px">🛠 ${p.skills.map(escapeHtml).join(" · ")} &nbsp; ⏱ ${escapeHtml(p.time)}</p>
    <div class="progress"><div style="width:${Math.round(doneN/p.steps.length*100)}%"></div></div>
    <div style="margin-top:6px">${p.steps.map((s,i)=>`<label class="step"><input type="checkbox" ${checks[i]?"checked":""} onchange="projToggle('${p.id}',${i})"> ${escapeHtml(s)}</label>`).join("")}</div>
    <div style="margin-top:8px"><button class="blue" onclick="openInPlayground('${p.id}')">Open starter in Playground →</button></div></div>`;
  }).join("");
}
window.projToggle=(pid,i)=>{ const arr=Store.state.proj[pid]||[]; arr[i]=!arr[i]; Store.state.proj[pid]=arr; Store.save(); renderProjects(); };
window.openInPlayground=(pid)=>{
  const p=PROJECTS.find(x=>x.id===pid); if(!p) return;
  Store.state.playground={...p.starter}; Store.save();
  $("#pgHtml").value=p.starter.html; $("#pgCss").value=p.starter.css; $("#pgJs").value=p.starter.js;
  pgPreview(); show("playground"); toast(p.n+" starter loaded!");
};
window.downloadCode=()=>{
  if(!cur) return;
  const ext={html:"html",css:"html",js:"js"}[cur.track]||"txt";
  const blob=new Blob([edGet()],{type:"text/plain"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=cur.id+"."+ext; a.click();
};
window.copyCode=async()=>{ try{ await navigator.clipboard.writeText(edGet()); toast("Code copied!"); }catch(e){ toast("Copy failed"); } };

// ---- boot ----
window.addEventListener("DOMContentLoaded", ()=>{
  loadPgFromHash();
  document.documentElement.dataset.theme = Store.state.settings.theme==="light"?"light":"";
  applyFont();
  refreshHome(); renderList(); renderCheats(); renderProgress(); renderBadges(); renderProjects(); updateXP(); pgPreview();
  $("#pgHtml").value=Store.state.playground.html; $("#pgCss").value=Store.state.playground.css; $("#pgJs").value=Store.state.playground.js;
  ["pgHtml","pgCss","pgJs"].forEach(id=>$("#"+id).addEventListener("input",()=>{clearTimeout(window.__pgt);window.__pgt=setTimeout(pgPreview,500)}));
  document.addEventListener("keydown",e=>{ if((e.ctrlKey||e.metaKey)&&e.key==="Enter"){ if($("#view-challenge").classList.contains("active")) runCheck(); } });
  $$("[data-nav]").forEach(b=>b.onclick=()=>{show(b.dataset.nav); if(b.dataset.nav==="progress"){renderProgress();renderBadges();} if(b.dataset.nav==="projects")renderProjects();});
  $$("#trackRow .chip").forEach(c=>c.onclick=()=>pickTrack(c.dataset.t));
  $$("#levelRow .chip").forEach(c=>c.onclick=()=>pickLevel(c.dataset.l));
  $("#searchChal").oninput=renderList;
  $("#checkBtn").onclick=runCheck; $("#runBtn").onclick=livePreview;
  $("#cheatQ").oninput=renderCheats; $("#cheatT").onchange=renderCheats;
  $("#logoBtn").onclick=()=>show("home");
  if("serviceWorker" in navigator){ navigator.serviceWorker.register("sw.js").catch(()=>{}); }
});
