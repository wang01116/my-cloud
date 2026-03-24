/**
 * GitDrive — file-ops.js
 * assets/function/file-ops.js
 * ============================================================
 * 单文件操作：收藏、移动、重命名、删除
 * 回收站操作：移入、恢复、永久删除、清空
 *
 * 包含函数：
 *   tgFav(path)              收藏/取消收藏
 *   mvFile(path, name)       移动单文件
 *   rnFile(path, oldName)    重命名文件
 *   delFile(path, sha)       删除文件（移入回收站）
 *   moveToTrash(...)         将文件移入回收站临时目录
 *   restoreFromTrash(idx)    从回收站恢复
 *   hardDelTrash(idx)        永久删除
 *   emptyTrash()             清空回收站
 *
 * 依赖：
 *   S, catMap（app-state.js）
 *   CATS（config.js）
 *   ghGet, ghPut, ghDel, ghPath（core-utils.js）
 *   toast, showConfirm, showInput, showMd, closeMd（ui-components.js）
 *   saveMsgs, saveMeta, saveTrash, loadFiles, updateStats（data-sync.js）
 *   renderMsgs（chat-messages.js）
 *   renderFG（file-grid.js）
 *   renderTrash（trash-stats.js）
 *   doBatchMv（file-grid.js）
 * ============================================================
 */

function tgFav(path){
  var i=S.meta.favorites.indexOf(path);
  if(i>=0) S.meta.favorites.splice(i,1); else S.meta.favorites.push(path);
  saveMeta().then(function(){
    renderFG();
    document.getElementById('fav-cnt').textContent=S.meta.favorites.length||'';
    toast(S.meta.favorites.indexOf(path)>=0?'\u5DF2\u6536\u85CF':'\u5DF2\u53D6\u6D88\u6536\u85CF');
  });
}

function mvFile(path,name){
  window._mvPaths=[path]; window._mvCat=CATS[0].id;
  var html='<div class="md-t">\u79FB\u52A8\u5230\u5206\u7C7B</div><div class="cmg">'+CATS.map(function(c,i){ return '<div class="cm-it'+(i===0?' on':'')+ '" data-cid="'+c.id+'"><span>'+c.icon+'</span>'+c.label+'</div>'; }).join('')+'</div><div class="md-btns"><button class="btn-g" id="mv-cancel">\u53D6\u6D88</button><button class="btn-a" id="mv-ok">\u79FB\u52A8</button></div>';
  showMd(html);
  document.querySelectorAll('.cm-it').forEach(function(el){ el.addEventListener('click',function(){ window._mvCat=this.dataset.cid; document.querySelectorAll('.cm-it').forEach(function(x){ x.classList.remove('on'); }); this.classList.add('on'); }); });
  document.getElementById('mv-cancel').addEventListener('click',closeMd);
  document.getElementById('mv-ok').addEventListener('click',doBatchMv);
}

function rnFile(path,oldName){
  if(isImage(oldName)){ toast('\u56FE\u7247\u4E0D\u652F\u6301\u91CD\u547D\u540D','warn'); return; }
  showInput('\u91CD\u547D\u540D','\u65B0\u6587\u4EF6\u540D',oldName,function(newName){
    if(!newName||newName===oldName) return;
    var folder=path.includes('/')?path.substring(0,path.lastIndexOf('/')):''
    var newPath=folder?folder+'/'+newName:newName;
    ghGet(ghPath(path)).then(function(r){ if(!r.ok) return; return r.json().then(function(d){
      return ghPut(ghPath(newPath),{message:'Rename [GitDrive]',content:d.content.replace(/\n/g,'')}).then(function(){ return ghDel(ghPath(path),d.sha); });
    }); }).then(function(){
      var fi=S.meta.favorites.indexOf(path); if(fi>=0){ S.meta.favorites.splice(fi,1); S.meta.favorites.push(newPath); }
      S.msgs.forEach(function(m){ if(m.files) m.files.forEach(function(f){ if(f.path===path){ f.path=newPath; f.name=newName; } }); });
      return Promise.all([saveMsgs(),saveMeta()]);
    }).then(function(){ return loadFiles(); }).then(function(){ updateStats(); renderMsgs(); toast('\u5DF2\u91CD\u547D\u540D\u4E3A '+newName,'ok'); });
  });
}

function delFile(path,sha){
  var name=path.split('/').pop();
  showConfirm('\u79FB\u81F3\u56DE\u6536\u7AD9','\u5C06 '+name+' \u79FB\u81F3\u56DE\u6536\u7AD9\uFF1F',function(){
    var f=S.files.find(function(x){ return x.path===path; });
    moveToTrash(path,name,f&&f.size||0).then(function(){
      S.meta.favorites=S.meta.favorites.filter(function(x){ return x!==path; });
      S.msgs=S.msgs.map(function(m){ if(m.files) m.files=m.files.filter(function(f){ return f.path!==path; }); return m; }).filter(function(m){ return m.type==='text'||(m.files&&m.files.length>0); });
      return Promise.all([saveMsgs(),saveMeta()]);
    }).then(function(){ return loadFiles(); }).then(function(){ updateStats(); renderMsgs(); toast('\u5DF2\u79FB\u81F3\u56DE\u6536\u7AD9','ok'); });
  });
}

// ── 回收站操作 ────────────────────────────────────────────────
function moveToTrash(origPath,name,size){
  var trashPath='gitdrive-trash-files/'+Date.now()+'_'+name;
  return ghGet(ghPath(origPath)).then(function(r){ if(!r.ok) return; return r.json().then(function(d){
    return ghPut(ghPath(trashPath),{message:'Trash [GitDrive]',content:d.content.replace(/\n/g,'')}).then(function(){ return ghDel(ghPath(origPath),d.sha); }).then(function(){
      S.trash.push({origPath:origPath,trashPath:trashPath,name:name,deletedAt:new Date().toISOString(),size:size||0,category:origPath.split('/')[0]});
      return saveTrash();
    });
  }); }).catch(function(e){ toast('\u56DE\u6536\u7AD9\u64CD\u4F5C\u5931\u8D25: '+e.message,'err'); });
}

function restoreFromTrash(idx){
  var item=S.trash[idx]; if(!item) return;
  var cat=catMap[item.category]||CATS[0], dest=cat.id+'/'+item.name;
  ghGet(ghPath(item.trashPath)).then(function(r){ if(!r.ok) throw new Error('\u6587\u4EF6\u4E0D\u5B58\u5728'); return r.json(); })
    .then(function(d){ return ghPut(ghPath(dest),{message:'Restore [GitDrive]',content:d.content.replace(/\n/g,'')}).then(function(){ return ghDel(ghPath(item.trashPath),d.sha); }); })
    .then(function(){ S.trash.splice(idx,1); return saveTrash(); })
    .then(function(){ return loadFiles(); })
    .then(function(){ updateStats(); renderTrash(); toast('\u5DF2\u6062\u590D\u5230 '+cat.label,'ok'); })
    .catch(function(e){ toast('\u6062\u590D\u5931\u8D25: '+e.message,'err'); });
}

function hardDelTrash(idx){
  var item=S.trash[idx]; if(!item) return;
  showConfirm('\u6C38\u4E45\u5220\u9664','\u6C38\u4E45\u5220\u9664 '+item.name+'\uFF1F\u6B64\u64CD\u4F5C\u4E0D\u53EF\u64A4\u9500\u3002',function(){
    ghGet(ghPath(item.trashPath)).then(function(r){ if(r.ok) return r.json().then(function(d){ return ghDel(ghPath(item.trashPath),d.sha); }); })
      .then(function(){ S.trash.splice(idx,1); return saveTrash(); })
      .then(function(){ renderTrash(); toast('\u5DF2\u6C38\u4E45\u5220\u9664'); }).catch(function(){});
  });
}

function emptyTrash(){
  if(!S.trash.length){ toast('\u56DE\u6536\u7AD9\u4E3A\u7A7A'); return; }
  showConfirm('\u6E05\u7A7A\u56DE\u6536\u7AD9','\u6C38\u4E45\u5220\u9664\u5168\u90E8 '+S.trash.length+' \u4E2A\u6587\u4EF6\uFF1F',function(){
    var chain=Promise.resolve();
    S.trash.forEach(function(item){ chain=chain.then(function(){
      return ghGet(ghPath(item.trashPath)).then(function(r){ if(r.ok) return r.json().then(function(d){ return ghDel(ghPath(item.trashPath),d.sha); }); }).catch(function(){});
    }); });
    chain.then(function(){ S.trash=[]; return saveTrash(); }).then(function(){ renderTrash(); toast('\u56DE\u6536\u7AD9\u5DF2\u6E05\u7A7A','ok'); });
  });
}
