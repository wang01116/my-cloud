/**
 * GitDrive — data-sync.js
 * assets/function/data-sync.js
 * ============================================================
 * 数据加载与保存（GitHub 仓库 ↔ 本地状态同步）
 *
 * 负责所有 JSON 数据文件的读写：
 *   loadAll()       启动时并行加载全部数据
 *   loadMsgs()      加载消息
 *   loadMeta()      加载收藏/归档元数据
 *   loadFiles()     遍历分类文件夹加载文件列表
 *   loadMemos()     加载备忘录
 *   saveMsgs()      保存消息
 *   saveMeta()      保存元数据
 *   saveTrash()     保存回收站记录
 *   saveMemos()     保存备忘录
 *   updateStats()   更新界面统计数字并刷新文件网格
 *   refresh()       全量刷新
 *   syncFiles()     仅同步文件列表
 *
 * 依赖：
 *   S, catMap（app-state.js）
 *   CATS, PATHS, APP_CONFIG（config.js）
 *   ghGet, ghPut, ghPath, fromB64, toB64, fmtSz（core-utils.js）
 *   toast（ui-components.js）
 *   renderMsgs, renderPinnedBar（chat-messages.js）
 *   renderFG（file-grid.js）
 * ============================================================
 */

function loadAll(){
  document.getElementById('hd-s').textContent='加载中\u2026';
  return Promise.all([loadMsgs(), loadMeta(), loadFiles(), loadMemos()])
    .then(function(){ updateStats(); })
    .catch(function(e){ document.getElementById('hd-s').textContent='加载失败'; toast('加载失败: '+e.message,'err'); });
}

function loadMsgs(){
  return ghGet(ghPath(PATHS.messages))
    .then(function(r){
      if(r.ok) return r.json().then(function(d){ S.msgs=JSON.parse(fromB64(d.content)); S.msgSha=d.sha; });
      else { S.msgs=[]; S.msgSha=null; }
    }).then(function(){ renderMsgs(); renderPinnedBar(); });
}

function loadMeta(){
  return ghGet(ghPath(PATHS.meta))
    .then(function(r){
      if(r.ok) return r.json().then(function(d){ S.meta=JSON.parse(fromB64(d.content)); S.metaSha=d.sha; });
      else { S.meta={favorites:[],archived:[]}; S.metaSha=null; }
    }).then(function(){
      document.getElementById('fav-cnt').textContent=S.meta.favorites.length||'';
    });
}

function loadFiles(){
  S.files=[];
  var proms=CATS.map(function(cat){
    return ghGet(cat.id).then(function(r){
      if(r.ok) return r.json().then(function(items){
        if(Array.isArray(items)) items.forEach(function(f){
          if(f.type==='file') S.files.push(Object.assign({},f,{category:cat.id}));
        });
      });
    }).catch(function(){});
  });
  return Promise.all(proms).then(function(){
    // 清理消息中指向已删除文件的引用
    var paths={};
    S.files.forEach(function(f){ paths[f.path]=true; });
    var changed=false;
    S.msgs=S.msgs.map(function(m){
      if(m.type!=='file') return m;
      var before=m.files.length;
      m.files=m.files.filter(function(f){ return paths[f.path]; });
      if(m.files.length<before) changed=true;
      return m;
    }).filter(function(m){ return m.type==='text'||(m.files&&m.files.length>0); });
    if(changed) return saveMsgs();
  }).then(function(){
    return ghGet(ghPath(PATHS.trash)).then(function(r){
      if(r.ok) return r.json().then(function(d){ S.trash=JSON.parse(fromB64(d.content)); S.trashSha=d.sha; });
      else { S.trash=[]; S.trashSha=null; }
    });
  }).then(function(){
    // 清理超期回收站记录
    var now=Date.now(), cutoff=APP_CONFIG.trashDays*24*3600*1000;
    var before=S.trash.length;
    S.trash=S.trash.filter(function(t){ return (now-new Date(t.deletedAt).getTime())<cutoff; });
    if(S.trash.length<before) return saveTrash();
  }).then(function(){
    document.getElementById('trash-cnt').textContent=S.trash.length||'';
  });
}

function loadMemos(){
  return ghGet(ghPath(PATHS.memos))
    .then(function(r){
      if(r.ok) return r.json().then(function(d){ S.memos=JSON.parse(fromB64(d.content)); S.memoSha=d.sha; });
      else { S.memos=[]; S.memoSha=null; }
    });
}

// ── 保存 ─────────────────────────────────────────────────────
function saveMsgs(){
  var body={message:'Update messages [GitDrive]',content:toB64(JSON.stringify(S.msgs,null,2))};
  if(S.msgSha) body.sha=S.msgSha;
  return ghPut(ghPath(PATHS.messages),body).then(function(r){
    if(r.ok) return r.json().then(function(d){ S.msgSha=d.content.sha; });
    else return r.json().then(function(e){ toast('保存失败: '+(e.message||r.status),'err'); });
  });
}

function saveMeta(){
  var body={message:'Update meta [GitDrive]',content:toB64(JSON.stringify(S.meta))};
  if(S.metaSha) body.sha=S.metaSha;
  return ghPut(ghPath(PATHS.meta),body).then(function(r){
    if(r.ok) return r.json().then(function(d){ S.metaSha=d.content.sha; });
  });
}

function saveTrash(){
  var body={message:'Update trash [GitDrive]',content:toB64(JSON.stringify(S.trash))};
  if(S.trashSha) body.sha=S.trashSha;
  return ghPut(ghPath(PATHS.trash),body).then(function(r){
    if(r.ok) return r.json().then(function(d){ S.trashSha=d.content.sha; });
  }).then(function(){
    document.getElementById('trash-cnt').textContent=S.trash.length||'';
  });
}

function saveMemos(){
  var body={message:'Update memos [GitDrive]',content:toB64(JSON.stringify(S.memos,null,2))};
  if(S.memoSha) body.sha=S.memoSha;
  return ghPut(ghPath(PATHS.memos),body).then(function(r){
    if(r.ok) return r.json().then(function(d){ S.memoSha=d.content.sha; });
  });
}

// ── 统计更新 ──────────────────────────────────────────────────
function updateStats(){
  var cnt=S.files.length;
  var sz=S.files.reduce(function(a,f){ return a+(f.size||0); },0);
  document.getElementById('fcnt').textContent=cnt;
  var label=cnt+' 个文件 \u00B7 '+fmtSz(sz);
  document.getElementById('hd-s').textContent=label;
  document.getElementById('sb-stat').textContent=label;
  renderFG();
}

function refresh(){
  toast('刷新中\u2026');
  loadAll().then(function(){ toast('已刷新','ok'); });
}

function syncFiles(){
  toast('同步中\u2026');
  Promise.all([loadMeta(),loadFiles()]).then(function(){ updateStats(); toast('同步完成','ok'); });
}
