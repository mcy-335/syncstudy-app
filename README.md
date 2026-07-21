# SyncStudy

教材同步的初中 AI 学习助手 MVP。包含：

- 知识点通俗化讲解
- 5分钟课前预习提纲
- 5道课后小测与即时解析
- 可预览、复制并下载为 PNG 的结构化思维导图
- 浏览器语音输入、匿名 A/B 讲解实验和本地学习记录

## 环境要求

- Node.js 18.18 或更高版本（推荐 Node.js 20 LTS）
- npm 9 或更高版本


## 本地运行

```bash
npm install
npm run dev
```

打开 `http://localhost:3000`。默认使用内置演示数据，不需要 API Key。

## 接入真实大模型

复制 `.env.example` 为 `.env.local`，填写：

```dotenv
LLM_API_KEY=
LLM_BASE_URL=
LLM_MODEL=
LLM_DEMO_MODE=false
```

接口需兼容 OpenAI Chat Completions 格式。项目不包含个人 API Key 或固定 API 地址，`.env.local` 已被 Git 忽略，请勿将真实配置提交到仓库。

## 测试方法

运行完整的本地检查：

```bash
npm test
```

该命令会依次执行：

- `npm run lint`：运行 TypeScript 类型检查
- `npm run build`：执行 Next.js 生产构建

也可以分别运行：

```bash
npm run lint
npm run build
```

完成自动检查后，建议在演示模式下手动验证：

1. 分别进入“通俗讲解”“课前预习”“课后小测”“思维导图”。
2. 输入知识点并确认每个模式都能生成对应结构的结果。
3. 在小测中切换选择题/填空题及难度，确认题型一致且可查看解析。
4. 在思维导图中确认预览正常，并测试复制文本与下载 PNG。

## 生产运行

```bash
npm run build
npm run start
```

## 说明

当前教材范围约束依赖提示词和结构化输入。真正用于学校前，应增加经过授权的教材知识库、教师审核流程和系统化内容评测。
