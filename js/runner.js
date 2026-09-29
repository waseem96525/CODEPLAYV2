// Builds sandboxed srcdoc + runs tests INSIDE iframe via postMessage (no allow-same-origin needed)
const Runner = (() => {
  // NOTE: no regex loop-rewriting (it breaks valid code). Protection =
  // sandboxed iframe (separate thread) + parent-side 4s timeout in app.js.
  function guardJS(code){ return code; }
  function esc(s){ return s.replace(/<\/script/gi,"<\\/script"); }

  function buildDoc(ch, code, mode){
    const testJSON = esc(JSON.stringify(ch.tests||[]));
    const rawJSON = esc(JSON.stringify(code));
    if (ch.track === "js") {
      const user = esc(guardJS(code));
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:12px}.highlight{background:yellow;padding:8px}#output{border:1px dashed #888;padding:8px;margin:8px 0;min-height:24px}#app{margin:8px 0}</style></head><body><div id="output">output</div><div id="app"></div><script>
window.__logs=[];window.__err="";
const _log=console.log.bind(console);
console.log=(...a)=>{const t=a.map(x=>{try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ");window.__logs.push(t);_log(...a);};
window.onerror=(m)=>{window.__err=String(m)};
try{
${user}
}catch(e){window.__err=String(e&&e.message||e)}
function normColor(c){try{const d=document.createElement("div");d.style.color=c;document.body.appendChild(d);const v=getComputedStyle(d).color;d.remove();return v}catch(e){return c}}
setTimeout(()=>{
 const TESTS=${testJSON}; const RAW=${rawJSON}; const out=[];
 const norm=s=>String(s??"").toLowerCase().replace(/\\s+/g,"");
 const normSp=s=>String(s??"").toLowerCase().replace(/\\s+/g,"").replace(/;/g,"");
 try{
  TESTS.forEach((t,i)=>{
   const label="Test "+(i+1);
   try{
    if(t.type==="selector"){const el=document.querySelector(t.value);if(!el)throw new Error("“"+t.value+"” not found");if(t.text&&!el.textContent.toLowerCase().includes(String(t.text).toLowerCase()))throw new Error("text “"+t.text+"” not found (found: “"+el.textContent.trim().slice(0,40)+"”)");out.push({ok:true,label})}
    else if(t.type==="count"){const n=document.querySelectorAll(t.selector).length;const need=t.exact??t.min??1;if(t.exact!=null?n!==need:n<need)throw new Error(t.selector+" count "+n+", expected "+need);out.push({ok:true,label})}
    else if(t.type==="attr"){const el=document.querySelector(t.selector);if(!el)throw new Error(t.selector+" not found");const v=el.getAttribute(t.attr);if(t.exists){if(v==null&&!(el.hasAttribute&&el.hasAttribute(t.attr)))throw new Error("add the "+t.attr+" attribute")}else if(v==null||!String(v).toLowerCase().includes(String(t.value).toLowerCase()))throw new Error(t.attr+" should contain “"+t.value+"”");out.push({ok:true,label})}
    else if(t.type==="style"){const el=document.querySelector(t.selector);if(!el)throw new Error(t.selector+" not found");let v=getComputedStyle(el).getPropertyValue(t.prop)||getComputedStyle(el)[t.prop];if(t.prop==="font-weight"&&/bold/i.test(t.value))t.value="700";if(/color/.test(t.prop)){if(normColor(v)!==normColor(t.value)&&!norm(v).includes(norm(t.value)))throw new Error(t.prop+" should be “"+t.value+"”")}else if(!norm(v).includes(norm(t.value)))throw new Error(t.prop+" should contain “"+t.value+"” (found: "+String(v).trim()+")");out.push({ok:true,label})}
    else if(t.type==="contains"){if(!normSp(RAW).includes(normSp(t.value)))throw new Error("write “"+t.value+"” in your code");out.push({ok:true,label})}
    else if(t.type==="js-contains"){if(!RAW.toLowerCase().includes(String(t.value).toLowerCase()))throw new Error("write “"+t.value+"” in your code");out.push({ok:true,label})}
    else if(t.type==="js-output"){const all=window.__logs.join("\\n").toLowerCase();if(!all.includes(String(t.value).toLowerCase()))throw new Error("print “"+t.value+"” using console.log");out.push({ok:true,label})}
    else if(t.type==="js-expr"){let r;try{r=eval(t.expr)}catch(e){throw new Error(t.expr+" failed to run: "+e.message)}const got=(typeof r==="object"?JSON.stringify(r):String(r));if(String(got)!==String(t.expected))throw new Error(t.expr+" = "+got+", expected "+t.expected);out.push({ok:true,label})}
    else if(t.type==="dom-text"){const el=document.querySelector(t.selector);if(!el)throw new Error(t.selector+" not found");if(!el.textContent.toLowerCase().includes(String(t.text).toLowerCase()))throw new Error("write “"+t.text+"” inside "+t.selector);out.push({ok:true,label})}
    else out.push({ok:true,label});
   }catch(e){out.push({ok:false,label,msg:e.message})}
  });
 }catch(e){out.push({ok:false,label:"harness",msg:String(e.message)})}
 parent.postMessage({__cp:true,mode:${JSON.stringify(mode)},logs:window.__logs,err:window.__err,results:out},"*");
},50);
<\/script></body></html>`;
    }
    // html / css tracks
    const body = ch.track === "html"
      ? code
      : code; // css track: full doc already
    const doc = ch.track === "html"
      ? `<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_blank"><style>body{font-family:sans-serif;padding:12px}</style></head><body>${body}<script>
function normColor(c){try{const d=document.createElement("div");d.style.color=c;document.body.appendChild(d);const v=getComputedStyle(d).color;d.remove();return v}catch(e){return c}}
setTimeout(()=>{
 const TESTS=${testJSON}; const RAW=${rawJSON}; const out=[];
 const norm=s=>String(s??"").toLowerCase().replace(/\\s+/g,"");
 const normSp=s=>String(s??"").toLowerCase().replace(/\\s+/g,"").replace(/;/g,"");
 TESTS.forEach((t,i)=>{const label="Test "+(i+1);try{
  if(t.type==="selector"){const el=document.querySelector(t.value);if(!el)throw new Error("“"+t.value+"” not found");if(t.text&&!el.textContent.toLowerCase().includes(String(t.text).toLowerCase()))throw new Error("text “"+t.text+"” not found");out.push({ok:true,label})}
  else if(t.type==="count"){const n=document.querySelectorAll(t.selector).length;const need=t.exact??t.min??1;if(t.exact!=null?n!==need:n<need)throw new Error(t.selector+" count "+n+", expected "+need);out.push({ok:true,label})}
  else if(t.type==="attr"){const el=document.querySelector(t.selector);if(!el)throw new Error(t.selector+" not found");const v=el.getAttribute(t.attr);if(t.exists){if(v==null&&!el.hasAttribute(t.attr))throw new Error("add the "+t.attr+" attribute")}else if(v==null||!String(v).toLowerCase().includes(String(t.value).toLowerCase()))throw new Error(t.attr+" should contain “"+t.value+"”");out.push({ok:true,label})}
  else if(t.type==="style"){const el=document.querySelector(t.selector);if(!el)throw new Error(t.selector+" not found");let v=getComputedStyle(el).getPropertyValue(t.prop)||getComputedStyle(el)[t.prop];if(t.prop==="font-weight"&&/bold/i.test(t.value))t.value="700";if(/color/.test(t.prop)){if(normColor(v)!==normColor(t.value)&&!norm(v).includes(norm(t.value)))throw new Error(t.prop+" should be “"+t.value+"”")}else if(!norm(v).includes(norm(t.value)))throw new Error(t.prop+" should contain “"+t.value+"” (found: "+String(v).trim()+")");out.push({ok:true,label})}
  else if(t.type==="contains"){if(!normSp(RAW).includes(normSp(t.value)))throw new Error("write “"+t.value+"” in your code");out.push({ok:true,label})}
  else out.push({ok:true,label});
 }catch(e){out.push({ok:false,label,msg:e.message})}});
 parent.postMessage({__cp:true,mode:${JSON.stringify(mode)},logs:[],err:"",results:out},"*");
},50);
<\/script></body></html>`
      : code.replace(/<\/body>/i, `<script>
function normColor(c){try{const d=document.createElement("div");d.style.color=c;document.body.appendChild(d);const v=getComputedStyle(d).color;d.remove();return v}catch(e){return c}}
setTimeout(()=>{
 const TESTS=${testJSON}; const RAW=${rawJSON}; const out=[];
 const norm=s=>String(s??"").toLowerCase().replace(/\\s+/g,"");
 const normSp=s=>String(s??"").toLowerCase().replace(/\\s+/g,"").replace(/;/g,"");
 TESTS.forEach((t,i)=>{const label="Test "+(i+1);try{
  if(t.type==="selector"){const el=document.querySelector(t.value);if(!el)throw new Error("“"+t.value+"” not found");if(t.text&&!el.textContent.toLowerCase().includes(String(t.text).toLowerCase()))throw new Error("text “"+t.text+"” not found");out.push({ok:true,label})}
  else if(t.type==="count"){const n=document.querySelectorAll(t.selector).length;const need=t.exact??t.min??1;if(t.exact!=null?n!==need:n<need)throw new Error(t.selector+" count "+n);out.push({ok:true,label})}
  else if(t.type==="attr"){const el=document.querySelector(t.selector);if(!el)throw new Error(t.selector+" not found");const v=el.getAttribute(t.attr);if(t.exists){if(v==null&&!el.hasAttribute(t.attr))throw new Error("add the "+t.attr+" attribute")}else if(v==null||!String(v).toLowerCase().includes(String(t.value).toLowerCase()))throw new Error(t.attr+" should contain “"+t.value+"”");out.push({ok:true,label})}
  else if(t.type==="style"){const el=document.querySelector(t.selector);if(!el)throw new Error(t.selector+" not found");let v=getComputedStyle(el).getPropertyValue(t.prop)||getComputedStyle(el)[t.prop];if(t.prop==="font-weight"&&/bold/i.test(t.value))t.value="700";if(/color/.test(t.prop)){if(normColor(v)!==normColor(t.value)&&!norm(v).includes(norm(t.value)))throw new Error(t.prop+" should be “"+t.value+"”")}else if(!norm(v).includes(norm(t.value)))throw new Error(t.prop+" should contain “"+t.value+"” (found: "+String(v).trim()+")");out.push({ok:true,label})}
  else if(t.type==="contains"){if(!normSp(RAW).includes(normSp(t.value)))throw new Error("write “"+t.value+"” in your code");out.push({ok:true,label})}
  else out.push({ok:true,label});
 }catch(e){out.push({ok:false,label,msg:e.message})}});
 parent.postMessage({__cp:true,mode:${JSON.stringify(mode)},logs:[],err:"",results:out},"*");
},50);
<\/script></body>`);
    return doc;
  }

  function previewOnly(ch, code){
    if (ch.track === "js") {
      const user = esc(guardJS(code));
      return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:sans-serif;padding:12px}.highlight{background:yellow;padding:8px}#output{border:1px dashed #888;padding:8px;min-height:24px}#app{margin:8px 0}#con{background:#0f172a;color:#d1fae5;font-family:monospace;padding:8px;white-space:pre-wrap}</style></head><body><div id="output">output</div><div id="app"></div><div id="con"></div><script>
const _l=console.log.bind(console);window.__o=[];
console.log=(...a)=>{const t=a.map(x=>{try{return typeof x==="object"?JSON.stringify(x):String(x)}catch(e){return String(x)}}).join(" ");window.__o.push(t);_l(...a);document.getElementById("con").textContent=window.__o.join("\\n")};
window.onerror=(m)=>{document.getElementById("con").textContent+="\\nError: "+m};
try{${user}}catch(e){document.getElementById("con").textContent+="\\nError (line?): "+(e.message||e)}
<\/script></body></html>`;
    }
    if (ch.track === "html") return `<!DOCTYPE html><html><head><meta charset="utf-8"><base target="_blank"><style>body{font-family:sans-serif;padding:12px}</style></head><body>${code}</body></html>`;
    return code; // css full doc
  }

  return { buildDoc, previewOnly };
})();
