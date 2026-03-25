/**
 * GitDrive — app-ui-builder.js
 * assets/function/app-ui-builder.js
 * ============================================================
 * UI 初始化构建：侧边栏分类导航、上传 chips、文件筛选栏
 *
 * 包含函数：
 *   buildUI()   登录成功后调用一次，动态填充所有由 CATS 驱动的 UI
 *   selCat(id)  切换当前上传分类
 *
 * 设计说明：
 *   所有通过 CATS 配置驱动的列表都在这里一次性生成。
 *   新增/删除分类时只需修改 config.js 中的 CATS，
 *   无需改动本文件或 HTML。
 *
 * 依赖：
 *   S, catMap（app-state.js）
 *   CATS, TYPE_GROUPS（config.js）
 *   setFCat, setFType（file-grid.js）
 *   showCatFiles（chat-messages.js）
 * ============================================================
 */

function buildUI(){
  // 侧边栏分类导航
  var n='';
  CATS.forEach(function(c){ n+='<button class="ni" data-cid="'+c.id+'"><span class="ico">'+c.icon+'</span>'+c.label+'</button>'; });
  document.getElementById('cat-nav').innerHTML=n;
  document.querySelectorAll('#cat-nav .ni').forEach(function(b){ b.addEventListener('click',function(){ showCatFiles(this.dataset.cid); }); });

  // 上传分类 chips
  var chips='';
  CATS.forEach(function(c){ chips+='<button class="cc'+(c.id===S.cur?' on':'')+'" data-cid="'+c.id+'">'+c.icon+' '+c.label+'</button>'; });
  document.getElementById('cat-chips').innerHTML=chips;
  document.querySelectorAll('#cat-chips .cc').forEach(function(b){ b.addEventListener('click',function(){ selCat(this.dataset.cid); }); });

  // 文件网格分类筛选栏
  var cf='<button class="fc2 on" data-fcat="all">\u5168\u90E8</button>'
       +'<button class="fc2" data-fcat="fav">\u2605 \u6536\u85CF</button>'
       +'<span class="fc2-sep"></span>';
  CATS.forEach(function(c){ cf+='<button class="fc2" data-fcat="'+c.id+'">'+c.icon+' '+c.label+'</button>'; });
  document.getElementById('fg-cats').innerHTML=cf;
  document.querySelectorAll('#fg-cats .fc2').forEach(function(b){ b.addEventListener('click',function(){ setFCat(this.dataset.fcat); }); });

  // 文件类型筛选栏
  var tf='';
  TYPE_GROUPS.forEach(function(g,i){ tf+='<button class="fc2'+(i===0?' on':'')+'" data-ftype="'+g.id+'">'+g.label+'</button>'; });
  document.getElementById('fg-types').innerHTML=tf;
  document.querySelectorAll('#fg-types .fc2').forEach(function(b){ b.addEventListener('click',function(){ setFType(this.dataset.ftype); }); });
}

function selCat(id){
  S.cur=id;
  document.querySelectorAll('#cat-chips .cc').forEach(function(b){ b.classList.toggle('on',b.dataset.cid===id); });
}

// 侧边栏作者名（从 config.js 读取）
document.addEventListener('DOMContentLoaded',function(){ var el=document.getElementById('sb-author'); if(el) el.textContent=APP_CONFIG.author; });
