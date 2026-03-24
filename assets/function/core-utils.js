/**
 * GitDrive — core-utils.js
 * assets/function/core-utils.js
 * ============================================================
 * 核心工具函数：GitHub API 封装、Base64、URL、文件类型判断、
 * 格式化、DOM 工具等底层无副作用函数。
 *
 * 本文件基本不需要修改。
 * 如需扩展新的工具函数，可直接在此文件末尾追加，
 * 或创建新的功能模块文件并在 index.html 中按顺序引入。
 *
 * 依赖：全局变量 S（由 app-state.js 定义）
 * ============================================================
 */

// ── GitHub API ───────────────────────────────────────────────
function apiUrl(p){
  return 'https://api.github.com/repos/'+S.user+'/'+S.repo+'/contents/'+p;
}
function apiHd(){
  return {
    'Authorization':'Bearer '+S.token,
    'Accept':'application/vnd.github+json',
    'X-GitHub-Api-Version':'2022-11-28',
    'Content-Type':'application/json'
  };
}
function ghGet(p){ return fetch(apiUrl(p),{headers:apiHd()}); }
function ghPut(p,b){ return fetch(apiUrl(p),{method:'PUT',headers:apiHd(),body:JSON.stringify(b)}); }
function ghDel(p,sha){ return fetch(apiUrl(p),{method:'DELETE',headers:apiHd(),body:JSON.stringify({message:'Delete [GitDrive]',sha:sha})}); }

// ── 路径处理 ─────────────────────────────────────────────────
// 对路径每段分别 encode，避免重复 encode 问题
function ghPath(path){
  return path.split('/').map(function(p){
    try{ return encodeURIComponent(decodeURIComponent(p)); }
    catch(e){ return encodeURIComponent(p); }
  }).join('/');
}

// 生成 raw.githubusercontent.com 直链（文件下载/预览用）
function rawUrl(path){
  return 'https://raw.githubusercontent.com/'+S.user+'/'+S.repo+'/main/'+
    path.split('/').map(function(p){
      try{ return encodeURIComponent(decodeURIComponent(p)); }
      catch(e){ return encodeURIComponent(p); }
    }).join('/');
}

// ── Base64 编解码 ─────────────────────────────────────────────
function toB64(s){
  var bytes=new TextEncoder().encode(s), bin='';
  bytes.forEach(function(b){ bin+=String.fromCharCode(b); });
  return btoa(bin);
}
function fromB64(b){
  var raw=atob(b.replace(/\n/g,'')), bytes=Uint8Array.from(raw,function(c){ return c.charCodeAt(0); });
  return new TextDecoder('utf-8').decode(bytes);
}

// ── 文件类型判断 ──────────────────────────────────────────────
function isImage(n){ return /\.(jpg|jpeg|png|gif|webp|svg|avif|bmp|heic)$/i.test(n); }
function isVid(n){   return /\.(mp4|mov|avi|mkv|webm|m4v)$/i.test(n); }
function isAud(n){   return /\.(mp3|wav|flac|aac|ogg|m4a)$/i.test(n); }
function xExt(n){    return (n.split('.').pop()||'').toLowerCase(); }

// ── 文件图标 ──────────────────────────────────────────────────
function fileIconColor(n){
  var e=xExt(n);
  if(/^(jpg|jpeg|png|gif|webp|svg|avif|bmp|heic)$/.test(e)) return {l:'IMG',c:'#1a7f37',bg:'#d1fae5'};
  if(/^(mp4|mov|avi|mkv|webm|m4v)$/.test(e))               return {l:'VID',c:'#cf222e',bg:'#fee2e2'};
  if(/^(mp3|wav|flac|aac|ogg|m4a)$/.test(e))               return {l:'AUD',c:'#8250df',bg:'#ede9fe'};
  if(/^pdf$/.test(e))                                        return {l:'PDF',c:'#cf222e',bg:'#fee2e2'};
  if(/^(doc|docx)$/.test(e))                                return {l:'DOC',c:'#0969da',bg:'#dbeafe'};
  if(/^(xls|xlsx|csv|ods)$/.test(e))                       return {l:'XLS',c:'#1a7f37',bg:'#d1fae5'};
  if(/^(ppt|pptx|key|odp)$/.test(e))                       return {l:'PPT',c:'#bc4c00',bg:'#ffedd5'};
  if(/^(txt|md|log|rtf)$/.test(e))                         return {l:'TXT',c:'#656d76',bg:'#f0f2f4'};
  if(/^(js|ts|jsx|tsx|py|java|c|cpp|html|css|json|go|rs|php|sh)$/.test(e)) return {l:'</>',c:'#0550ae',bg:'#cffafe'};
  if(/^(zip|rar|7z|tar|gz|bz2)$/.test(e))                  return {l:'ZIP',c:'#7d4e00',bg:'#fef3c7'};
  if(/^(apk|exe|ipa|dmg|pkg|deb)$/.test(e))                return {l:'APP',c:'#6e40c9',bg:'#e0d7ff'};
  return {l:'FILE',c:'#656d76',bg:'#f0f2f4'};
}
function fileIcon(n){
  var e=xExt(n);
  if(/^(jpg|jpeg|png|gif|webp|svg|avif|bmp|heic)$/.test(e)) return '\u{1F5BC}\uFE0F';
  if(/^(mp4|mov|avi|mkv|webm|m4v)$/.test(e))               return '\u{1F3AC}';
  if(/^(mp3|wav|flac|aac|ogg|m4a)$/.test(e))               return '\u{1F3B5}';
  var fc=fileIconColor(n);
  return '<span style="font-size:11px;font-weight:900;color:'+fc.c+';background:'+fc.bg+';padding:2px 5px;border-radius:4px;line-height:1">'+fc.l+'</span>';
}

// ── 格式化 & 转义 ─────────────────────────────────────────────
function fmtSz(b){
  if(!b||b<0) return '';
  if(b<1024) return b+'B';
  if(b<1048576) return (b/1024).toFixed(1)+'KB';
  return (b/1048576).toFixed(1)+'MB';
}
function esc(s){
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ── 下载触发 ──────────────────────────────────────────────────
function dlFile(url,name){
  var a=document.createElement('a'); a.href=url; a.download=name; a.target='_blank'; a.click();
}
