/**
 * GitDrive — memo.js
 * assets/function/memo.js
 * ============================================================
 * 备忘录模块（待办 + 笔记）
 *
 * 包含函数：
 *   setMemoType(t)     切换输入类型 todo/note
 *   setMemoFilter(f)   切换筛选 all/todo/note/done
 *   addMemo()          新增备忘录
 *   toggleMemoDone(id) 切换待办完成状态
 *   editMemo(id)       编辑内容
 *   delMemo(id)        删除备忘录
 *   renderMemos()      渲染备忘录列表
 *
 * 依赖：
 *   S（app-state.js）
 *   esc（core-utils.js）
 *   toast, showInput, showConfirm, arTA（ui-components.js）
 *   saveMemos（data-sync.js）
 *   marked（CDN）
 * ============================================================
 */

function setMemoType(t){
  S.memoType=t;
  document.getElementById('mbtn-todo').classList.toggle('on',t==='todo');
  document.getElementById('mbtn-note').classList.toggle('on',t==='note');
}

function setMemoFilter(f){
  S.memoFilter=f;
  ['all','todo','note','done'].forEach(function(k){ document.getElementById('mf-'+k).classList.toggle('on',k===f); });
  renderMemos();
}

function addMemo(){
  var inp=document.getElementById('memo-inp'), txt=inp.value.trim();
  if(!txt) return;
  S.memos.unshift({id:Date.now().toString(),type:S.memoType,content:txt,done:false,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});
  inp.value=''; arTA(inp); renderMemos(); saveMemos();
  toast('\u5DF2\u4FDD\u5B58','ok');
}

function toggleMemoDone(id){
  var m=S.memos.find(function(x){ return x.id===id; }); if(!m) return;
  m.done=!m.done; m.updatedAt=new Date().toISOString(); renderMemos(); saveMemos();
}

function editMemo(id){
  var m=S.memos.find(function(x){ return x.id===id; }); if(!m) return;
  showInput('\u7F16\u8F91\u5907\u5FD8','\u5185\u5BB9',m.content,function(v){
    m.content=v; m.updatedAt=new Date().toISOString(); renderMemos(); saveMemos(); toast('\u5DF2\u4FDD\u5B58','ok');
  });
}

function delMemo(id){
  showConfirm('\u5220\u9664\u5907\u5FD8','\u786E\u8BA4\u5220\u9664\uFF1F',function(){
    S.memos=S.memos.filter(function(x){ return x.id!==id; }); renderMemos(); saveMemos(); toast('\u5DF2\u5220\u9664');
  });
}

function renderMemos(){
  var el=document.getElementById('memo-list'); if(!el) return;
  var list=S.memos.slice();
  if(S.memoFilter==='todo') list=list.filter(function(m){ return m.type==='todo'&&!m.done; });
  else if(S.memoFilter==='note') list=list.filter(function(m){ return m.type==='note'; });
  else if(S.memoFilter==='done') list=list.filter(function(m){ return m.done; });
  if(!list.length){
    el.innerHTML='<div class="emp"><div class="emp-ic">\u{1F4D3}</div><div class="emp-t">\u6682\u65E0\u5907\u5FD8</div><div class="emp-s">\u7528\u4E0A\u65B9\u8F93\u5165\u6846\u6DFB\u52A0\u5F85\u529E\u6216\u7B14\u8BB0</div></div>';
    return;
  }
  el.innerHTML='';
  list.forEach(function(m){
    var t=new Date(m.createdAt).toLocaleDateString('zh-CN',{month:'short',day:'numeric'});
    var card=document.createElement('div'); card.className='memo-card'; if(m.done) card.style.opacity='0.6';
    var top=document.createElement('div'); top.style.cssText='display:flex;align-items:flex-start;gap:10px';
    if(m.type==='todo'){
      var chk=document.createElement('button');
      chk.style.cssText='flex-shrink:0;width:20px;height:20px;border-radius:5px;border:2px solid '+(m.done?'var(--gr)':'var(--b3)')+';background:'+(m.done?'var(--gr)':'transparent')+';color:#fff;font-size:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;margin-top:2px';
      chk.textContent=m.done?'\u2713':'';
      chk.addEventListener('click',function(){ toggleMemoDone(m.id); }); top.appendChild(chk);
    } else {
      var ico=document.createElement('span'); ico.style.cssText='flex-shrink:0;font-size:15px;margin-top:1px'; ico.textContent='\u{1F4DD}'; top.appendChild(ico);
    }
    var body=document.createElement('div'); body.className='memo-body'; body.style.cssText='flex:1;min-width:0';
    if(m.type==='note') body.innerHTML=marked.parse(m.content||'');
    else { var sp=document.createElement('span'); if(m.done) sp.style.cssText='text-decoration:line-through;color:var(--t3)'; sp.textContent=m.content||''; body.appendChild(sp); }
    top.appendChild(body); card.appendChild(top);
    var ft=document.createElement('div'); ft.className='memo-ft';
    var dt=document.createElement('span'); dt.className='memo-date'; dt.textContent=t; ft.appendChild(dt);
    var eb=document.createElement('button'); eb.className='memo-act'; eb.textContent='\u270E \u7F16\u8F91'; eb.addEventListener('click',function(){ editMemo(m.id); }); ft.appendChild(eb);
    var db=document.createElement('button'); db.className='memo-act del'; db.textContent='\u2715 \u5220\u9664'; db.addEventListener('click',function(){ delMemo(m.id); }); ft.appendChild(db);
    card.appendChild(ft); el.appendChild(card);
  });
}
