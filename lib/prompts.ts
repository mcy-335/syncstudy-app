import type { GenerateRequest } from "./types";

export function buildPrompt(input: GenerateRequest): string {
  const scope = `${input.grade}${input.subject}·${input.textbook}·${input.volume}`;
  const common = `
你是 SyncStudy 的教材同步学习内容生成器。目标用户是中国初中生。
当前教材范围：${scope}
学习主题：${input.topic}

硬性要求：
1. 不超出当前年级和教材范围；不确定时明确说明，不得编造教材章节。
2. 中文自然、短句、适合初中生；避免幼稚化和无关故事。
3. 事实、公式、答案必须准确。小测不得有歧义。
4. 只返回合法 JSON，不要 Markdown，不要代码围栏。
`;

  if (input.mode === "explain") {
    return `${common}
任务：生成通俗化讲解。
实验版本：${input.variant === "example-first" ? "生活例子优先" : "课本定义优先"}。
返回结构：
{"mode":"explain","title":"","textbookMeaning":"","plainExplanation":"","lifeExample":"","whyItWorks":"","commonMistake":"","quickCheck":""}`;
  }

  if (input.mode === "preview") {
    return `${common}
任务：生成5分钟课前预习提纲。必须恰好3条预习重点和2个思考题，不直接给出思考题答案。
返回结构：
{"mode":"preview","title":"","learningGoal":"","keyPoints":["","",""],"prerequisite":"","thinkingQuestions":["",""]}`;
  }

  if (input.mode === "quiz") {
    return `${common}
任务：生成5道${input.questionType === "fill" ? "填空" : "四选一选择"}题，难度为${input.difficulty ?? "适中"}。
每题必须提供唯一答案、简洁解析和对应知识点。选择题 options 恰好4项，answer 使用完整选项文本；填空题不需要 options。
返回结构：
{"mode":"quiz","title":"","questions":[{"id":1,"type":"${input.questionType ?? "choice"}","question":"","options":["A. ","B. ","C. ","D. "],"answer":"","explanation":"","knowledgePoint":""}]}`;
  }

  return `${common}
任务：生成可复制的结构化思维导图文本。tree 使用缩进和 ├─、└─ 字符，层级不超过4层。
返回结构：
{"mode":"mindmap","title":"","tree":"","reviewTip":""}`;
}
