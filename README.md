# SyncStudy

SyncStudy 是一个贴合校内教材的初中 AI 学习助手 MVP。

主要功能包括：

- 知识点通俗化讲解
- 5 分钟课前预习提纲
- 5 道课后小测与即时解析
- 可预览、复制并下载为 PNG 的思维导图
- 浏览器语音输入、匿名 A/B 讲解实验和本地学习记录

## 最快开始：无需 API

演示模式不需要 API Key。下载项目后，只需安装依赖并启动即可。

### 1. 准备运行环境

请先安装：

- Node.js 18.18 或更高版本，推荐 Node.js 20 LTS
- npm 9 或更高版本，安装 Node.js 时会一并安装

可在终端检查版本：

```bash
node -v
npm -v
```

### 2. 下载项目

使用 Git：

```bash
git clone https://github.com/mcy-335/syncstudy-app.git
cd syncstudy-app
```

也可以在 GitHub 页面点击 `Code` → `Download ZIP`，解压后在终端进入解压得到的 `syncstudy-app` 文件夹。

### 3. 安装依赖

```bash
npm install
```

### 4. 启动项目

```bash
npm run dev
```

浏览器打开 `http://localhost:3000`。此时默认使用内置演示数据，可以直接体验全部界面，不需要创建 `.env.local`。

停止项目时，在终端按 `Ctrl + C`。

## 接入真实大模型（可选）

只有需要调用真实模型时才执行本节。

### 1. 创建本地配置文件

Windows PowerShell：

```powershell
Copy-Item .env.example .env.local
```

macOS 或 Linux：

```bash
cp .env.example .env.local
```

### 2. 填写模型配置

打开 `.env.local`，填写所选服务商提供的值：

```dotenv
LLM_API_KEY=你的API密钥
LLM_BASE_URL=服务商的OpenAI兼容接口地址
LLM_MODEL=模型名称
LLM_DEMO_MODE=false
```

保存后重新运行 `npm run dev`。接口需兼容 OpenAI Chat Completions 格式。

项目不包含个人 API Key 或固定 API 地址，`.env.local` 已被 Git 忽略。请勿将真实配置上传或发给他人。

## 测试方法

运行完整检查：

```bash
npm test
```

该命令会依次运行：

- `npm run lint`：TypeScript 类型检查
- `npm run build`：Next.js 生产构建

也可以分别执行这两个命令。完成自动检查后，建议在演示模式下手动验证：

1. 分别进入“通俗讲解”“课前预习”“课后小测”“思维导图”。
2. 输入知识点，确认每个模式都能生成对应结构的结果。
3. 在小测中切换选择题/填空题和难度，确认题型一致且可以查看解析。
4. 在思维导图中确认预览正常，并测试复制文本与下载 PNG。

## 生产模式运行

```bash
npm run build
npm run start
```

浏览器仍然打开 `http://localhost:3000`。

## 常见问题

### 提示 `npm` 或 `node` 不是命令

请安装 Node.js，安装完成后关闭并重新打开终端，再执行 `node -v` 和 `npm -v`。

### 3000 端口已被占用

可以改用其他端口：

```bash
npm run dev -- -p 3001
```

然后打开 `http://localhost:3001`。

### 配置模型后仍显示演示数据

确认 `.env.local` 中以下四项均已正确填写，并在修改后重启项目：

- `LLM_API_KEY`
- `LLM_BASE_URL`
- `LLM_MODEL`
- `LLM_DEMO_MODE=false`

## 使用说明

当前教材范围主要由结构化输入和提示词约束。正式用于学校前，建议接入经过授权的教材知识库，并增加教师审核和系统化内容评测流程。
