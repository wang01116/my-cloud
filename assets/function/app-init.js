/**
 * GitDrive — app-init.js
 * assets/function/app-init.js
 * ============================================================
 * 应用初始化入口：登录、launchApp、全部 DOM 事件绑定
 *
 * 本文件是整个应用的启动入口，也是事件绑定的唯一集中位置。
 *
 * ── 脚本加载顺序（index.html 末尾 <script> 标签顺序）─────────
 *   1. config.js               用户配置（CATS/PATHS/APP_CONFIG 等）
 *   2. core-utils.js           API 工具函数
 *   3. app-state.js            全局状态 S
 *   4. data-sync.js            数据加载/保存
 *   5. ui-components.js        Toast/Modal/主题/媒体预览
 *   6. trash-stats.js          回收站渲染（被 file-ops 依赖）
 *   7. file-ops.js             文件操作（被 file-grid/chat 依赖）
 *   8. file-grid.js            文件网格
 *   9. chat-messages.js        对话消息
 *  10. memo.js                 备忘录
 *  11. search.js               搜索
 *  12. app-ui-builder.js       UI 初始化构建
 *  13. app-init.js             本文件（最后加载）
 *
 * ── 如何新增功能模块 ──────────────────────────────────────────
 *   1. 在 assets/function/ 中新建 .js 文件
 *   2. 在 index.html 中按顺序引入（在 app-init.js 之前）
 *   3. 在本文件 DOMContentLoaded 回调中绑定新功能的按钮事件
 *   4. 如需新的全局状态字段，在 app-state.js 的 S 对象中声明
 *   5. 如需新的配置参数，在 config.js 的 APP_CONFIG 中添加
 * ============================================================
 */

// ── 登录 ─────────────────────────────────────────────────────
function doLogin(){
  var u=document.getElementById('lu').value.trim();
  var r=document.getElementById('lr').value.trim();
  var t=document.getElementById('lt').value.trim();
  var err=document.getElementById('lerr');
  if(!u||!r||!t){ err.textContent='\u8BF7\u586B\u5199\u6240\u6709\u5B57\u6BB5'; err.style.display='block'; return; }
  err.style.display='none';
  var btn=document.getElementById('lbtn');
  btn.textContent='\u8FDE\u63A5\u4E2D\u2026'; btn.disabled=true;
  fetch('https://api.github.com/repos/'+u+'/'+r,{
    headers:{'Authorization':'Bearer '+t,'Accept':'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'}
  }).then(function(res){
    if(res.status===401) throw new Error('Token \u65E0\u6548\u6216\u5DF2\u8FC7\u671F');
    if(res.status===403) throw new Error('\u6743\u9650\u4E0D\u8DB3\uFF0C\u8BF7\u5F00\u542F Contents \u8BFB\u5199\u6743\u9650');
    if(res.status===404) throw new Error('\u4ED3\u5E93\u4E0D\u5B58\u5728\uFF0C\u8BF7\u68C0\u67E5\u7528\u6237\u540D\u548C\u4ED3\u5E93\u540D');
    if(!res.ok) throw new Error('\u8FDE\u63A5\u5931\u8D25\uFF08HTTP '+res.status+'\uFF09');
    S.user=u; S.repo=r; S.token=t;
    localStorage.setItem(APP_CONFIG.credKey,JSON.stringify({user:u,repo:r,token:t}));
    launchApp();
  }).catch(function(e){
    err.textContent=e.message; err.style.display='block';
  }).finally(function(){
    btn.textContent='\u8FDE\u63A5\u4ED3\u5E93'; btn.disabled=false;
  });
}

function doLogout(){
  if(!confirm('\u786E\u5B9A\u9000\u51FA\uFF1F')) return;
  localStorage.removeItem(APP_CONFIG.credKey); location.reload();
}

// ── 启动应用 ──────────────────────────────────────────────────
function launchApp(){
  document.getElementById('login-screen').style.display='none';
  document.getElementById('app').style.display='flex';
  document.getElementById('sb-repo').textContent=S.user+'/'+S.repo;
  document.getElementById('hd-t').textContent=S.repo;
  // 恢复本地状态
  S.clearTime=localStorage.getItem(APP_CONFIG.clearTimePrefix+S.user+'/'+S.repo)||null;
  try{ S.pinned=JSON.parse(localStorage.getItem(APP_CONFIG.pinnedPrefix+S.user+'/'+S.repo)||'[]'); }catch(e){ S.pinned=[]; }
  initCatMap(); // 初始化 catMap 和 S.cur
  buildUI();
  loadAll();
}

// ── 全部事件绑定 ──────────────────────────────────────────────
document.addEventListener('DOMContentLoaded',function(){

  // 登录
  document.getElementById('lbtn').addEventListener('click',doLogin);
  ['lu','lr'].forEach(function(id){ document.getElementById(id).addEventListener('keydown',function(e){ if(e.key==='Enter'){ var nx={lu:'lr',lr:'lt'}; document.getElementById(nx[id]).focus(); } }); });
  document.getElementById('lt').addEventListener('keydown',function(e){ if(e.key==='Enter') doLogin(); });

  // 侧边栏
  document.getElementById('btn-search-sb').addEventListener('click',openSearch);
  document.getElementById('sb-search-box').addEventListener('click',openSearch);
  document.getElementById('btn-theme').addEventListener('click',toggleTheme);
  document.getElementById('btn-logout').addEventListener('click',doLogout);
  document.getElementById('sb-ov').addEventListener('click',closeSb);

  // 主导航
  document.getElementById('n-chat').addEventListener('click',function(){ showScr('chat'); });
  document.getElementById('n-files').addEventListener('click',function(){ showScr('files'); });
  document.getElementById('n-fav').addEventListener('click',showFav);
  document.getElementById('n-memo').addEventListener('click',function(){ showScr('memo'); });
  document.getElementById('n-trash').addEventListener('click',function(){ showScr('trash'); });
  document.getElementById('n-stats').addEventListener('click',function(){ showScr('stats'); });

  // 对话顶栏
  document.getElementById('btn-menu').addEventListener('click',openSb);
  document.getElementById('btn-help').addEventListener('click',showHelp);
  document.getElementById('btn-chat-search').addEventListener('click',openSearch);
  document.getElementById('btn-sel-toggle').addEventListener('click',toggleSel);
  document.getElementById('btn-clear').addEventListener('click',clearChat);
  document.getElementById('btn-refresh').addEventListener('click',refresh);

  // 操作栏
  document.getElementById('btn-restore').addEventListener('click',restoreChat);
  document.getElementById('btn-dl-sel').addEventListener('click',dlSelMsgs);
  document.getElementById('btn-exit-sel').addEventListener('click',exitSel);
  document.getElementById('btn-del-sel').addEventListener('click',delSelMsgs);

  // 消息输入
  document.getElementById('btn-att').addEventListener('click',function(){ document.getElementById('fi').click(); });
  document.getElementById('fi').addEventListener('change',function(){ addPend(this.files); this.value=''; });
  document.getElementById('btn-snd').addEventListener('click',sendAll);
  document.getElementById('ti').addEventListener('input',function(){ arTA(this); });
  document.getElementById('ti').addEventListener('keydown',function(e){ if(e.key==='Enter'&&!e.shiftKey){ e.preventDefault(); sendAll(); } });

  // 文件列表页
  document.getElementById('btn-files-menu').addEventListener('click',openSb);
  document.getElementById('btn-fg-sel').addEventListener('click',toggleFGSel);
  document.getElementById('btn-sync').addEventListener('click',syncFiles);
  document.getElementById('vb-g').addEventListener('click',function(){ setView('grid'); });
  document.getElementById('vb-l').addEventListener('click',function(){ setView('list'); });
  document.getElementById('fg-q').addEventListener('input',renderFG);
  document.getElementById('btn-fgq-clear').addEventListener('click',function(){ document.getElementById('fg-q').value=''; renderFG(); });
  document.getElementById('sort-sel').addEventListener('change',renderFG);
  document.getElementById('btn-mv-sel').addEventListener('click',moveSel);
  document.getElementById('btn-dl-fgsel').addEventListener('click',dlSel);
  document.getElementById('btn-del-fgsel').addEventListener('click',delSel);

  // 回收站 & 统计
  document.getElementById('btn-trash-menu').addEventListener('click',openSb);
  document.getElementById('btn-empty-trash').addEventListener('click',emptyTrash);
  document.getElementById('btn-stats-menu').addEventListener('click',openSb);

  // 备忘录
  document.getElementById('btn-memo-menu').addEventListener('click',openSb);
  document.getElementById('mbtn-todo').addEventListener('click',function(){ setMemoType('todo'); });
  document.getElementById('mbtn-note').addEventListener('click',function(){ setMemoType('note'); });
  document.getElementById('btn-memo-snd').addEventListener('click',addMemo);
  document.getElementById('memo-inp').addEventListener('input',function(){ arTA(this); });
  document.getElementById('memo-inp').addEventListener('keydown',function(e){ if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){ e.preventDefault(); addMemo(); } });
  document.getElementById('mf-all').addEventListener('click',function(){ setMemoFilter('all'); });
  document.getElementById('mf-todo').addEventListener('click',function(){ setMemoFilter('todo'); });
  document.getElementById('mf-note').addEventListener('click',function(){ setMemoFilter('note'); });
  document.getElementById('mf-done').addEventListener('click',function(){ setMemoFilter('done'); });

  // 搜索
  document.getElementById('g-q').addEventListener('input',doSearch);
  document.getElementById('btn-search-close').addEventListener('click',closeSearch);
  document.getElementById('search-ov').addEventListener('click',function(e){ if(e.target===this) closeSearch(); });

  // 媒体预览
  document.getElementById('btn-mp-close').addEventListener('click',closeMP);
  document.getElementById('mp-pr').addEventListener('click',function(){ mpNav(-1); });
  document.getElementById('mp-nx').addEventListener('click',function(){ mpNav(1); });
  document.getElementById('mp').addEventListener('click',function(e){ if(e.target===this) closeMP(); });

  // 全局快捷键 & 拖放
  document.addEventListener('click',function(){ document.getElementById('ctx-c').innerHTML=''; });
  document.addEventListener('keydown',function(e){
    if((e.metaKey||e.ctrlKey)&&e.key==='k'){ e.preventDefault(); openSearch(); }
    if(e.key==='Escape'){ closeSearch(); closeMP(); closeMd(); }
  });
  document.addEventListener('dragover',function(e){ e.preventDefault(); document.getElementById('dov').classList.add('on'); });
  document.addEventListener('dragleave',function(e){ if(!e.relatedTarget) document.getElementById('dov').classList.remove('on'); });
  document.addEventListener('drop',function(e){ e.preventDefault(); document.getElementById('dov').classList.remove('on'); if(e.dataTransfer.files.length) addPend(e.dataTransfer.files); });

  // 主题恢复
  var th=localStorage.getItem(APP_CONFIG.themeKey)||'dark';
  if(th==='light'){ document.documentElement.setAttribute('data-theme','light'); S.darkMode=false; document.getElementById('btn-theme').textContent='\u2600\uFE0F'; }

  // 自动登录
  var saved=localStorage.getItem(APP_CONFIG.credKey);
  if(saved){ try{ var d=JSON.parse(saved); S.user=d.user; S.repo=d.repo; S.token=d.token; launchApp(); }catch(e){ localStorage.removeItem(APP_CONFIG.credKey); } }

  // PWA Service Worker
  if('serviceWorker' in navigator){ window.addEventListener('load',function(){ navigator.serviceWorker.register('sw.js').catch(function(){}); }); }
});
