/**
 * GitDrive — search.js
 * assets/function/search.js
 * ============================================================
 * 全局搜索（文件名 + 消息内容）
 *
 * 包含函数：
 *   openSearch()   打开搜索浮层
 *   closeSearch()  关闭搜索浮层
 *   doSearch()     执行搜索并渲染结果
 *
 * 搜索范围：
 *   1. 所有文件名（S.files）
 *   2. 文字消息内容（S.msgs type=text）
 *
 * 如需扩展搜索范围（例如备忘录内容），
 * 在 doSearch() 的 matches 构建部分追加逻辑即可。
 *
 * 依赖：
 *   S, catMap（app-state.js）
 *   rawUrl, fileIcon, fmtSz, esc, dlFile（core-utils.js）
 *   scrollToId（chat-messages.js）
 * ============================================================
 */

function openSearch(){
  document.getElementById('search-ov').classList.add('on');
  setTimeout(function(){ document.getElementById('g-q').focus(); },80);
}
function closeSearch(){ document.getElementById('search-ov').classList.remove('on'); }

function doSearch(){
  var q=document.getElementById('g-q').value.trim().toLowerCase();
  var res=document.getElementById('g-res');
  if(!q){ res.innerHTML='<div class="sr-empty">\u8F93\u5165\u5173\u952E\u8BCD\u5F00\u59CB\u641C\u7D22</div>'; return; }
  var matches=[];
  S.files.forEach(function(f){ if(f.name.toLowerCase().indexOf(q)>=0) matches.push({t:'file',f:f}); });
  S.msgs.filter(function(m){ return m.type==='text'; }).forEach(function(m){ if((m.content||'').toLowerCase().indexOf(q)>=0) matches.push({t:'msg',m:m}); });
  if(!matches.length){ res.innerHTML='<div class="sr-empty">\u6CA1\u6709\u627E\u5230\u5339\u914D\u7ED3\u679C</div>'; return; }
  function hi(s){ return s.replace(new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&'),'gi'),function(m){ return '<span class="hl">'+m+'</span>'; }); }
  res.innerHTML='';
  matches.slice(0,20).forEach(function(item){
    var d=document.createElement('div'); d.className='sri';
    if(item.t==='file'){
      var f=item.f, cat=catMap[f.category]||CATS[0];
      d.innerHTML='<div class="sri-ic" style="background:'+cat.bg+'">'+fileIcon(f.name)+'</div><div class="sri-info"><div class="sri-name">'+hi(esc(f.name))+'</div><div class="sri-meta">'+cat.icon+' '+cat.label+' \u00B7 '+fmtSz(f.size)+'</div></div>';
      d.addEventListener('click',function(){ closeSearch(); dlFile(rawUrl(f.path),f.name); });
    } else {
      var m=item.m;
      d.innerHTML='<div class="sri-ic" style="background:var(--bg3)">\u{1F4AC}</div><div class="sri-info"><div class="sri-name">'+hi(esc((m.content||'').slice(0,70)))+'</div><div class="sri-meta">\u6587\u5B57\u6D88\u606F \u00B7 '+new Date(m.timestamp).toLocaleDateString('zh-CN')+'</div></div>';
      d.addEventListener('click',function(){ closeSearch(); scrollToId(m.id); });
    }
    res.appendChild(d);
  });
}
