// No npm dependencies. CHROME_BIN must point to a Chromium/Chrome executable.
// Run: CHROME_BIN=/path/to/chrome node tests/mobile-layout.mjs
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile,mkdtemp,rm} from 'node:fs/promises';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve,extname} from 'node:path';
import vm from 'node:vm';
const root=resolve(import.meta.dirname,'..');
const chrome=process.env.CHROME_BIN;
assert(chrome,'Set CHROME_BIN to a Chromium/Chrome executable');
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
const server=createServer(async(req,res)=>{try{const path=new URL(req.url,'http://localhost').pathname;const p=path==='/tests/runtime-button-card.js'&&process.env.BUTTON_CARD_JS?resolve(process.env.BUTTON_CARD_JS):resolve(root,'.'+path);assert(p.startsWith(root+'/')||p===resolve(process.env.BUTTON_CARD_JS||root));res.setHeader('Content-Type',extname(p)==='.js'?'text/javascript':extname(p)==='.json'?'application/json':'text/html');res.end(await readFile(p));}catch{res.writeHead(404).end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const port=server.address().port,profile=await mkdtemp(join(tmpdir(),'hemma-layout-'));
const child=spawn(chrome,['--headless=new','--disable-gpu','--no-proxy-server','--disable-background-networking','--no-first-run','--remote-debugging-port=0',`--user-data-dir=${profile}`,'about:blank'],{stdio:'ignore'});
let ws;
try{
 let endpoint;for(let i=0;i<150;i++){try{const [p]=String(await readFile(join(profile,'DevToolsActivePort'))).split('\n');endpoint=`http://127.0.0.1:${p}`;break;}catch{await sleep(100);}}
 assert(endpoint,'Chrome debugging endpoint did not start');
 const tabs=await(await fetch(endpoint+'/json/list')).json();ws=new WebSocket(tabs.find(x=>x.type==='page').webSocketDebuggerUrl);await new Promise(r=>ws.onopen=r);
 let seq=0;const pending=new Map();ws.onmessage=e=>{const m=JSON.parse(e.data);if(pending.has(m.id)){pending.get(m.id)(m);pending.delete(m.id);}};
 const c=(method,params={})=>new Promise((r,j)=>{const id=++seq;const timer=setTimeout(()=>{pending.delete(id);j(Error('CDP timeout: '+method));},10000);pending.set(id,m=>{clearTimeout(timer);if(m.error)j(Error(JSON.stringify(m.error)));else r(m.result);});ws.send(JSON.stringify({id,method,params}));});
 const js=async(expression)=>{const r=await c('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});assert(!r.exceptionDetails,JSON.stringify(r.exceptionDetails));return r.result.value;};
 await c('Page.navigate',{url:`http://127.0.0.1:${port}/tests/mobile-layout.html${process.env.BUTTON_CARD_JS?'?real':''}`});
 for(let i=0;i<100&&!await js('window.layoutReady');i++)await sleep(100);
 assert(await js('window.layoutReady'),await js('window.fixtureError'));
 const cards=Array.from({length:12},(_,i)=>({type:'custom:button-card',template:'hemma_entity',name:'Device '+i,lines:i===2?8:1,variables:{size:i===3?'large':'small'}}));
 cards.push({type:'custom:raw-test',name:'Raw card',lines:12});
 cards.push({type:'custom:button-card',template:'hemma_entity',variables:{enabled:false}});
 cards.push({type:'conditional',conditions:[],card:{type:'custom:button-card',template:'hemma_entity',name:'Conditional tile'}});
 await js(`createRow(${JSON.stringify({scroll_mode:true,cards})})`);await sleep(500);
 let previousColumns=0;
 for(const width of [320,390,600,850,1000,1182,1440,390]){
  await c('Emulation.setDeviceMetricsOverride',{width,height:850,deviceScaleFactor:1,mobile:false});await sleep(100);
  const metrics=await js(`(()=>{const con=row.shadowRoot.querySelector('#container');const wrappers=[...con.children].filter(w=>w.getBoundingClientRect().height>0);const rects=wrappers.map(w=>w.getBoundingClientRect());let overlaps=0;for(let i=0;i<rects.length;i++)for(let j=i+1;j<rects.length;j++){const a=rects[i],b=rects[j];if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)overlaps++;}return {position:getComputedStyle(row).position,columns:getComputedStyle(con).gridTemplateColumns.split(' ').length,overlaps,overflow:wrappers.filter(w=>(w.firstElementChild.shadowRoot.querySelector('ha-card')||w.firstElementChild.shadowRoot.querySelector('button-card')?.shadowRoot.querySelector('ha-card')).getBoundingClientRect().bottom>w.getBoundingClientRect().bottom+1).length,disabled:row._wrappers[13].getBoundingClientRect().height};})()`);
  assert.equal(metrics.position,'relative');assert.equal(metrics.overlaps,0);assert.equal(metrics.overflow,0);assert.equal(metrics.disabled,0);
  if(width===320)assert.equal(metrics.columns,1);if(width===1440)assert(metrics.columns>previousColumns);previousColumns=metrics.columns;
  console.log('PASS flow width',width,'columns',metrics.columns);
 }
 assert(await js(`row._cards[0].classList.contains('hemma-compact')`));
 assert(await js(`row._cards[14].shadowRoot.querySelector('button-card').classList.contains('hemma-flow')`));
 assert.equal(await js(`row._cards[12].classList.contains('hemma-compact')`),false);
 await js(`createRow(${JSON.stringify({scroll_mode:true,sort:false,cards:[{type:'custom:button-card',template:'hemma_entity',full_width:true,name:'Header'}]})})`);
 assert.equal(await js(`getComputedStyle(row).position`),'relative');
 assert.equal(await js(`row._cards[0].classList.contains('hemma-compact')`),false);
 await js(`createRow(${JSON.stringify({scroll_mode:false,cards:cards.slice(0,2)})})`);
 await c('Emulation.setDeviceMetricsOverride',{width:1440,height:900,deviceScaleFactor:1,mobile:false});await sleep(100);
 assert.equal(await js(`getComputedStyle(row.shadowRoot.querySelector('#container')).display`),'flex');
 assert.equal(await js(`row._cards[0].classList.contains('hemma-compact')`),false);
 console.log('PASS desktop rail and outer chrome unchanged');
 const src=await readFile(join(root,'custom_components/hemma/scripts/hemma-redirect.js'),'utf8');
 for(const t of [{path:'/test-mobile/home',match:false,toggle:'on',want:'/test-mobile/home'},{path:'/test/home',match:true,toggle:'on',want:'/test-mobile/home'},{path:'/test/home',match:false,toggle:'on',want:'/test/home'},{path:'/test/home',match:true,toggle:'off',want:'/test/home'}]){
  const location={pathname:t.path};const window={location,matchMedia:()=>({matches:t.match,addEventListener(){}}),history:{replaceState(a,b,p){location.pathname=p;}},dispatchEvent(){},addEventListener(){}};
  vm.runInNewContext(src,{window,document:{readyState:'complete',querySelector:()=>({hass:{panels:{test:{},'test-mobile':{}},states:{'input_boolean.hemma_dashboard_redirect':{state:t.toggle}}}})},Event:class{},setTimeout:f=>f(),requestAnimationFrame:f=>f()});assert.equal(location.pathname,t.want);
 }
 console.log('PASS routing: mobile retained, desktop/tablet unchanged, toggle honored');
}finally{ws?.close();child.kill();await new Promise(r=>child.exitCode!==null?r():child.once('exit',r));await new Promise(r=>server.close(r));await rm(profile,{recursive:true,force:true});}
