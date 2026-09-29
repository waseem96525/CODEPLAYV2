const Store = (() => {
  const KEY = "codeplay_v1";
  const def = () => ({ completed:{}, code:{}, playground:{html:"<h1>Hello</h1>",css:"h1{color:green}",js:"console.log('Hi')"}, streak:{last:"",count:0}, settings:{theme:"dark",font:15}, visits:0 });
  let s;
  try { s = JSON.parse(localStorage.getItem(KEY)) || def(); }
  catch { s = def(); }
  s = Object.assign(def(), s);
  s.settings = Object.assign(def().settings, s.settings||{});
  s.playground = Object.assign(def().playground, s.playground||{});
  s.xp ??= 0; s.badges ??= []; s.daily ??= {}; s.best ??= {}; s.proj ??= {};
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch(e){} };
  setInterval(save, 2000);
  window.addEventListener("beforeunload", save);
  function touchStreak(){
    const today = new Date().toISOString().slice(0,10);
    if (s.streak.last === today) return;
    const y = new Date(Date.now()-864e5).toISOString().slice(0,10);
    s.streak.count = (s.streak.last === y) ? (s.streak.count+1) : 1;
    s.streak.last = today; save();
  }
  return {
    state:s, save,
    getCode(id, fb){ return s.code[id] ?? fb; },
    setCode(id, c){ s.code[id]=c; },
    complete(id){ s.completed[id]=Date.now(); touchStreak(); save(); },
    addXP(n){ s.xp=(s.xp||0)+n; save(); },
    uncomplete(id){ delete s.completed[id]; save(); },
    isDone(id){ return !!s.completed[id]; },
    trackStats(track, all){
      const list = all.filter(c=>c.track===track);
      const done = list.filter(c=>s.completed[c.id]).length;
      return {total:list.length, done, pct:list.length?Math.round(done/list.length*100):0};
    },
    export(){ return JSON.stringify(s); },
    import(json){ const d=JSON.parse(json); if(!d.completed) throw new Error("bad file"); s=d; save(); },
    reset(){ s=def(); save(); location.reload(); }
  };
})();
