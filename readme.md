## 🚀 GitCloud IM
基于 GitHub API 的私人“闪念笔记 + 资料管理”应用

GitCloud IM 是一个极简、开源的跨平台 Web 应用。它利用 GitHub 仓库作为后端存储，通过聊天对话的形式，让你能够随时随地记录想法、上传资料，并实现全自动的云端分类与检索。

## ✨ 特性
💬 聊天式交互：像发微信或 Telegram 一样记录笔记、上传文件。

📂 自动云端分类：支持自定义文件夹（文字、办公、娱乐等），发送时自动归档。

🎨 MD3 视觉设计：基于 Google Material Design 3 规范，拥有流畅的动画与优雅的圆角。

🔍 双重资料检索：支持按“文件夹分类”与“文件格式（PDF/MP4/PNG等）”交叉筛选。

🔐 零服务器部署：纯前端实现，Token 仅保存在浏览器本地，安全、免费且私密。

📱 响应式设计：完美适配手机端，支持“添加到主屏幕”作为 PWA 使用。

## 🛠️ 快速开始

### 创建仓库：在 GitHub 创建一个私有仓库（例如 my-cloud）。

### 获取 Token

GitHub 目前有两种 Token：Fine-grained (细粒度) 和 Classic (经典)。对于个人小项目，我推荐使用 Fine-grained，因为它更安全，可以只给特定仓库权限。

**具体步骤：**

1. 登录 GitHub，点击右上角头像，选择 Settings (设置)。
2. 在左侧菜单栏拉到最底部，点击 Developer settings。
3. 选择 Personal access tokens -> Fine-grained tokens。
4. 点击 Generate new token。

**配置 Token 信息：**

1. Token name: 随便填，比如 My-Quick-Uploader。
2. Expiration: 有效期。建议选 90 天或更久（过期后需重新生成）。
3. Repository access: 建议选 Only select repositories，然后选中你专门用来存文件的那个仓库。
4. Permissions: 点击 Repository permissions，找到 Contents，将其权限设置为 Read and write。
5. 点击底部的 Generate token。

**[!CAUTION]**
重要提示：Token 生成后只会显示一次！请立刻把它复制并保存到你的备忘录或密码管理器里。如果你刷新页面，它就再也看不到了。

**部署应用：**

1. 将本仓库代码```index.html```上传至你的 GitHub Pages。
2. 或者直接下载 index.html 在本地浏览器打开。
3. 配置连接：点击应用右上角的 ⚙️ 图标，填入你的 用户名、仓库名 和 Token。

## 📁 分类文件夹说明
本应用默认将资料划分为以下目录，你可以在 index.html 的 CONFIG_FOLDERS 变量中自由定制：

📝 文字 (notes)：随手记录的灵感与短句。

💼 办公 (office)：工作文档与报表。

🎮 娱乐 (fun)：多媒体资源。

📥 临时 (inbox)：碎纸篓与临时中转。

## 🛡️ 安全性
本项目不设后端服务器。所有的 API 调用均由你的浏览器直接发起至 GitHub 官方服务器。你的 GitHub Token 严格加密存储在浏览器的 localStorage 中，不会泄露给任何第三方。
