/**
 * GitDrive — file-grid.js
 * assets/function/file-grid.js
 * ============================================================
 * 文件网格/列表渲染与多选
 *
 * 包含函数：
 *   setFCat/setFType     切换分类/类型筛选
 *   renderFG()           渲染文件网格（核心）
 *   buildGC()            构建网格卡片 DOM
 *   buildLI()            构建列表项 DOM
 *   toggleFGSel/exitFGSel/tgFGItem  多选
 *   dlSel/delSel/moveSel/doBatchMv  批量操作
 *   showCtxM()           桌面右键菜单
 *   showBS()             移动端底部操作菜单
 *
 * 依赖：
 *   S, catMap（app-state.js）
 *   CATS, TYPE_GROUPS, APP_CONFIG（config.js）
 *   rawUrl, isImage, isVid, isAud, xExt, fileIcon, fmtSz, esc, dlFile（core-utils.js）
 *   ghGet, ghPut, ghDel, ghPath（core-utils.js）
 *   toast, showMd, closeMd, showConfirm, openMP（ui-components.js）
 *   saveMsgs, saveMeta, loadFiles, updateStats（data-sync.js）
 *   tgFav, mvFile, rnFile, delFile（file-ops.js）
 *   renderMsgs（chat-messages.js）
 * ============================================================
 */

function setFCat(id){
  S.fCat=id;
  document.querySelectorAll('#fg-cats .fc2').forEach(function(b){ b.classList.toggle('on',b.dataset.fcat===id); });
  renderFG();
}
function setFType(id){
  S.fType=id;
  document.querySelectorAll('#fg-types .fc2').forEach(function(b){ b.classList.toggle('on',b.dataset.ftype===id); });
  renderFG();
}

// ── 渲染文件网格 ──────────────────────────────────────────────
function renderFG(){
  var grid=document.getElementById('fg'); if(!grid) return;
  var files=S.files.slice();
  if(S.fCat==='fav') files=files.filter(function(f){ return S.meta.favorites.indexOf(f.path)>=0; });
  else if(S.fCat!=='all') files=files.filter(function(f){ return f.category===S.fCat; });
  if(S.fType!=='all'){ var g=TYPE_GROUPS.find(function(x){ return x.id===S.fType; }); if(g) files=files.filter(function(f){ return g.exts.indexOf(xExt(f.name))>=0; }); }
  var q=(document.getElementById('fg-q').value||'').trim().toLowerCase();
  if(q) files=files.filter(function(f){ return f.name.toLowerCase().indexOf(q)>=0; });
  var sort=document.getElementById('sort-sel').value||'time-d';
  var byPath={}; S.msgs.forEach(function(m){ if(m.files) m.files.forEach(function(f){ byPath[f.path]=m.timestamp; }); });
  if(sort==='time-d') files.sort(function(a,b){ return (byPath[b.path]||'')>(byPath[a.path]||'')?1:-1; });
  else if(sort==='time-a') files.sort(function(a,b){ return (byPath[a.path]||'')>(byPath[b.path]||'')?1:-1; });
  else if(sort==='name') files.sort(function(a,b){ return a.name.localeCompare(b.name); });
  else if(sort==='size') files.sort(function(a,b){ return (b.size||0)-(a.size||0); });
  if(S.fView==='list') grid.classList.add('lv'); else grid.classList.remove('lv');
  if(S.fgSel) grid.classList.add('sel-mode'); else grid.classList.remove('sel-mode');
  grid.innerHTML='';
  if(!files.length){ var emp=document.createElement('div'); emp.style.cssText='grid-column:1/-1'; emp.innerHTML='<div class="emp"><div class="emp-ic">\u{1F4ED}</div><div class="emp-t">\u6CA1\u6709\u6587\u4EF6</div></div>'; grid.appendChild(emp); return; }
  files.forEach(function(f,i){
    var cat=catMap[f.category]||CATS[0], img=isImage(f.name), med=isVid(f.name)||isAud(f.name);
    var url=rawUrl(f.path), t=byPath[f.path]?new Date(byPath[f.path]).toLocaleDateString('zh-CN'):'';
    var fav=S.meta.favorites.indexOf(f.path)>=0, sel=!!S.fgSeled[f.path], ext2=xExt(f.name).toUpperCase();
    if(S.fView==='list') grid.appendChild(buildLI(f,cat,img,med,url,t,fav,sel,ext2,i));
    else grid.appendChild(buildGC(f,cat,img,med,url,t,fav,sel,ext2,i));
  });
  // 移动端长按菜单
  grid.querySelectorAll('.li').forEach(function(li){
    var timer;
    li.addEventListener('touchstart',function(){ timer=setTimeout(function(){ var fi=S.files.find(function(x){ return x.path===li.dataset.path; }); if(fi) showBS(fi); },450); },{passive:true});
    li.addEventListener('touchend',function(){ clearTimeout(timer); },{passive:true});
    li.addEventListener('touchmove',function(){ clearTimeout(timer); },{passive:true});
  });
  // 桌面右键菜单
  grid.querySelectorAll('.gc').forEach(function(gc){
    gc.addEventListener('contextmenu',function(e){ e.preventDefault(); var fi=S.files.find(function(x){ return x.path===gc.dataset.path; }); if(fi) showCtxM(e.clientX,e.clientY,fi); });
  });
}

// ── 网格卡片 ──────────────────────────────────────────────────
function buildGC(f,cat,img,med,url,t,fav,sel,ext2,i){
  var d=document.createElement('div'); d.className='gc'+(sel?' sel':''); d.style.animationDelay=i*0.02+'s'; d.dataset.path=f.path;
  var ck=document.createElement('div'); ck.className='gc-ck'+(sel?' on':''); ck.textContent='\u2713';
  ck.addEventListener('click',function(e){ e.stopPropagation(); tgFGItem(f.path); }); d.appendChild(ck);
  if(fav){ var fstar=document.createElement('div'); fstar.className='gc-fav'; fstar.textContent='\u2605'; d.appendChild(fstar); }
  var thumb=document.createElement('div'); thumb.className='gc-thumb'; if(!img) thumb.style.background=cat.bg;
  if(img){ var im=document.createElement('img'); im.src=url; im.loading='lazy'; im.alt=f.name; thumb.appendChild(im); }
  else { var ic=document.createElement('div'); ic.className='gc-icon'; ic.innerHTML=fileIcon(f.name)+'<span class="gc-ext">'+ext2+'</span>'; thumb.appendChild(ic); }
  if(img) thumb.addEventListener('click',function(){ var imgs=S.files.filter(function(x){ return isImage(x.name)&&(S.fCat==='all'||x.category===S.fCat); }); openMP(url,f.name,imgs.map(function(x){ return rawUrl(x.path); }),imgs.findIndex(function(x){ return x.path===f.path; })); });
  else if(med) thumb.addEventListener('click',function(){ openMP(url,f.name,[],0); });
  else thumb.addEventListener('click',function(){ dlFile(url,f.name); });
  d.appendChild(thumb);
  var info=document.createElement('div'); info.className='gc-info';
  info.innerHTML='<div class="gc-name">'+esc(f.name)+'</div><div class="gc-meta">'+fmtSz(f.size)+(t?' \u00B7 '+t:'')+'</div>'; d.appendChild(info);
  var acts=document.createElement('div'); acts.className='gc-acts';
  function ga(ic,cls,fn){ var b=document.createElement('button'); b.className='ga'+(cls?' '+cls:''); b.textContent=ic; b.addEventListener('click',function(e){ e.stopPropagation(); fn(); }); return b; }
  acts.appendChild(ga(fav?'\u2605':'\u2606',fav?'fav-on':'',function(){ tgFav(f.path); }));
  acts.appendChild(ga('\u2197','',function(){ mvFile(f.path,f.name); }));
  if(!img) acts.appendChild(ga('\u270E','',function(){ rnFile(f.path,f.name); }));
  acts.appendChild(ga('\u2193','',function(){ dlFile(url,f.name); }));
  acts.appendChild(ga('\u2715','del',function(){ delFile(f.path,f.sha); }));
  d.appendChild(acts); return d;
}

// ── 列表项 ────────────────────────────────────────────────────
function buildLI(f,cat,img,med,url,t,fav,sel,ext2,i){
  var d=document.createElement('div'); d.className='li'+(sel?' sel':''); d.style.animationDelay=i*0.02+'s'; d.dataset.path=f.path;
  var ck=document.createElement('div'); ck.className='li-ck'+(sel?' on':''); ck.textContent='\u2713';
  ck.addEventListener('click',function(){ tgFGItem(f.path); }); d.appendChild(ck);
  var th=document.createElement('div'); th.className='li-thumb';
  if(img){ var im=document.createElement('img'); im.src=url; im.loading='lazy'; th.appendChild(im); }
  else { th.innerHTML='<div class="li-icon">'+fileIcon(f.name)+'<span class="gc-ext">'+ext2+'</span></div>'; }
  th.addEventListener('click',function(){ if(img||med) openMP(url,f.name,[],0); else dlFile(url,f.name); }); d.appendChild(th);
  var info=document.createElement('div'); info.className='li-info';
  info.innerHTML='<div class="li-name">'+esc(f.name)+'</div><div class="li-meta">'+cat.icon+' '+cat.label+' \u00B7 '+fmtSz(f.size)+(t?' \u00B7 '+t:'')+'</div>';
  info.addEventListener('click',function(){ if(img||med) openMP(url,f.name,[],0); else dlFile(url,f.name); }); d.appendChild(info);
  function la(ic,cls,fn){ var b=document.createElement('button'); b.className='la'+(cls?' '+cls:''); b.textContent=ic; b.addEventListener('click',function(e){ e.stopPropagation(); fn(); }); return b; }
  var actsm=document.createElement('div'); actsm.className='li-acts-m';
  actsm.appendChild(la(fav?'\u2605':'\u2606',fav?'fav-on':'',function(){ tgFav(f.path); }));
  actsm.appendChild(la('\u2715','del',function(){ delFile(f.path,f.sha); })); d.appendChild(actsm);
  var actsd=document.createElement('div'); actsd.className='li-acts-d';
  actsd.appendChild(la(fav?'\u2605':'\u2606',fav?'fav-on':'',function(){ tgFav(f.path); }));
  actsd.appendChild(la('\u2197','',function(){ mvFile(f.path,f.name); }));
  if(!img) actsd.appendChild(la('\u270E','',function(){ rnFile(f.path,f.name); }));
  actsd.appendChild(la('\u2193','',function(){ dlFile(url,f.name); }));
  actsd.appendChild(la('\u2715','del',function(){ delFile(f.path,f.sha); })); d.appendChild(actsd);
  return d;
}

// ── 多选 ──────────────────────────────────────────────────────
function toggleFGSel(){ S.fgSel=!S.fgSel; S.fgSeled={}; document.getElementById('fg-selbar').classList.toggle('on',S.fgSel); document.getElementById('btn-fg-sel').textContent=S.fgSel?'\u53D6\u6D88':'\u591A\u9009'; renderFG(); }
function exitFGSel(){ S.fgSel=false; S.fgSeled={}; document.getElementById('fg-selbar').classList.remove('on'); document.getElementById('btn-fg-sel').textContent='\u591A\u9009'; renderFG(); }
function tgFGItem(path){ if(!S.fgSel) return; if(S.fgSeled[path]) delete S.fgSeled[path]; else S.fgSeled[path]=true; document.getElementById('fg-selcnt').textContent='\u5DF2\u9009 '+Object.keys(S.fgSeled).length+' \u4E2A'; var card=document.querySelector('#fg [data-path="'+CSS.escape(path)+'"]'); if(card) card.classList.toggle('sel',!!S.fgSeled[path]); }
function dlSel(){ var ps=Object.keys(S.fgSeled); if(!ps.length) return; if(ps.length>APP_CONFIG.batchDlMax){ toast('\u6279\u91CF\u4E0B\u8F7D\u6700\u591A'+APP_CONFIG.batchDlMax+'\u4E2A','warn'); return; } ps.forEach(function(path,i){ var f=S.files.find(function(x){ return x.path===path; }); if(f) setTimeout(function(){ dlFile(rawUrl(f.path),f.name); },i*200); }); toast('\u5DF2\u89E6\u53D1 '+ps.length+' \u4E2A\u4E0B\u8F7D','ok'); }
function delSel(){
  var ps=Object.keys(S.fgSeled); if(!ps.length) return;
  showConfirm('\u6279\u91CF\u79FB\u81F3\u56DE\u6536\u7AD9','\u5C06 '+ps.length+' \u4E2A\u6587\u4EF6\u79FB\u81F3\u56DE\u6536\u7AD9\uFF1F',function(){
    var chain=Promise.resolve();
    ps.forEach(function(path){ var f=S.files.find(function(x){ return x.path===path; }); if(f) chain=chain.then(function(){ return moveToTrash(path,f.name,f.size); }); });
    chain.then(function(){ S.msgs=S.msgs.map(function(m){ if(m.files) m.files=m.files.filter(function(f){ return !S.fgSeled[f.path]; }); return m; }).filter(function(m){ return m.type==='text'||(m.files&&m.files.length>0); }); S.meta.favorites=S.meta.favorites.filter(function(p){ return !S.fgSeled[p]; }); return Promise.all([saveMsgs(),saveMeta()]); }).then(function(){ exitFGSel(); return loadFiles(); }).then(function(){ updateStats(); renderMsgs(); toast('\u5DF2\u79FB\u81F3\u56DE\u6536\u7AD9','ok'); });
  });
}
function moveSel(){
  var ps=Object.keys(S.fgSeled); if(!ps.length) return;
  window._mvPaths=ps; window._mvCat=CATS[0].id;
  var html='<div class="md-t">\u79FB\u52A8 '+ps.length+' \u4E2A\u6587\u4EF6</div><div class="cmg">'+CATS.map(function(c,i){ return '<div class="cm-it'+(i===0?' on':'')+ '" data-cid="'+c.id+'"><span>'+c.icon+'</span>'+c.label+'</div>'; }).join('')+'</div><div class="md-btns"><button class="btn-g" id="mv-cancel">\u53D6\u6D88</button><button class="btn-a" id="mv-ok">\u79FB\u52A8</button></div>';
  showMd(html);
  document.querySelectorAll('.cm-it').forEach(function(el){ el.addEventListener('click',function(){ window._mvCat=this.dataset.cid; document.querySelectorAll('.cm-it').forEach(function(x){ x.classList.remove('on'); }); this.classList.add('on'); }); });
  document.getElementById('mv-cancel').addEventListener('click',closeMd);
  document.getElementById('mv-ok').addEventListener('click',doBatchMv);
}
function doBatchMv(){
  var paths=window._mvPaths||[], newCat=window._mvCat; closeMd();
  var chain=Promise.resolve();
  paths.forEach(function(oldPath){ chain=chain.then(function(){
    var name=oldPath.split('/').pop(), newPath=newCat+'/'+name; if(oldPath===newPath) return;
    return ghGet(ghPath(oldPath)).then(function(r){ if(!r.ok) return; return r.json().then(function(d){
      return ghPut(ghPath(newPath),{message:'Move [GitDrive]',content:d.content.replace(/\n/g,'')}).then(function(){ return ghDel(ghPath(oldPath),d.sha); }).then(function(){
        var fi=S.meta.favorites.indexOf(oldPath); if(fi>=0){ S.meta.favorites.splice(fi,1); S.meta.favorites.push(newPath); }
        S.msgs.forEach(function(m){ if(m.files) m.files.forEach(function(f){ if(f.path===oldPath){ f.path=newPath; f.category=newCat; } }); });
      });
    }); }).catch(function(e){ toast('\u79FB\u52A8\u5931\u8D25: '+name,'err'); });
  }); });
  chain.then(function(){ return Promise.all([saveMsgs(),saveMeta()]); }).then(function(){ exitFGSel(); return loadFiles(); }).then(function(){ updateStats(); toast('\u5DF2\u79FB\u52A8\u5230 '+(catMap[newCat]&&catMap[newCat].label||newCat),'ok'); });
}

// ── 右键菜单 ──────────────────────────────────────────────────
function showCtxM(x,y,f){
  var url=rawUrl(f.path), img=isImage(f.name), med=isVid(f.name)||isAud(f.name), fav=S.meta.favorites.indexOf(f.path)>=0;
  var mn=document.createElement('div'); mn.className='cm-menu'; mn.style.cssText='left:'+Math.min(x,window.innerWidth-185)+'px;top:'+Math.min(y,window.innerHeight-290)+'px';
  mn.addEventListener('click',function(e){ e.stopPropagation(); });
  var items=[[fav?'\u2605 \u53D6\u6D88\u6536\u85CF':'\u2606 \u6536\u85CF','',function(){ tgFav(f.path); }],['\u2197 \u79FB\u52A8\u5206\u7C7B','',function(){ mvFile(f.path,f.name); }]];
  if(!img) items.push(['\u270E \u91CD\u547D\u540D','',function(){ rnFile(f.path,f.name); }]);
  if(med||img) items.push(['\u25B6 \u9884\u89C8','',function(){ openMP(url,f.name,[],0); }]);
  items.push(['\u2193 \u4E0B\u8F7D','',function(){ dlFile(url,f.name); }],null,['\u2715 \u5220\u9664','d',function(){ delFile(f.path,f.sha); }]);
  mn.innerHTML=items.map(function(it){ return it===null?'<div class="cm-sep"></div>':'<div class="cmi '+(it[1]||'')+'">'+it[0]+'</div>'; }).join('');
  mn.querySelectorAll('.cmi').forEach(function(el,i){ var ri=items.filter(function(x){ return x!==null; }); el.addEventListener('click',function(){ document.getElementById('ctx-c').innerHTML=''; ri[i][2](); }); });
  document.getElementById('ctx-c').innerHTML=''; document.getElementById('ctx-c').appendChild(mn);
}

// ── 底部操作菜单（移动端）────────────────────────────────────
function showBS(f){
  var url=rawUrl(f.path), img=isImage(f.name), med=isVid(f.name)||isAud(f.name), fav=S.meta.favorites.indexOf(f.path)>=0;
  var ov=document.createElement('div'); ov.className='bs-ov';
  var bs=document.createElement('div'); bs.className='bs'; bs.addEventListener('click',function(e){ e.stopPropagation(); });
  var btns=[[fav?'\u2605':'\u2606',fav?'\u53D6\u6D88\u6536\u85CF':'\u6536\u85CF',function(){ tgFav(f.path); }],['\u2197','\u79FB\u52A8\u5206\u7C7B',function(){ mvFile(f.path,f.name); }]];
  if(!img) btns.push(['\u270E','\u91CD\u547D\u540D',function(){ rnFile(f.path,f.name); }]);
  if(med||img) btns.push(['\u25B6','\u9884\u89C8',function(){ openMP(url,f.name,[],0); }]);
  btns.push(['\u2193','\u4E0B\u8F7D',function(){ dlFile(url,f.name); }]);
  bs.innerHTML='<div class="bs-handle"></div><div class="bs-nm">'+esc(f.name)+'</div><div class="bs-grid">'+btns.map(function(b,i){ return '<button class="bs-btn" data-bsi="'+i+'"><span>'+b[0]+'</span>'+b[1]+'</button>'; }).join('')+'</div><button class="bs-del" id="bs-del">\u2715 \u5220\u9664</button>';
  bs.querySelectorAll('.bs-btn').forEach(function(btn){ btn.addEventListener('click',function(){ document.getElementById('ctx-c').innerHTML=''; btns[parseInt(this.dataset.bsi)][2](); }); });
  bs.querySelector('#bs-del').addEventListener('click',function(){ document.getElementById('ctx-c').innerHTML=''; delFile(f.path,f.sha); });
  ov.addEventListener('click',function(){ document.getElementById('ctx-c').innerHTML=''; });
  ov.appendChild(bs); document.getElementById('ctx-c').innerHTML=''; document.getElementById('ctx-c').appendChild(ov);
}
