/**
 * GitDrive — chat-messages.js
 * assets/function/chat-messages.js
 * ============================================================
 * 对话消息：渲染、发送、上传、置顶、清空、多选
 *
 * 包含函数：
 *   renderMsgs()         渲染消息列表
 *   buildMsgEl(m)        构建单条消息 DOM
 *   attachMsgTouch(el)   长按触摸菜单
 *   scrollBot()          滚动到底部
 *   addPend/rmPend/renderPend  待上传文件队列
 *   sendAll()            发送消息（含同名检测）
 *   doUpload()           执行上传
 *   dlMsg/editMsg/renMsg/delMsg  消息操作
 *   clearChat/restoreChat        清空/恢复历史
 *   togglePin/renderPinnedBar/jumpToPin/scrollToId  置顶系统
 *   toggleSel/exitSel/toggleSeled/dlSelMsgs/delSelMsgs  多选
 *   showScr/showFav/showCatFiles/setView  导航辅助
 *
 * 依赖：
 *   S, catMap（app-state.js）
 *   CATS, APP_CONFIG（config.js）
 *   ghGet, ghPut, ghPath, rawUrl, toB64,
 *   isImage, isVid, isAud, xExt, fileIcon, fmtSz, esc, dlFile（core-utils.js）
 *   toast, showMd, closeMd, showConfirm, showInput, openMP, arTA（ui-components.js）
 *   saveMsgs, loadFiles, updateStats（data-sync.js）
 *   moveToTrash（file-ops.js）
 *   renderTrash（trash-stats.js）
 *   renderStats（trash-stats.js）
 *   renderFG, setFCat（file-grid.js）
 *   renderMemos, setMemoFilter（memo.js）
 * ============================================================
 */

// ── 屏幕导航 ──────────────────────────────────────────────────
function showScr(name){
  ['chat','files','trash','stats','memo'].forEach(function(n){
    var el=document.getElementById(n+'-screen'); if(el) el.style.display='none';
    var ni=document.getElementById('n-'+n); if(ni) ni.classList.remove('on');
  });
  var scr=document.getElementById(name+'-screen'); if(scr) scr.style.display='flex';
  var ni=document.getElementById('n-'+name); if(ni) ni.classList.add('on');
  if(name==='trash') renderTrash();
  if(name==='stats') renderStats();
  if(name==='memo'){ setMemoFilter('all'); renderMemos(); }
  if(name==='files'){ S.fCat='all'; setFCat('all'); renderFG(); }
  closeSb();
}
function showFav(){ showScr('files'); setFCat('fav'); }
function showCatFiles(id){ showScr('files'); setFCat(id); }
function setView(v){
  S.fView=v;
  document.getElementById('vb-g').classList.toggle('on',v==='grid');
  document.getElementById('vb-l').classList.toggle('on',v==='list');
  renderFG();
}

// ── 待上传文件队列 ─────────────────────────────────────────────
function addPend(files){ Array.from(files).forEach(function(f){ S.pend.push(f); }); renderPend(); }
function rmPend(i){ S.pend.splice(i,1); renderPend(); }
function renderPend(){
  var el=document.getElementById('pend');
  if(!S.pend.length){ el.style.display='none'; return; }
  el.style.display='flex'; el.innerHTML='';
  S.pend.forEach(function(f,i){
    var d=document.createElement('div'); d.className='pf'; d.title=f.name;
    if(isImage(f.name)){
      var img=document.createElement('img'); img.src=URL.createObjectURL(f);
      img.onload=function(){ URL.revokeObjectURL(this.src); }; d.appendChild(img);
    } else {
      var ic=document.createElement('div'); ic.className='pf-icon';
      ic.innerHTML=fileIcon(f.name)+'<span class="pf-ext">'+xExt(f.name).toUpperCase()+'</span>'; d.appendChild(ic);
    }
    var rm=document.createElement('button'); rm.className='pf-rm'; rm.textContent='\u00D7'; rm.dataset.idx=i;
    rm.addEventListener('click',function(e){ e.stopPropagation(); rmPend(parseInt(this.dataset.idx)); });
    d.appendChild(rm); el.appendChild(d);
  });
}

// ── 发送（含同名检测）────────────────────────────────────────
function sendAll(){
  var txt=document.getElementById('ti').value.trim();
  var files=S.pend.slice();
  if(!txt&&!files.length) return;
  if(files.length){
    var dupes=files.filter(function(f){ return S.files.some(function(e){ return e.name===f.name; }); });
    if(dupes.length){
      var cat=catMap[S.cur]||CATS[0];
      var info=dupes.map(function(f){ var ex=S.files.find(function(e){ return e.name===f.name; }); return f.name+' (\u5DF2\u5728\u300C'+(catMap[ex.category]&&catMap[ex.category].label||ex.category)+'\u300D\u4E2D)'; }).join('\n');
      showMd('<div class="md-t" style="color:var(--or)">\u26A0\uFE0F \u53D1\u73B0\u540C\u540D\u6587\u4EF6</div><div class="md-p">\u4EE5\u4E0B\u6587\u4EF6\u5728\u4ED3\u5E93\u4E2D\u5DF2\u5B58\u5728\uFF1A\n<strong style="color:var(--t1)">'+esc(info)+'</strong>\n\n\u7EE7\u7EED\u5C06\u4E0A\u4F20\u5230\u300C<strong style="color:var(--ac2)">'+esc(cat.label)+'</strong>\u300D\u5E76\u8986\u76D6\u540C\u540D\u6587\u4EF6\u3002</div><div class="md-btns"><button class="btn-g" id="dc-cancel">\u53D6\u6D88\u4E0A\u4F20</button><button class="btn-or" id="dc-ok">\u8986\u76D6\u4E0A\u4F20</button></div>');
      document.getElementById('dc-cancel').addEventListener('click',closeMd);
      document.getElementById('dc-ok').addEventListener('click',function(){
        closeMd();
        document.getElementById('ti').value=''; arTA(document.getElementById('ti'));
        S.pend=[]; renderPend(); doUpload(files,txt);
      });
      return;
    }
  }
  document.getElementById('ti').value=''; arTA(document.getElementById('ti'));
  S.pend=[]; renderPend();
  if(files.length) doUpload(files,txt);
  else {
    var msg={id:Date.now().toString(),type:'text',content:txt,category:S.cur,timestamp:new Date().toISOString()};
    S.msgs.push(msg); renderMsgs(); scrollBot(); saveMsgs();
  }
}

function doUpload(files,caption){
  var cat=catMap[S.cur]||CATS[0];
  var uploaded=[], chain=Promise.resolve();
  files.forEach(function(f){
    chain=chain.then(function(){
      var path=cat.id+'/'+f.name;
      var pid='p'+Date.now()+Math.random().toString(36).slice(2);
      var pEl=document.createElement('div'); pEl.className='up';
      pEl.innerHTML='<div class="up-name">'+esc(f.name)+'</div><div class="pb"><div class="pbar" id="pb-'+pid+'"></div></div>';
      document.getElementById('up-area').appendChild(pEl);
      return new Promise(function(res,rej){
        var fr=new FileReader();
        fr.onprogress=function(ev){ if(ev.lengthComputable){ var pb=document.getElementById('pb-'+pid); if(pb) pb.style.width=Math.round(ev.loaded/ev.total*70)+'%'; } };
        fr.onload=function(){ res(fr.result.split(',')[1]); }; fr.onerror=rej; fr.readAsDataURL(f);
      }).then(function(b64){
        var pb=document.getElementById('pb-'+pid); if(pb) pb.style.width='85%';
        return ghGet(ghPath(path)).then(function(chk){ if(chk.ok) return chk.json().then(function(cd){ return cd.sha; }); }).then(function(sha){
          var body={message:'Add '+f.name+' [GitDrive]',content:b64}; if(sha) body.sha=sha;
          return ghPut(ghPath(path),body);
        }).then(function(r){ if(!r.ok) throw new Error('\u4E0A\u4F20\u5931\u8D25: '+f.name); return r.json(); })
        .then(function(rd){ if(pb) pb.style.width='100%'; uploaded.push({name:f.name,path:path,size:f.size,mime:f.type,sha:rd.content.sha}); });
      }).catch(function(e){ toast(e.message,'err'); }).then(function(){ setTimeout(function(){ pEl.remove(); },600); });
    });
  });
  chain.then(function(){
    if(!uploaded.length) return;
    var msg={id:Date.now().toString(),type:'file',files:uploaded,caption:caption||'',category:cat.id,timestamp:new Date().toISOString()};
    S.msgs.push(msg); renderMsgs(); scrollBot();
    return saveMsgs().then(function(){ return Promise.all([loadMeta(),loadFiles()]); }).then(function(){ updateStats(); toast(uploaded.length+' \u4E2A\u6587\u4EF6\u5DF2\u4E0A\u4F20','ok'); });
  });
}

// ── 渲染消息 ──────────────────────────────────────────────────
function renderMsgs(){
  var el=document.getElementById('msg-list');
  var vis=S.clearTime?S.msgs.filter(function(m){ return m.timestamp>S.clearTime; }):S.msgs.slice();
  document.getElementById('restore-bar').classList.toggle('on',!!(S.clearTime&&S.msgs.length>0));
  var empty=document.getElementById('empty-chat');
  if(!vis.length){
    el.innerHTML=''; empty.style.display='flex';
    if(S.clearTime&&S.msgs.length>0)
      empty.innerHTML='<div class="emp-ic">\u{1F5C2}\uFE0F</div><div class="emp-t">\u5386\u53F2\u8BB0\u5F55\u5DF2\u6E05\u7A7A</div><div class="emp-s">\u65B0\u53D1\u9001\u7684\u5185\u5BB9\u4F1A\u663E\u793A\u5728\u8FD9\u91CC<br>\u70B9\u51FB\u4E0A\u65B9\u300A\u6062\u590D\u663E\u793A\u300B\u67E5\u770B\u5386\u53F2</div>';
    else
      empty.innerHTML='<div class="emp-ic">\u{1F4AC}</div><div class="emp-t">\u5F00\u59CB\u4F7F\u7528 GitDrive</div><div class="emp-s">\u53D1\u9001\u6587\u5B57\u6216\u4E0A\u4F20\u6587\u4EF6\uFF0C\u4EE5\u804A\u5929\u65B9\u5F0F\u5B58\u5165 GitHub \u4ED3\u5E93</div>';
    return;
  }
  empty.style.display='none';
  var days={};
  vis.forEach(function(m){ var d=new Date(m.timestamp).toLocaleDateString('zh-CN',{year:'numeric',month:'long',day:'numeric'}); if(!days[d]) days[d]=[]; days[d].push(m); });
  el.innerHTML='';
  if(S.clearTime&&S.msgs.length>vis.length){
    var divider=document.createElement('div'); divider.style.cssText='text-align:center;padding:8px 0';
    divider.innerHTML='<span style="font-size:12px;color:var(--t3);background:var(--bg3);border:1px solid var(--b2);border-radius:20px;padding:5px 13px">\u{1F4C2} '+(S.msgs.length-vis.length)+' \u6761\u5386\u53F2\u8BB0\u5F55\u5DF2\u9690\u85CF</span>';
    el.appendChild(divider);
  }
  Object.keys(days).forEach(function(date){
    var ds=document.createElement('div'); ds.className='ds'; ds.textContent=date; el.appendChild(ds);
    days[date].forEach(function(m){ el.appendChild(buildMsgEl(m)); });
  });
  if(S.selMode) el.classList.add('sel-mode'); else el.classList.remove('sel-mode');
  attachMsgTouch(el);
}

function buildMsgEl(m){
  var time=new Date(m.timestamp).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit'});
  var cat=catMap[m.category]||CATS[0];
  var isPinned=S.pinned.indexOf(m.id)>=0;
  var blDiv=document.createElement('div'); blDiv.className='bl out'; blDiv.dataset.id=m.id;
  if(m.type==='text'){
    blDiv.innerHTML=marked.parse(m.content||'');
    var mt=document.createElement('div'); mt.className='mt'; mt.textContent=time; blDiv.appendChild(mt);
  } else {
    var files=m.files||[], imgs=files.filter(function(f){ return isImage(f.name); }), docs=files.filter(function(f){ return !isImage(f.name); });
    blDiv.style.padding='5px';
    var bf=document.createElement('div'); bf.className='bf';
    if(m.caption){ var cap=document.createElement('div'); cap.style.cssText='font-size:13px;margin-bottom:5px;opacity:.9'; cap.textContent=m.caption; bf.appendChild(cap); }
    if(imgs.length){
      var gc='g1'; if(imgs.length===2) gc='g2'; else if(imgs.length===3) gc='g3'; else if(imgs.length>=4) gc='gm';
      var ig=document.createElement('div'); ig.className='ig '+gc;
      imgs.slice(0,4).forEach(function(f,i){
        var ic=document.createElement('div'); ic.className='ic';
        var url=rawUrl(f.path);
        if(i===3&&imgs.length>4){ var ov=document.createElement('div'); ov.className='ic-more'; ov.textContent='+'+(imgs.length-3); ic.appendChild(ov); }
        var img=document.createElement('img'); img.src=url; img.loading='lazy'; img.alt=f.name; ic.appendChild(img);
        var allUrls=imgs.map(function(x){ return rawUrl(x.path); });
        ic.addEventListener('click',function(){ openMP(url,f.name,allUrls,i); }); ig.appendChild(ic);
      }); bf.appendChild(ig);
    }
    docs.forEach(function(f){
      var url=rawUrl(f.path), isMedia=isVid(f.name)||isAud(f.name);
      var fc=document.createElement('div'); fc.className='fc-b';
      var ic=document.createElement('div'); ic.className='fc-ic'; ic.style.background=cat.bg; ic.innerHTML=fileIcon(f.name);
      var info=document.createElement('div'); info.style.cssText='flex:1;overflow:hidden;min-width:0';
      info.innerHTML='<div class="fc-name">'+esc(f.name)+'</div><div class="fc-meta">'+fmtSz(f.size)+' \u00B7 '+cat.icon+' '+cat.label+(isMedia?' \u00B7 \u70B9\u51FB\u64AD\u653E':'')+'</div>';
      fc.appendChild(ic); fc.appendChild(info);
      if(isMedia) fc.addEventListener('click',function(){ openMP(url,f.name,[],0); });
      else fc.addEventListener('click',function(){ dlFile(url,f.name); });
      bf.appendChild(fc);
    });
    var mt=document.createElement('div'); mt.className='mt'; mt.style.cssText='padding:2px 6px 0'; mt.textContent=time; bf.appendChild(mt);
    blDiv.appendChild(bf);
  }
  var maDiv=document.createElement('div'); maDiv.className='ma';
  function mkBtn(icon,label,cls,fn){ var b=document.createElement('button'); b.className='ma-btn'+(cls?' '+cls:''); b.innerHTML='<span class="mi">'+icon+'</span>'+label; b.addEventListener('click',fn); return b; }
  maDiv.appendChild(mkBtn(isPinned?'\u{1F4CC}':'\u{1F4CD}',isPinned?'\u53D6\u6D88\u7F6E\u9876':'\u7F6E\u9876',isPinned?'pin-on':'',function(){ togglePin(m.id); }));
  maDiv.appendChild(mkBtn('\u2193','\u4E0B\u8F7D','',function(){ dlMsg(m.id); }));
  if(m.type==='file') maDiv.appendChild(mkBtn('\u270E','\u91CD\u547D\u540D','',function(){ renMsg(m.id); }));
  else maDiv.appendChild(mkBtn('\u270E','\u7F16\u8F91','',function(){ editMsg(m.id); }));
  maDiv.appendChild(mkBtn('\u2715','\u5220\u9664','del',function(){ delMsg(m.id); }));
  var ck=document.createElement('div'); ck.className='ck'+(S.seled[m.id]?' on':''); ck.textContent='\u2713';
  ck.addEventListener('click',function(){ toggleSeled(m.id); });
  var bw=document.createElement('div'); bw.className='bw'; bw.appendChild(blDiv); bw.appendChild(maDiv);
  var mr=document.createElement('div'); mr.className='mr out'; mr.dataset.id=m.id; mr.appendChild(ck); mr.appendChild(bw);
  var mg=document.createElement('div'); mg.className='mg'; mg.appendChild(mr); return mg;
}

function attachMsgTouch(el){
  el.querySelectorAll('.bw').forEach(function(bw){
    var timer;
    bw.addEventListener('touchstart',function(){ timer=setTimeout(function(){ el.querySelectorAll('.bw.open').forEach(function(b){ if(b!==bw) b.classList.remove('open'); }); bw.classList.toggle('open'); },380); },{passive:true});
    bw.addEventListener('touchend',function(){ clearTimeout(timer); },{passive:true});
    bw.addEventListener('touchmove',function(){ clearTimeout(timer); },{passive:true});
    bw.addEventListener('mouseleave',function(){ bw.classList.remove('open'); });
  });
}
function scrollBot(){ var el=document.getElementById('msg-list'); el.scrollTop=el.scrollHeight; }

// ── 消息操作 ──────────────────────────────────────────────────
function dlMsg(id){ var m=S.msgs.find(function(x){ return x.id===id; }); if(!m) return; if(m.type==='text') dlFile(URL.createObjectURL(new Blob([m.content],{type:'text/plain'})),'msg-'+id+'.txt'); else if(m.files) m.files.forEach(function(f){ dlFile(rawUrl(f.path),f.name); }); }
function editMsg(id){ var m=S.msgs.find(function(x){ return x.id===id; }); if(!m) return; showInput('\u7F16\u8F91\u5185\u5BB9','\u5185\u5BB9',m.content,function(v){ m.content=v; renderMsgs(); saveMsgs(); toast('\u5DF2\u4FDD\u5B58','ok'); }); }
function renMsg(id){
  var m=S.msgs.find(function(x){ return x.id===id; }); if(!m||!m.files||!m.files.length) return;
  var f=m.files.find(function(f){ return !isImage(f.name); });
  if(!f){ toast('\u56FE\u7247\u4E0D\u652F\u6301\u91CD\u547D\u540D','warn'); return; }
  showInput('\u91CD\u547D\u540D','\u65B0\u6587\u4EF6\u540D',f.name,function(newName){
    if(!newName||newName===f.name) return;
    var folder=f.path.includes('/')?f.path.substring(0,f.path.lastIndexOf('/')):''
    var newPath=folder?folder+'/'+newName:newName;
    ghGet(ghPath(f.path)).then(function(r){ if(!r.ok) return; return r.json().then(function(d){
      return ghPut(ghPath(newPath),{message:'Rename [GitDrive]',content:d.content.replace(/\n/g,'')}).then(function(){ return ghDel(ghPath(f.path),d.sha); });
    }); }).then(function(){ f.path=newPath; f.name=newName; return saveMsgs(); }).then(function(){ return loadFiles(); }).then(function(){ updateStats(); renderMsgs(); toast('\u5DF2\u91CD\u547D\u540D\u4E3A '+newName,'ok'); });
  });
}
function delMsg(id){
  var m=S.msgs.find(function(x){ return x.id===id; }); if(!m) return;
  showConfirm('\u5220\u9664\u6D88\u606F','\u786E\u8BA4\u5220\u9664\uFF1F\u6587\u4EF6\u4F1A\u79FB\u81F3\u56DE\u6536\u7AD9\u3002',function(){
    var chain=Promise.resolve();
    if(m.files) m.files.forEach(function(f){ chain=chain.then(function(){ return moveToTrash(f.path,f.name,f.size); }); });
    chain.then(function(){ S.msgs=S.msgs.filter(function(x){ return x.id!==id; }); renderMsgs(); return saveMsgs(); }).then(function(){ return loadFiles(); }).then(function(){ updateStats(); toast('\u5DF2\u5220\u9664','ok'); });
  });
}

// ── 清空/恢复历史 ─────────────────────────────────────────────
function clearChat(){
  showConfirm('\u6E05\u7A7A\u5386\u53F2\u89C6\u56FE','\u4E4B\u524D\u7684\u6D88\u606F\u5C06\u88AB\u9690\u85CF\uFF0C\u65B0\u6D88\u606F\u7167\u5E38\u663E\u793A\u3002\n\u6587\u4EF6\u4ECD\u5B89\u5168\u4FDD\u7559\u5728\u4ED3\u5E93\u4E2D\u3002',function(){
    S.clearTime=new Date().toISOString();
    localStorage.setItem(APP_CONFIG.clearTimePrefix+S.user+'/'+S.repo,S.clearTime);
    renderMsgs(); toast('\u5386\u53F2\u8BB0\u5F55\u5DF2\u9690\u85CF\uFF0C\u65B0\u6D88\u606F\u7167\u5E38\u663E\u793A','ok');
  });
}
function restoreChat(){
  S.clearTime=null; localStorage.removeItem(APP_CONFIG.clearTimePrefix+S.user+'/'+S.repo);
  renderMsgs(); toast('\u5DF2\u6062\u590D\u5168\u90E8\u5386\u53F2\u8BB0\u5F55');
}

// ── 置顶系统 ──────────────────────────────────────────────────
function togglePin(id){
  var idx=S.pinned.indexOf(id); if(idx>=0) S.pinned.splice(idx,1); else S.pinned.push(id);
  localStorage.setItem(APP_CONFIG.pinnedPrefix+S.user+'/'+S.repo,JSON.stringify(S.pinned));
  renderMsgs(); renderPinnedBar();
  toast(S.pinned.indexOf(id)>=0?'\u5DF2\u7F6E\u9876':'\u5DF2\u53D6\u6D88\u7F6E\u9876');
}
function renderPinnedBar(){
  var bar=document.getElementById('pinned-bar'); if(!bar) return;
  bar.innerHTML=''; if(!S.pinned.length) return;
  S.pinned.forEach(function(id){
    var m=S.msgs.find(function(x){ return x.id===id; }); if(!m) return;
    var preview='';
    if(m.type==='text') preview=(m.content||'').replace(/[#*>`_~\[\]]/g,'').slice(0,55).trim();
    else if(m.files&&m.files.length) preview='\u{1F4CE} '+m.files.map(function(f){ return f.name; }).join(', ').slice(0,45);
    var t=new Date(m.timestamp).toLocaleDateString('zh-CN',{month:'short',day:'numeric'});
    var item=document.createElement('div'); item.className='pin-item';
    item.innerHTML='<span class="pin-icon">\u{1F4CC}</span><span class="pin-preview">'+esc(preview)+'</span><span class="pin-date">'+t+'</span><button class="pin-rm">\u00D7</button>';
    item.querySelector('.pin-rm').addEventListener('click',function(e){ e.stopPropagation(); togglePin(id); });
    item.addEventListener('click',function(){ jumpToPin(id); }); bar.appendChild(item);
  });
}
function jumpToPin(id){
  var m=S.msgs.find(function(x){ return x.id===id; }); if(!m) return;
  if(S.clearTime&&m.timestamp<=S.clearTime){ S.clearTime=null; localStorage.removeItem(APP_CONFIG.clearTimePrefix+S.user+'/'+S.repo); renderMsgs(); setTimeout(function(){ scrollToId(id); },300); }
  else scrollToId(id);
}
function scrollToId(id){ var el=document.querySelector('.mr[data-id="'+id+'"]'); if(el){ el.scrollIntoView({behavior:'smooth',block:'center'}); el.style.outline='2px solid var(--ac)'; setTimeout(function(){ el.style.outline=''; },2000); } }

// ── 多选 ──────────────────────────────────────────────────────
function toggleSel(){ S.selMode=!S.selMode; S.seled={}; document.getElementById('sel-bar').classList.toggle('on',S.selMode); if(!S.selMode) renderMsgs(); }
function exitSel(){ S.selMode=false; S.seled={}; document.getElementById('sel-bar').classList.remove('on'); renderMsgs(); }
function toggleSeled(id){ if(S.seled[id]) delete S.seled[id]; else S.seled[id]=true; var ck=document.querySelector('.mr[data-id="'+id+'"] .ck'); if(ck) ck.classList.toggle('on',!!S.seled[id]); document.getElementById('sel-cnt').textContent='\u5DF2\u9009 '+Object.keys(S.seled).length+' \u6761'; }
function dlSelMsgs(){ var n=0; Object.keys(S.seled).forEach(function(id){ var m=S.msgs.find(function(x){ return x.id===id; }); if(!m) return; if(m.type==='text'){ setTimeout(function(){ dlFile(URL.createObjectURL(new Blob([m.content],{type:'text/plain'})),'msg-'+id+'.txt'); },n*200); n++; } else if(m.files) m.files.forEach(function(f){ setTimeout(function(){ dlFile(rawUrl(f.path),f.name); },n*200); n++; }); }); toast('\u5DF2\u89E6\u53D1 '+n+' \u4E2A\u4E0B\u8F7D','ok'); }
function delSelMsgs(){
  var ids=Object.keys(S.seled); if(!ids.length) return;
  showConfirm('\u6279\u91CF\u5220\u9664','\u786E\u8BA4\u5220\u9664\u9009\u4E2D\u7684 '+ids.length+' \u6761\uFF1F',function(){
    var chain=Promise.resolve();
    ids.forEach(function(id){ var m=S.msgs.find(function(x){ return x.id===id; }); if(m&&m.files) m.files.forEach(function(f){ chain=chain.then(function(){ return moveToTrash(f.path,f.name,f.size); }); }); });
    chain.then(function(){ S.msgs=S.msgs.filter(function(x){ return !S.seled[x.id]; }); exitSel(); return saveMsgs(); }).then(function(){ return loadFiles(); }).then(function(){ updateStats(); toast('\u6279\u91CF\u5220\u9664\u5B8C\u6210','ok'); });
  });
}
