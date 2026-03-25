/**
 * GitDrive — ui-components.js
 * assets/function/ui-components.js
 * ============================================================
 * 通用 UI 组件：Toast、Modal、Sidebar、主题切换、
 *               媒体预览、自动高度 Textarea、帮助弹窗
 *
 * 本文件基本不需要修改。
 * 如需新增 UI 组件，建议在此文件末尾追加。
 *
 * 依赖：
 *   S（app-state.js）
 *   HELP_ITEMS, APP_CONFIG（config.js）
 *   esc, isVid, isAud, dlFile（core-utils.js）
 * ============================================================
 */

// ── Toast 提示 ────────────────────────────────────────────────
function toast(msg,type){
  var t=document.createElement('div');
  t.className='ts'+(type?' '+type:'');
  t.textContent=msg;
  document.getElementById('toasts').appendChild(t);
  setTimeout(function(){ t.remove(); },2500);
}

// ── Modal 弹窗 ────────────────────────────────────────────────
function showMd(html){
  var mc=document.getElementById('mc');
  mc.innerHTML='<div class="mov" id="md-ov"><div class="md">'+html+'</div></div>';
  document.getElementById('md-ov').addEventListener('click',function(e){ if(e.target===this) closeMd(); });
}
function closeMd(){ document.getElementById('mc').innerHTML=''; }

function showConfirm(title,text,onOk){
  showMd('<div class="md-t">'+title+'</div><div class="md-p">'+esc(text)+'</div><div class="md-btns"><button class="btn-g" id="cf-n">\u53D6\u6D88</button><button class="btn-d" id="cf-y">\u786E\u8BA4</button></div>');
  document.getElementById('cf-n').addEventListener('click',closeMd);
  document.getElementById('cf-y').addEventListener('click',function(){ closeMd(); if(onOk) onOk(); });
}

function showInput(title,label,def,onSave){
  var long=(def||'').length>60||(def||'').includes('\n');
  showMd('<div class="md-t">'+title+'</div><label style="font-size:11px;font-weight:600;color:var(--t2);text-transform:uppercase;letter-spacing:.06em;margin-bottom:5px;display:block">'+label+'</label><textarea class="md-inp" id="md-inp" style="min-height:'+(long?'110px':'44px')+'">'+esc(def||'')+'</textarea><div class="md-btns"><button class="btn-g" id="inp-n">\u53D6\u6D88</button><button class="btn-a" id="inp-y">\u4FDD\u5B58</button></div>');
  setTimeout(function(){ var inp=document.getElementById('md-inp'); if(inp) inp.focus(); },40);
  document.getElementById('inp-n').addEventListener('click',closeMd);
  document.getElementById('inp-y').addEventListener('click',function(){ var v=document.getElementById('md-inp').value; closeMd(); if(onSave) onSave(v); });
}

// ── 帮助弹窗 ──────────────────────────────────────────────────
// 内容由 config.js 中的 HELP_ITEMS 控制，无需修改此函数
function showHelp(){
  var items=HELP_ITEMS.map(function(h){
    return '<div style="display:flex;align-items:flex-start;gap:11px;margin-bottom:11px;padding:11px 13px;background:var(--bg3);border-radius:11px">'
      +'<span style="font-size:19px;flex-shrink:0;margin-top:1px">'+h[0]+'</span>'
      +'<div><div style="font-size:13px;font-weight:700;margin-bottom:3px">'+h[1]+'</div>'
      +'<div style="font-size:12px;color:var(--t2);line-height:1.68">'+h[2]+'</div></div></div>';
  }).join('');
  showMd(
    '<div style="display:flex;align-items:center;gap:12px;margin-bottom:18px">'
    +'<div style="width:44px;height:44px;background:linear-gradient(135deg,#4493f8,#bc8cff);border-radius:12px;display:flex;align-items:center;justify-content:center;font-size:22px;flex-shrink:0">\u26C5\uFE0F</div>'
    +'<div><div class="md-t" style="margin-bottom:2px;font-size:17px">GitDrive \u4F7F\u7528\u6307\u5357</div>'
    +'<div style="font-size:12px;color:var(--t2)">\u4EE5\u5BF9\u8BDD\u65B9\u5F0F\u4F7F\u7528 GitHub \u4ED3\u5E93\u4F5C\u4E3A\u79C1\u4EBA\u4E91\u76D8</div></div></div>'
    +'<div style="max-height:55vh;overflow-y:auto;margin-bottom:14px">'+items+'</div>'
    +'<div style="padding:11px 13px;background:var(--bg3);border-radius:11px;font-size:12px;color:var(--t2);display:flex;align-items:center;gap:8px;margin-bottom:14px">'
    +'<span style="font-size:16px">\u{1F464}</span> \u4F5C\u8005 <strong style="color:var(--t1)">'+APP_CONFIG.author+'</strong>'
    +' \u00B7 \u51ED\u636E\u4EC5\u5B58\u4E8E\u672C\u8BBE\u5907\uFF0C\u6587\u4EF6\u76F4\u63A5\u8BFB\u5199\u4F60\u7684 GitHub \u4ED3\u5E93</div>'
    +'<div class="md-btns"><button class="btn-a" id="help-ok">\u77E5\u9053\u4E86</button></div>'
  );
  document.getElementById('help-ok').addEventListener('click',closeMd);
}

// ── Sidebar ───────────────────────────────────────────────────
function openSb(){
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sb-ov').classList.add('on');
}
function closeSb(){
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sb-ov').classList.remove('on');
}

// ── 主题切换 ──────────────────────────────────────────────────
function toggleTheme(){
  S.darkMode=!S.darkMode;
  document.documentElement.setAttribute('data-theme',S.darkMode?'dark':'light');
  localStorage.setItem(APP_CONFIG.themeKey,S.darkMode?'dark':'light');
  document.getElementById('btn-theme').textContent=S.darkMode?'\u{1F319}':'\u2600\uFE0F';
}

// ── Textarea 自动高度 ─────────────────────────────────────────
function arTA(el){ el.style.height='auto'; el.style.height=Math.min(el.scrollHeight,120)+'px'; }

// ── 媒体预览 ──────────────────────────────────────────────────
function openMP(url,name,imgs,idx){
  S.mpItems=(imgs&&imgs.length)?imgs:[url];
  S.mpIdx=(imgs&&imgs.length)?(idx||0):0;
  _showMP();
}
function _showMP(){
  var url=S.mpItems[S.mpIdx], name=url.split('/').pop().split('?')[0];
  try{ name=decodeURIComponent(name); }catch(e){}
  document.getElementById('mp-nm').textContent=name;
  document.getElementById('btn-mp-dl').onclick=function(){ dlFile(url,name); };
  document.getElementById('mp-pr').style.display=S.mpItems.length>1?'flex':'none';
  document.getElementById('mp-nx').style.display=S.mpItems.length>1?'flex':'none';
  var ct=document.getElementById('mp-content');
  if(isVid(name)) ct.innerHTML='<video controls autoplay style="max-width:90vw;max-height:70vh;border-radius:8px"><source src="'+url+'"></video>';
  else if(isAud(name)) ct.innerHTML='<div style="padding:28px;text-align:center"><div style="font-size:44px;margin-bottom:14px">\u{1F3B5}</div><div style="font-size:13px;color:rgba(255,255,255,.7);margin-bottom:14px">'+esc(name)+'</div><audio controls autoplay><source src="'+url+'"></audio></div>';
  else ct.innerHTML='<img src="'+url+'" alt="'+esc(name)+'">';
  document.getElementById('mp').classList.add('on');
}
function mpNav(d){ S.mpIdx=(S.mpIdx+d+S.mpItems.length)%S.mpItems.length; _showMP(); }
function closeMP(){ document.getElementById('mp').classList.remove('on'); document.getElementById('mp-content').innerHTML=''; }
