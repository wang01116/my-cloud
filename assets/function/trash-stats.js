/**
 * GitDrive — trash-stats.js
 * assets/function/trash-stats.js
 * ============================================================
 * 回收站列表渲染 & 统计页面渲染
 *
 * 包含函数：
 *   renderTrash()   渲染回收站列表
 *   renderStats()   渲染存储统计页（总量/分类/类型）
 *
 * 依赖：
 *   S, catMap（app-state.js）
 *   CATS, TYPE_GROUPS, APP_CONFIG（config.js）
 *   fileIcon, fmtSz, esc, xExt（core-utils.js）
 *   restoreFromTrash, hardDelTrash（file-ops.js）
 * ============================================================
 */

function renderTrash(){
  var el=document.getElementById('trash-list'); if(!el) return;
  if(!S.trash.length){
    el.innerHTML='<div class="emp"><div class="emp-ic">\u{1F5D1}\uFE0F</div><div class="emp-t">\u56DE\u6536\u7AD9\u4E3A\u7A7A</div><div class="emp-s">\u5220\u9664\u7684\u6587\u4EF6\u4F1A\u4FDD\u7559 '+APP_CONFIG.trashDays+' \u5929\u540E\u6C38\u4E45\u6E05\u9664</div></div>';
    return;
  }
  var now=Date.now(); el.innerHTML='';
  S.trash.forEach(function(item,i){
    var elapsed=now-new Date(item.deletedAt).getTime();
    var remain=Math.ceil((APP_CONFIG.trashDays*24*3600*1000-elapsed)/(24*3600*1000));
    var cat=catMap[item.category]||CATS[0];
    var col=remain<=3?'var(--rd)':remain<=7?'var(--or)':'var(--t3)';
    var d=document.createElement('div');
    d.style.cssText='background:var(--bg2);border:1px solid var(--b2);border-radius:12px;padding:12px 13px;display:flex;align-items:center;gap:11px';
    d.innerHTML='<div style="width:38px;height:38px;border-radius:9px;background:'+cat.bg+';display:flex;align-items:center;justify-content:center;font-size:18px;flex-shrink:0">'+fileIcon(item.name)+'</div>'
      +'<div style="flex:1;min-width:0">'
        +'<div style="font-size:13px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">'+esc(item.name)+'</div>'
        +'<div style="font-size:11px;color:var(--t2);margin-top:2px">'+cat.icon+' '+cat.label+' \u00B7 '+fmtSz(item.size)+'</div>'
        +'<div style="font-size:11px;margin-top:1px;color:'+col+'">\u23F3 \u5269\u4F59 '+remain+' \u5929</div>'
      +'</div>'
      +'<div style="display:flex;flex-direction:column;gap:5px;flex-shrink:0">'
        +'<button data-restore="'+i+'" style="padding:5px 11px;background:var(--gl);border:1px solid var(--ac);border-radius:7px;color:var(--ac2);font-family:inherit;font-size:12px;font-weight:600;white-space:nowrap;cursor:pointer">\u21A9 \u6062\u590D</button>'
        +'<button data-hd="'+i+'" style="padding:5px 11px;background:rgba(248,81,73,.1);border:1px solid rgba(248,81,73,.3);border-radius:7px;color:var(--rd);font-family:inherit;font-size:12px;font-weight:600;white-space:nowrap;cursor:pointer">\u2715 \u6C38\u4E45\u5220\u9664</button>'
      +'</div>';
    el.appendChild(d);
  });
  el.querySelectorAll('[data-restore]').forEach(function(b){ b.addEventListener('click',function(){ restoreFromTrash(parseInt(this.dataset.restore)); }); });
  el.querySelectorAll('[data-hd]').forEach(function(b){ b.addEventListener('click',function(){ hardDelTrash(parseInt(this.dataset.hd)); }); });
}

function renderStats(){
  var panel=document.getElementById('stats-panel'); if(!panel) return;
  var total=S.files.reduce(function(a,f){ return a+(f.size||0); },0), cnt=S.files.length;
  var byCat={};
  CATS.forEach(function(c){ byCat[c.id]={cnt:0,sz:0,cat:c}; });
  S.files.forEach(function(f){ var k=f.category||'other'; if(!byCat[k]) byCat[k]={cnt:0,sz:0,cat:catMap[k]||CATS[0]}; byCat[k].cnt++; byCat[k].sz+=(f.size||0); });
  var byType={};
  TYPE_GROUPS.slice(1).forEach(function(g){ byType[g.id]={cnt:0,sz:0,label:g.label}; });
  S.files.forEach(function(f){ var e=xExt(f.name); for(var j=1;j<TYPE_GROUPS.length;j++){ if(TYPE_GROUPS[j].exts.indexOf(e)>=0){ byType[TYPE_GROUPS[j].id].cnt++; byType[TYPE_GROUPS[j].id].sz+=(f.size||0); break; } } });
  function pct(s){ return total?Math.round(s/total*100):0; }
  function barH(s,color){ return '<div class="stat-bar"><div class="stat-fill" style="width:'+pct(s)+'%;background:'+color+'"></div></div>'; }
  var cr=Object.values(byCat).filter(function(x){ return x.cnt>0; }).sort(function(a,b){ return b.sz-a.sz; }).map(function(x){ return '<div class="stat-row"><div class="stat-row-hd"><span class="stat-row-label">'+x.cat.icon+' '+x.cat.label+'</span><span class="stat-row-val">'+x.cnt+' \u4E2A \u00B7 '+fmtSz(x.sz)+'</span></div>'+barH(x.sz,x.cat.color)+'</div>'; }).join('');
  var tr=Object.entries(byType).filter(function(kv){ return kv[1].cnt>0; }).sort(function(a,b){ return b[1].sz-a[1].sz; }).map(function(kv){ return '<div class="stat-row"><div class="stat-row-hd"><span class="stat-row-label">'+kv[1].label+'</span><span class="stat-row-val">'+kv[1].cnt+' \u4E2A \u00B7 '+fmtSz(kv[1].sz)+'</span></div>'+barH(kv[1].sz,'var(--ac)')+'</div>'; }).join('');
  panel.innerHTML='<div class="stat-hero"><div class="stat-sz">'+fmtSz(total)+'</div><div class="stat-sub">'+cnt+' \u4E2A\u6587\u4EF6 \u00B7 '+S.trash.length+' \u4E2A\u5728\u56DE\u6536\u7AD9</div></div><div class="stat-sec"><div class="stat-sec-t">\u6309\u5206\u7C7B</div>'+cr+'</div><div class="stat-sec"><div class="stat-sec-t">\u6309\u7C7B\u578B</div>'+tr+'</div>';
}
