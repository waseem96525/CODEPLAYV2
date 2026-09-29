const PROJECTS = [
{
  id:"todo", n:"Todo List", icon:"✅",
  d:"A working task manager: add tasks, mark them done, delete them. Uses HTML, CSS and DOM events.",
  skills:["HTML forms","DOM createElement","click events"], time:"30–45 min",
  steps:["Input + Add button adds a task to the list","Each task has a checkbox to mark it done","Each task has a delete button","Empty input shows a warning","Tasks look clean with basic CSS"],
  starter:{
    html:'<h1>My Todos</h1>\n<input id="task" placeholder="New task...">\n<button id="add">Add</button>\n<ul id="list"></ul>',
    css:'body{font-family:sans-serif;max-width:400px;margin:20px auto}\nli{padding:8px;border-bottom:1px solid #ddd}\nli.done{text-decoration:line-through;color:gray}\nbutton{margin-left:6px}',
    js:'// 1. Get #add, #task, #list by id\n// 2. On Add click: create li with task text\n// 3. Add a delete button to each li\n// 4. Clicking the li text toggles done class\ndocument.getElementById("add").addEventListener("click", function(){\n  const v = document.getElementById("task").value.trim();\n  if(!v){ alert("Type a task first!"); return; }\n  const li = document.createElement("li");\n  li.textContent = v;\n  li.onclick = () => li.classList.toggle("done");\n  const del = document.createElement("button");\n  del.textContent = "x";\n  del.onclick = (e) => { e.stopPropagation(); li.remove(); };\n  li.appendChild(del);\n  document.getElementById("list").appendChild(li);\n  document.getElementById("task").value = "";\n});'
  }
},
{
  id:"calc", n:"Calculator", icon:"🧮",
  d:"A pocket calculator: number buttons, + − × ÷, clear and equals. Uses grid layout and functions.",
  skills:["CSS grid","functions","error handling"], time:"30–45 min",
  steps:["Buttons 0-9 append digits to the display","Operators + − * / work","= shows the correct result","C clears the display","Invalid input shows Error, app never crashes"],
  starter:{
    html:'<h1>Calc</h1>\n<input id="disp" readonly>\n<div id="keys">\n<button>7</button><button>8</button><button>9</button><button>/</button>\n<button>4</button><button>5</button><button>6</button><button>*</button>\n<button>1</button><button>2</button><button>3</button><button>-</button>\n<button>0</button><button>C</button><button>=</button><button>+</button>\n</div>',
    css:'body{font-family:sans-serif;max-width:260px;margin:20px auto}\n#disp{width:100%;font-size:24px;text-align:right;margin-bottom:8px}\n#keys{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}\nbutton{font-size:18px;padding:10px}',
    js:'const disp = document.getElementById("disp");\ndocument.getElementById("keys").addEventListener("click", function(e){\n  const k = e.target.textContent;\n  if(k === "C"){ disp.value = ""; }\n  else if(k === "="){\n    try { disp.value = Function("return (" + disp.value + ")")(); }\n    catch(err){ disp.value = "Error"; }\n  }\n  else { disp.value += k; }\n});'
  }
},
{
  id:"port", n:"Portfolio Page", icon:"💼",
  d:"Your personal one-page site: header, about, projects grid and contact. Uses semantic HTML and responsive CSS.",
  skills:["semantic tags","flexbox/grid","media queries"], time:"45–60 min",
  steps:["Header with your name and nav links","About section with a short bio","Projects section with 3 cards in a grid","Contact section with a button link","Looks good on mobile (media query)"],
  starter:{
    html:'<header><h1>Your Name</h1><nav><a href="#about">About</a> <a href="#work">Work</a> <a href="#contact">Contact</a></nav></header>\n<section id="about"><h2>About</h2><p>Write 2 lines about yourself.</p></section>\n<section id="work"><h2>Work</h2><div class="grid"><div class="card">Project 1</div><div class="card">Project 2</div><div class="card">Project 3</div></div></section>\n<section id="contact"><h2>Contact</h2><a href="mailto:you@mail.com"><button>Hire me</button></a></section>\n<footer><p id="yr"></p></footer>',
    css:'body{font-family:sans-serif;margin:0}\nheader{background:#0f172a;color:#fff;padding:16px;text-align:center}\nsection{padding:20px;max-width:700px;margin:auto}\n.grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}\n.card{border:1px solid #ccc;border-radius:8px;padding:16px;text-align:center}\n@media(max-width:600px){.grid{grid-template-columns:1fr}}',
    js:'document.getElementById("yr").textContent = "© " + new Date().getFullYear() + " Your Name";'
  }
}
];
