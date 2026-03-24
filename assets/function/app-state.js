/**
 * GitDrive — app-state.js
 * assets/function/app-state.js
 * ============================================================
 * 全局状态对象 S 及分类映射 catMap
 *
 * S 是整个应用唯一的运行时状态存储，所有模块共享。
 * catMap 是 CATS 数组的 id→对象 快速索引。
 *
 * 本文件基本不需要修改。
 * 如需新增状态字段，在 S 对象末尾追加即可，
 * 同时在对应的功能模块中初始化使用。
 *
 * 依赖：CATS（config.js）
 * ============================================================
 */

// 全局状态对象
// ── 注意：所有字段都有初始值，修改时请保留结构 ──────────────
var S = {
  // GitHub 凭据
  user:'', repo:'', token:'',

  // 对话消息
  msgs:[], msgSha:null,

  // 文件列表 & 元数据（收藏/归档）
  files:[], meta:{favorites:[], archived:[]}, metaSha:null,

  // 回收站
  trash:[], trashSha:null,

  // 备忘录
  memos:[], memoSha:null,

  // 当前选中的上传分类（初始化时由 CATS[0].id 赋值）
  cur: null,

  // 文件网格筛选状态
  fCat:'all', fType:'all', fView:'grid',

  // 文件网格多选状态
  fgSel:false, fgSeled:{},

  // 消息多选状态
  selMode:false, seled:{},

  // 主题
  darkMode:true,

  // 媒体预览
  mpItems:[], mpIdx:0,

  // 待上传文件队列
  pend:[],

  // 清空历史时间戳（仅隐藏显示，不删除数据）
  clearTime:null,

  // 置顶消息 id 列表
  pinned:[],

  // 备忘录状态
  memoType:'todo',
  memoFilter:'all',

  // ── 以下为扩展功能预留字段 ──────────────────────────────
  // 新增功能模块时在此添加对应状态字段
};

// 分类 id → 对象 快速映射（由 buildUI 初始化）
var catMap = {};
function initCatMap(){
  catMap = {};
  CATS.forEach(function(c){ catMap[c.id]=c; });
  S.cur = CATS[0].id;
}
