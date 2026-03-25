/**
 * GitDrive — config.js  （根目录）
 * ============================================================
 * 【唯一需要修改的文件】
 *
 * 修改指引：
 *  - 新增/删除分类      → 编辑 CATS 数组
 *  - 调整数据文件路径   → 编辑 PATHS 对象
 *  - 修改文件类型分组   → 编辑 TYPE_GROUPS 数组
 *  - 调整功能参数       → 编辑 APP_CONFIG 对象
 *  - 修改帮助说明       → 编辑 HELP_ITEMS 数组
 *
 * 新增功能模块（未来扩展）：
 *  1. 在 assets/function/ 中新建 .js 文件
 *  2. 在 index.html 末尾注释区域按顺序引入 <script src>
 *  3. 在 assets/function/app-init.js 中绑定新功能的 DOM 事件
 *  4. 如需新配置，在本文件 APP_CONFIG 中添加即可
 * ============================================================
 */

// ── 文件分类 ─────────────────────────────────────────────────
// 第一项为默认上传分类
// id: 仓库文件夹名（仅英文/数字/连字符）
var CATS = [
  {id:'uncat',     label:'无分类', icon:'\u{1F4C2}', color:'#8b949e', bg:'rgba(139,148,158,.15)'},
  {id:'law',       label:'法学',   icon:'\u2696\uFE0F', color:'#4493f8', bg:'rgba(68,147,248,.15)'},
  {id:'envlaw',    label:'环境法', icon:'\u{1F33F}',   color:'#3fb950', bg:'rgba(63,185,80,.15)'},
  {id:'entertain', label:'娱乐',   icon:'\u{1F3AC}',   color:'#d29922', bg:'rgba(210,153,34,.15)'},
  {id:'work',      label:'办公',   icon:'\u{1F4BC}',   color:'#bc8cff', bg:'rgba(188,140,255,.15)'},
  {id:'text',      label:'文字',   icon:'\u{1F4DD}',   color:'#ffa657', bg:'rgba(255,166,87,.15)'},
  {id:'other',     label:'其他',   icon:'\u{1F4E6}',   color:'#8b949e', bg:'rgba(139,148,158,.15)'},
];

// ── 数据文件路径 ──────────────────────────────────────────────
// 默认保持与原版相同（根目录），无需移动已有数据文件
// 如需迁移到 assets/ 子目录，改为 'assets/gitdrive-*.json'
// 并同时将仓库中对应文件移动到 assets/ 文件夹
var PATHS = {
  messages: 'gitdrive-messages.json',
  meta:     'gitdrive-meta.json',
  memos:    'gitdrive-memos.json',
  trash:    'gitdrive-trash.json',
};

// ── 文件类型分组（所有文件页筛选用）────────────────────────────
var TYPE_GROUPS = [
  {id:'all',  label:'全部',   exts:[]},
  {id:'img',  label:'图片',   exts:['jpg','jpeg','png','gif','webp','svg','avif','bmp','heic']},
  {id:'doc',  label:'文档',   exts:['pdf','doc','docx','txt','md','rtf','xls','xlsx','csv','ppt','pptx','key','odt']},
  {id:'vid',  label:'视频',   exts:['mp4','mov','avi','mkv','webm','m4v']},
  {id:'aud',  label:'音频',   exts:['mp3','wav','flac','aac','ogg','m4a']},
  {id:'code', label:'代码',   exts:['js','ts','py','java','c','cpp','html','css','json','go','rs','php','sh']},
  {id:'zip',  label:'压缩包', exts:['zip','rar','7z','tar','gz','bz2']},
  {id:'app',  label:'应用',   exts:['apk','exe','ipa','dmg','pkg','deb']},
];

// ── 应用功能参数 ──────────────────────────────────────────────
var APP_CONFIG = {
  author:          'Wangcy',              // 侧边栏底部显示
  version:         '2.1.0',
  trashDays:       30,                    // 回收站文件保留天数
  batchDlMax:      10,                    // 批量下载单次上限
  trashFolder:     'gitdrive-trash-files',// 回收站临时文件存放文件夹（仓库内）
  // localStorage 键名（与原版保持一致，不会丢失已保存的登录状态）
  credKey:         'gd-creds',
  themeKey:        'gd-theme',
  pinnedPrefix:    'gd-pins-',
  clearTimePrefix: 'gd-ct-',
};

// ── 帮助说明 ──────────────────────────────────────────────────
var HELP_ITEMS = [
  ['\u{1F4AC}', '对话云盘',   '主界面。发送文字或上传文件，以气泡形式记录，内容实时存入 GitHub 仓库。支持 Markdown。'],
  ['\u{1F4CE}', '上传文件',   '点击 📎 或拖放文件，可多选。发送后存入所选分类文件夹。'],
  ['\u{1F4CC}', '置顶消息',   '操作菜单点击「置顶」，固定到对话顶部横幅，支持多条并可跳转。'],
  ['\u{1F4C1}', '所有文件',   '查看全部文件，支持网格/列表切换、分类/类型筛选、搜索，以及批量移动/下载/删除。'],
  ['\u2605',    '收藏',       '点击文件卡片 ☆ 收藏，不移动文件，通过侧边栏「收藏」快速访问。'],
  ['\u{1F4D3}', '备忘录',     '记录待办清单（含勾选）和 Markdown 笔记，数据持久存入仓库。⌘Enter 快捷发送。'],
  ['\u{1F5D1}', '回收站',     '删除文件保留 30 天可恢复，或永久删除。'],
  ['\u{1F4CA}', '统计',       '总存储用量及按分类、文件类型的占用分布。'],
  ['\u{1F511}', 'Token 说明', 'GitHub → Settings → Developer settings → Fine-grained tokens → 选仓库 → Contents 读写。'],
  ['\u{1F512}', '数据安全',   '凭据仅存于本设备 localStorage，文件直接读写你的 GitHub 仓库，不经过任何中间服务器。'],
];
