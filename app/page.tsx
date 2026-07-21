"use client";

import { useEffect, useMemo, useState } from "react";
import { MindmapCanvas } from "./MindmapCanvas";
import type {
  CurriculumContext,
  ExplainResult,
  GenerateResponse,
  GenerateResult,
  LearningMode,
  MindmapResult,
  PreviewResult,
  QuestionType,
  QuizQuestion,
  QuizResult,
} from "@/lib/types";

const MODES: Array<{ id: LearningMode; index: string; title: string; desc: string; icon: string }> = [
  { id: "explain", index: "01", title: "通俗讲解", desc: "生活例子讲明白", icon: "讲" },
  { id: "preview", index: "02", title: "课前预习", desc: "5分钟抓住重点", icon: "预" },
  { id: "quiz", index: "03", title: "课后小测", desc: "5道题即时解析", icon: "测" },
  { id: "mindmap", index: "04", title: "思维导图", desc: "一键整理知识结构", icon: "图" },
];

const MODE_COPY: Record<LearningMode, { eyebrow: string; title: string; placeholder: string; button: string }> = {
  explain: { eyebrow: "CONCEPT DECODER", title: "今天想弄懂什么？", placeholder: "例如：光的折射、比热容", button: "生成通俗讲解" },
  preview: { eyebrow: "5-MINUTE PREVIEW", title: "准备预习哪一章？", placeholder: "例如：有理数、光现象", button: "生成预习提纲" },
  quiz: { eyebrow: "QUICK CHECK", title: "想测一测哪部分？", placeholder: "例如：有理数、光的反射", button: "生成5道小测" },
  mindmap: { eyebrow: "KNOWLEDGE MAP", title: "要整理哪个单元？", placeholder: "例如：有理数、光现象", button: "生成思维导图" },
};

interface HistoryItem {
  id: string;
  mode: LearningMode;
  topic: string;
  time: string;
  response: GenerateResponse;
}

export default function Home() {
  const [context, setContext] = useState<CurriculumContext>({
    grade: "八年级",
    subject: "物理",
    textbook: "人教版",
    volume: "上册",
  });
  const [mode, setMode] = useState<LearningMode>("explain");
  const [topic, setTopic] = useState("光的折射");
  const [questionType, setQuestionType] = useState<QuestionType>("choice");
  const [difficulty, setDifficulty] = useState<"基础" | "适中" | "提高">("适中");
  const [variant, setVariant] = useState<"definition-first" | "example-first">("definition-first");
  const [response, setResponse] = useState<GenerateResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [history, setHistory] = useState<HistoryItem[]>([]);

  useEffect(() => {
    const storedVariant = localStorage.getItem("syncstudy-variant");
    const assigned = storedVariant === "definition-first" || storedVariant === "example-first"
      ? storedVariant
      : Math.random() > 0.5 ? "example-first" : "definition-first";
    localStorage.setItem("syncstudy-variant", assigned);
    setVariant(assigned);

    try {
      const saved = JSON.parse(localStorage.getItem("syncstudy-history") || "[]") as HistoryItem[];
      setHistory(saved.slice(0, 6));
    } catch {
      localStorage.removeItem("syncstudy-history");
    }
  }, []);

  const activeCopy = MODE_COPY[mode];
  const scopeLabel = `${context.grade}${context.subject} · ${context.textbook} · ${context.volume}`;

  function updateContext<K extends keyof CurriculumContext>(key: K, value: CurriculumContext[K]) {
    setContext((current) => ({ ...current, [key]: value }));
    setResponse(null);
  }

  function switchMode(next: LearningMode) {
    setMode(next);
    setResponse(null);
    setError("");
  }

  async function generate() {
    if (topic.trim().length < 2) {
      setError("请先输入至少2个字的知识点、章节或单元名称。");
      return;
    }

    setLoading(true);
    setError("");
    setResponse(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...context, mode, topic: topic.trim(), questionType, difficulty, variant }),
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload.error || "生成失败");

      const next = payload as GenerateResponse;
      setResponse(next);
      const entry: HistoryItem = {
        id: `${Date.now()}`,
        mode,
        topic: topic.trim(),
        time: new Intl.DateTimeFormat("zh-CN", { hour: "2-digit", minute: "2-digit" }).format(new Date()),
        response: next,
      };
      setHistory((current) => {
        const updated = [entry, ...current.filter((item) => !(item.mode === mode && item.topic === topic.trim()))].slice(0, 6);
        localStorage.setItem("syncstudy-history", JSON.stringify(updated));
        return updated;
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "生成失败，请稍后重试。");
    } finally {
      setLoading(false);
    }
  }

  function notify(message: string) {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }

  function startVoice() {
    const SpeechRecognition = (window as typeof window & {
      webkitSpeechRecognition?: new () => {
        lang: string;
        interimResults: boolean;
        start: () => void;
        onresult: (event: { results: ArrayLike<{ 0: { transcript: string } }> }) => void;
        onerror: () => void;
      };
    }).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      notify("当前浏览器不支持语音输入，请使用文字输入");
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.interimResults = false;
    recognition.onresult = (event) => setTopic(event.results[0][0].transcript.replace(/[。！？]$/, ""));
    recognition.onerror = () => notify("没有听清，请再试一次");
    recognition.start();
    notify("正在听，请说出知识点名称");
  }

  return (
    <main>
      {toast && <div className="toast" role="status">{toast}</div>}
      <header className="topbar">
        <a className="brand" href="#top" aria-label="SyncStudy 首页">
          <span className="brand-mark">S</span>
          <span>SyncStudy</span>
        </a>
        <div className="topbar-center">
          <span className="live-dot" /> 教材同步模式
        </div>
        <div className="topbar-actions">
          <span className="privacy-label">匿名学习 · 不计入正式成绩</span>
          <a className="outline-button" href="#history">学习记录</a>
        </div>
      </header>

      <section className="hero" id="top">
        <div className="hero-copy">
          <p className="eyebrow"><span>AI LEARNING ASSISTANT</span><i /></p>
          <h1>课本里的难点，<br /><em>换一种方式就懂了。</em></h1>
          <p className="hero-subtitle">紧跟校内课堂，把抽象定义变成生活例子、预习提纲、随堂小测和清晰的知识结构。</p>
          <div className="hero-points">
            <span><b>01</b> 教材范围约束</span>
            <span><b>02</b> 初中生语言</span>
            <span><b>03</b> 即学即测</span>
          </div>
        </div>
        <div className="hero-note" aria-label="教学循环">
          <span className="note-pin" />
          <p>LEARNING LOOP</p>
          <strong>预习 → 学习 → 练习 → 整理</strong>
          <small>AI 帮你换一种讲法，老师把关知识准确性。</small>
          <div className="scribble">每天进步一点点</div>
        </div>
      </section>

      <section className="task-strip" aria-label="学习任务">
        {MODES.map((item) => (
          <button key={item.id} className={`task-card ${mode === item.id ? "active" : ""}`} onClick={() => switchMode(item.id)}>
            <span className="task-index">{item.index}</span>
            <span className="task-icon">{item.icon}</span>
            <span><strong>{item.title}</strong><small>{item.desc}</small></span>
          </button>
        ))}
      </section>

      <section className="workspace">
        <aside className="context-panel">
          <div>
            <p className="panel-kicker">YOUR CLASSROOM</p>
            <h2>先对齐你的课本</h2>
            <p className="panel-desc">这些信息会自动带入每次生成，减少答非所问和超纲内容。</p>
          </div>
          <div className="field-grid">
            <label>年级
              <select value={context.grade} onChange={(e) => updateContext("grade", e.target.value as CurriculumContext["grade"])}>
                <option>七年级</option><option>八年级</option><option>九年级</option>
              </select>
            </label>
            <label>学科
              <select value={context.subject} onChange={(e) => updateContext("subject", e.target.value as CurriculumContext["subject"])}>
                <option>数学</option><option>物理</option><option>化学</option>
              </select>
            </label>
            <label>教材版本
              <select value={context.textbook} onChange={(e) => updateContext("textbook", e.target.value)}>
                <option>人教版</option><option>北师大版</option><option>华师大版</option><option>苏科版</option>
              </select>
            </label>
            <label>册次
              <select value={context.volume} onChange={(e) => updateContext("volume", e.target.value as CurriculumContext["volume"])}>
                <option>上册</option><option>下册</option>
              </select>
            </label>
          </div>
          <div className="scope-ticket">
            <span>当前学习范围</span>
            <strong>{scopeLabel}</strong>
            <small>如无法准确匹配，系统会提示补充章节。</small>
          </div>
          <div className="course-tags">
            <p>AIED 课程能力映射</p>
            <div><span>ASR</span><span>模型</span><span>EDM</span><span className="accent">ACG</span><span>实验</span><span>评价</span></div>
          </div>
        </aside>

        <div className="generator-panel">
          <div className="generator-heading">
            <div>
              <p className="panel-kicker coral">{activeCopy.eyebrow}</p>
              <h2>{activeCopy.title}</h2>
            </div>
            <span className="step-badge">{MODES.find((item) => item.id === mode)?.index} / 04</span>
          </div>

          <div className="topic-input-wrap">
            <label htmlFor="topic">知识点、章节或单元名称</label>
            <div className="topic-input">
              <input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder={activeCopy.placeholder} onKeyDown={(e) => e.key === "Enter" && generate()} />
              <button onClick={startVoice} aria-label="语音输入" title="语音输入"><MicIcon /></button>
            </div>
            <div className="suggestions">
              <span>试一试</span>
              {context.subject === "物理" ? ["光的折射", "比热容", "声音的产生"] : context.subject === "数学" ? ["有理数", "一元二次方程", "平行线"] : ["分子和原子", "质量守恒定律", "酸和碱"].map(() => "")}
              {(context.subject === "物理" ? ["光的折射", "比热容", "声音的产生"] : context.subject === "数学" ? ["有理数", "一元二次方程", "平行线"] : ["分子和原子", "质量守恒定律", "酸和碱"]).map((item) => (
                <button key={item} onClick={() => setTopic(item)}>{item}</button>
              ))}
            </div>
          </div>

          {mode === "quiz" && (
            <div className="quiz-settings">
              <ChoiceGroup label="题型" value={questionType} options={[{ value: "choice", label: "选择题" }, { value: "fill", label: "填空题" }]} onChange={(value) => setQuestionType(value as QuestionType)} />
              <ChoiceGroup label="难度" value={difficulty} options={[{ value: "基础", label: "基础" }, { value: "适中", label: "适中" }, { value: "提高", label: "提高" }]} onChange={(value) => setDifficulty(value as typeof difficulty)} />
            </div>
          )}

          {mode === "explain" && (
            <div className="experiment-note">
              <span>A/B</span>
              <div><strong>嵌入式学习实验已开启</strong><small>本次采用{variant === "example-first" ? "“生活例子优先”" : "“课本定义优先”"}版本，只匿名比较学习效果。</small></div>
            </div>
          )}

          {error && <div className="error-box" role="alert">{error}</div>}

          <button className="generate-button" onClick={generate} disabled={loading}>
            {loading ? <><span className="spinner" /> 正在对齐教材并生成…</> : <>{activeCopy.button}<ArrowIcon /></>}
          </button>

          <div className={`result-shell ${response ? "visible" : ""}`}>
            {!response && !loading ? (
              <div className="result-empty">
                <div className="empty-orbit"><span>{MODES.find((item) => item.id === mode)?.icon}</span></div>
                <strong>学习材料会出现在这里</strong>
                <p>填写上方内容后点击生成。没有配置模型密钥也可以体验完整流程。</p>
              </div>
            ) : loading ? (
              <div className="skeletons"><i /><i /><i /><i /></div>
            ) : response ? (
              <ResultView response={response} variant={variant} onNotify={notify} />
            ) : null}
          </div>
        </div>
      </section>

      <section className="history-section" id="history">
        <div className="section-heading">
          <div><p className="eyebrow"><span>LEARNING TRACE</span><i /></p><h2>最近的学习记录</h2></div>
          <p>数据仅保存在当前浏览器中。</p>
        </div>
        {history.length === 0 ? (
          <div className="history-empty">完成第一次生成后，这里会出现你的学习记录。</div>
        ) : (
          <div className="history-grid">
            {history.map((item) => {
              const info = MODES.find((entry) => entry.id === item.mode)!;
              return <button key={item.id} onClick={() => { setMode(item.mode); setTopic(item.topic); setResponse(item.response); window.scrollTo({ top: 540, behavior: "smooth" }); }}>
                <span className="history-icon">{info.icon}</span>
                <span><small>{info.title} · {item.time}</small><strong>{item.topic}</strong><em>{item.response.meta.curriculumLabel}</em></span>
                <ArrowIcon />
              </button>;
            })}
          </div>
        )}
      </section>

      <footer>
        <div className="brand"><span className="brand-mark">S</span><span>SyncStudy</span></div>
        <p>AI 生成内容用于辅助学习，重要知识与答案请以教材和教师指导为准。</p>
        <span>Generate → Test → Measure → Improve</span>
      </footer>
    </main>
  );
}

function ChoiceGroup({ label, value, options, onChange }: { label: string; value: string; options: Array<{ value: string; label: string }>; onChange: (value: string) => void }) {
  return <div className="choice-group"><span>{label}</span><div>{options.map((option) => <button key={option.value} className={value === option.value ? "selected" : ""} onClick={() => onChange(option.value)}>{option.label}</button>)}</div></div>;
}

function ResultView({ response, variant, onNotify }: { response: GenerateResponse; variant: "definition-first" | "example-first"; onNotify: (message: string) => void }) {
  const { result, meta } = response;
  return <div className="result-content">
    <div className="result-topline">
      <div><span className="verified-dot" /> {meta.curriculumLabel}</div>
      <span>{meta.provider === "demo" ? "演示模式" : meta.model}</span>
    </div>
    {result.mode === "explain" && <ExplainView result={result} variant={variant} />}
    {result.mode === "preview" && <PreviewView result={result} />}
    {result.mode === "quiz" && <QuizView result={result} />}
    {result.mode === "mindmap" && <MindmapView result={result} onNotify={onNotify} />}
    <div className="feedback-bar">
      <span>这份内容对你有帮助吗？</span>
      <div><button onClick={() => onNotify("已记录：看懂了")}>看懂了</button><button onClick={() => onNotify("已记录：还需换种讲法")}>还不太懂</button><button onClick={() => onNotify("已标记，建议交由老师核对")}>内容有误</button></div>
    </div>
  </div>;
}

function ExplainView({ result, variant }: { result: ExplainResult; variant: "definition-first" | "example-first" }) {
  const meaning = <ResultCard key="meaning" index="01" label="课本原意" className="navy"><p>{result.textbookMeaning}</p></ResultCard>;
  const example = <ResultCard key="example" index="02" label="生活里的例子" className="lime"><p>{result.lifeExample}</p></ResultCard>;
  return <>
    <div className="result-title"><span>通俗讲解</span><h3>{result.title}</h3><p>{result.plainExplanation}</p></div>
    <div className="explain-grid">{variant === "example-first" ? [example, meaning] : [meaning, example]}</div>
    <ResultCard index="03" label="为什么会这样" className="plain"><p>{result.whyItWorks}</p></ResultCard>
    <div className="tip-row"><div><b>容易踩坑</b><p>{result.commonMistake}</p></div><div><b>想一想</b><p>{result.quickCheck}</p></div></div>
  </>;
}

function PreviewView({ result }: { result: PreviewResult }) {
  return <>
    <div className="result-title"><span>5分钟预习</span><h3>{result.title}</h3><p>{result.learningGoal}</p></div>
    <div className="preview-points">{result.keyPoints.slice(0, 3).map((point, index) => <div key={point}><span>0{index + 1}</span><p>{point}</p></div>)}</div>
    <div className="prerequisite"><b>课前先回忆</b><p>{result.prerequisite}</p></div>
    <div className="thinking-box"><b>带着两个问题去上课</b>{result.thinkingQuestions.slice(0, 2).map((question, index) => <p key={question}><span>Q{index + 1}</span>{question}</p>)}</div>
  </>;
}

function QuizView({ result }: { result: QuizResult }) {
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const correctCount = useMemo(() => result.questions.filter((q) => normalizeAnswer(answers[q.id]) === normalizeAnswer(q.answer)).length, [answers, result.questions]);
  return <>
    <div className="result-title"><span>随堂小测</span><h3>{result.title}</h3><p>先独立完成，提交后再查看答案和解析。</p></div>
    <div className="quiz-list">{result.questions.slice(0, 5).map((question, index) => <QuizQuestionView key={question.id} question={question} index={index} value={answers[question.id] || ""} submitted={submitted} onChange={(value) => setAnswers((current) => ({ ...current, [question.id]: value }))} />)}</div>
    {!submitted ? <button className="submit-quiz" disabled={Object.keys(answers).length < 5} onClick={() => setSubmitted(true)}>提交并查看解析 <span>{Object.keys(answers).length}/5</span></button> : <div className="quiz-score"><span>{correctCount}<small>/ 5</small></span><div><strong>{correctCount >= 4 ? "掌握得不错" : "找到需要巩固的地方了"}</strong><p>建议回看标红题目的对应知识点，再尝试一次。</p></div><button onClick={() => { setAnswers({}); setSubmitted(false); }}>再做一次</button></div>}
  </>;
}

function QuizQuestionView({ question, index, value, submitted, onChange }: { question: QuizQuestion; index: number; value: string; submitted: boolean; onChange: (value: string) => void }) {
  const correct = normalizeAnswer(value) === normalizeAnswer(question.answer);
  return <article className={`quiz-question ${submitted ? correct ? "correct" : "incorrect" : ""}`}>
    <div className="question-head"><span>{String(index + 1).padStart(2, "0")}</span><p>{question.question.replace(/^\d+\.\s*/, "")}</p></div>
    {question.type === "choice" && question.options ? <div className="option-grid">{question.options.map((option) => <button key={option} disabled={submitted} className={value === option ? "chosen" : ""} onClick={() => onChange(option)}>{option}</button>)}</div> : <input className="fill-answer" disabled={submitted} value={value} onChange={(e) => onChange(e.target.value)} placeholder="在这里填写答案" />}
    {submitted && <div className="answer-panel"><b>{correct ? "回答正确" : `正确答案：${question.answer}`}</b><p>{question.explanation}</p><span>知识点 · {question.knowledgePoint}</span></div>}
  </article>;
}

function MindmapView({ result, onNotify }: { result: MindmapResult; onNotify: (message: string) => void }) {
  async function copy() {
    await navigator.clipboard.writeText(`${result.title}\n\n${result.tree}\n\n复习建议：${result.reviewTip}`);
    onNotify("思维导图已复制");
  }
  return <>
    <div className="result-title"><span>知识结构</span><h3>{result.title}</h3><p>可以直接复制到笔记软件继续修改。</p></div>
    <MindmapCanvas result={result} onNotify={onNotify} />
    <div className="mindmap-toolbar"><span>结构化文本</span><button onClick={copy}><CopyIcon />复制全部</button></div>
    <pre className="mindmap-tree">{result.tree}</pre>
    <div className="review-tip"><b>复习方法</b><p>{result.reviewTip}</p></div>
  </>;
}

function ResultCard({ index, label, className, children }: { index: string; label: string; className: string; children: React.ReactNode }) {
  return <div className={`result-card ${className}`}><div><span>{index}</span><b>{label}</b></div>{children}</div>;
}

const normalizeAnswer = (value = "") => value.toLowerCase().replace(/\s|[，。,.]/g, "").replace(/^[a-d][.、]/, "");

function MicIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 15.5a3.5 3.5 0 0 0 3.5-3.5V5a3.5 3.5 0 1 0-7 0v7a3.5 3.5 0 0 0 3.5 3.5Z"/><path d="M5.5 11.5v.5a6.5 6.5 0 0 0 13 0v-.5M12 18.5V22M9 22h6"/></svg>; }
function ArrowIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M14 7l5 5-5 5"/></svg>; }
function CopyIcon() { return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="8" y="8" width="11" height="11" rx="2"/><path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2"/></svg>; }
