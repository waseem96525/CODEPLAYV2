const BADGES = [
  {id:"first", n:"First Step 👣", d:"Complete 1 challenge"},
  {id:"ten", n:"Rising Star ⭐", d:"Complete 10 challenges"},
  {id:"twentyfive", n:"Quarter Century 🏅", d:"Complete 25 challenges"},
  {id:"fifty", n:"Half Century 💪", d:"Complete 50 challenges"},
  {id:"all90", n:"Code Master 🏆", d:"Complete all 90 challenges"},
  {id:"html", n:"HTML Hero 🟧", d:"Finish all HTML challenges"},
  {id:"css", n:"CSS Artist 🟦", d:"Finish all CSS challenges"},
  {id:"js", n:"JS Ninja 🟨", d:"Finish all JS challenges"},
  {id:"streak3", n:"On Fire 🔥", d:"Reach a 3-day streak"},
  {id:"streak7", n:"Unstoppable 🚀", d:"Reach a 7-day streak"},
  {id:"daily", n:"Daily Grind 📅", d:"Complete a daily challenge"},
  {id:"speed", n:"Speedster ⚡", d:"Solve a challenge in under 60 seconds"}
];
function levelFor(xp){
  const level = Math.floor((xp||0)/100)+1;
  const titles = ["Novice","Explorer","Builder","Coder","Pro","Master","Grandmaster"];
  return {level, title: titles[Math.min(titles.length-1, Math.floor((level-1)/2))]};
}
function checkBadges(){
  const s = Store.state;
  const done = ALL.filter(c=>Store.isDone(c.id)).length;
  const has = id => (s.badges||[]).includes(id);
  const nu = [];
  const give = id => { if(!has(id)){ s.badges.push(id); nu.push(id); } };
  if(done>=1) give("first");
  if(done>=10) give("ten");
  if(done>=25) give("twentyfive");
  if(done>=50) give("fifty");
  if(done>=ALL.length && ALL.length) give("all90");
  ["html","css","js"].forEach(t=>{
    const st = Store.trackStats(t, ALL);
    if(st.total && st.done>=st.total) give(t);
  });
  if((s.streak.count||0)>=3) give("streak3");
  if((s.streak.count||0)>=7) give("streak7");
  if(Object.keys(s.daily||{}).length>=1) give("daily");
  if(Object.values(s.best||{}).some(v=>v<60)) give("speed");
  if(nu.length) Store.save();
  return nu;
}
