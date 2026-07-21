import type { GenerateRequest, GenerateResult, QuizQuestion } from "./types";

const normalize = (text: string) => text.replace(/\s/g, "").toLowerCase();

export function buildDemoResult(input: GenerateRequest): GenerateResult {
  const key = normalize(input.topic);

  if (input.mode === "explain") {
    if (key.includes("比热容")) {
      return {
        mode: "explain",
        title: "比热容：谁更不容易升温？",
        textbookMeaning: "比热容表示单位质量的某种物质温度升高 1℃ 所吸收的热量。",
        plainExplanation: "比热容可以理解为物质的“升温耐力”。比热容越大，吸收同样多的热量时，温度变化通常越小。",
        lifeExample: "夏天晒过一段时间后，水泥地很烫，河水却仍比较凉。",
        whyItWorks: "水的比热容比水泥大。同样受到太阳照射时，水升温更慢。",
        commonMistake: "比热容是物质本身的一种性质，不等于物体当前含有的热量。",
        quickCheck: "为什么沿海地区通常比内陆地区昼夜温差小？",
      };
    }

    if (key.includes("折射")) {
      return {
        mode: "explain",
        title: "光的折射：光为什么会“拐弯”？",
        textbookMeaning: "光从一种介质斜射入另一种介质时，传播方向通常会发生改变，这种现象叫光的折射。",
        plainExplanation: "光从空气进入水里，就像自行车从平路斜着骑进沙地，一边先慢下来，前进方向便会改变。",
        lifeExample: "把筷子斜插进水杯，水面附近的筷子看起来像折断了；游泳池也常比实际看起来浅。",
        whyItWorks: "光在不同介质中的传播速度不同，斜着通过交界面时传播方向发生变化。",
        commonMistake: "垂直射向两种介质的交界面时，光的传播方向不会偏折，但仍属于折射过程。",
        quickCheck: "站在岸边看水中的鱼，看到的位置通常比鱼的实际位置深还是浅？",
      };
    }

    return {
      mode: "explain",
      title: `${input.topic}：先抓住核心意思`,
      textbookMeaning: `${input.topic}是本节需要掌握的核心概念。正式学习时，要同时关注定义中的条件、对象和结论。`,
      plainExplanation: `可以先把“${input.topic}”拆成“它是什么、什么时候用、怎样判断”三个问题。`,
      lifeExample: "试着从课堂实验、日常购物、运动或自然现象中找到一个对应场景。",
      whyItWorks: "把抽象定义与具体情境对应，可以帮助我们理解概念的适用条件。",
      commonMistake: "只记住例子却忘记定义中的限制条件，容易在变式题中判断错误。",
      quickCheck: `请用自己的话说出“${input.topic}”的核心意思，并举一个例子。`,
    };
  }

  if (input.mode === "preview") {
    const rational = key.includes("有理数");
    return {
      mode: "preview",
      title: `${input.topic}·5分钟预习`,
      learningGoal: rational
        ? "认识有理数的基本概念，并能用数表示生活中的相反意义。"
        : `先建立“${input.topic}”的知识框架，带着问题进入课堂。`,
      keyPoints: rational
        ? ["正数、负数和零分别表示什么", "数轴的原点、正方向和单位长度", "相反数与绝对值的意义"]
        : [`${input.topic}的核心概念`, "本节出现的新符号、规律或公式", "知识点与前面内容的联系"],
      prerequisite: rational ? "会比较小学阶段学过的非负数大小。" : "回忆上一节课的关键词和典型例题。",
      thinkingQuestions: rational
        ? ["海拔 −20 米表示什么？", "0℃是不是表示“没有温度”？为什么？"]
        : [`生活中哪里能看到“${input.topic}”的应用？`, `你认为本节最容易混淆的两个概念是什么？`],
    };
  }

  if (input.mode === "quiz") {
    return {
      mode: "quiz",
      title: `${input.topic}·随堂小测`,
      questions: buildQuiz(input),
    };
  }

  const root = input.topic.trim() || "本单元";
  return {
    mode: "mindmap",
    title: `${root}·知识结构`,
    tree: `${root}\n├─ 核心概念\n│  ├─ 定义与关键词\n│  └─ 成立条件\n├─ 重要规律\n│  ├─ 基本结论\n│  └─ 公式或表示方法\n├─ 典型应用\n│  ├─ 生活实例\n│  └─ 课堂例题\n└─ 易错点\n   ├─ 相似概念辨析\n   └─ 使用条件检查`,
    reviewTip: "复习时先遮住二级分支，尝试自己补全；再结合一道典型题检查是否真正理解。",
  };
}

function buildQuiz(input: GenerateRequest): QuizQuestion[] {
  const fill = input.questionType === "fill";
  const key = normalize(input.topic);
  if (key.includes("有理数")) {
    const base = [
      ["如果向东走 3 米记作 +3 米，那么向西走 5 米记作什么？", ["A. +5米", "B. −5米", "C. +2米", "D. −2米"], "B. −5米", "相反方向用相反符号表示。", "正数和负数"],
      ["数轴上表示 −2 的点在原点的哪一侧？", ["A. 左侧", "B. 右侧", "C. 原点", "D. 无法判断"], "A. 左侧", "负数位于原点左侧。", "数轴"],
      ["−7 的相反数是？", ["A. −7", "B. 7", "C. 1/7", "D. 0"], "B. 7", "只有符号不同的两个数互为相反数。", "相反数"],
      ["|−6| 的值是？", ["A. −6", "B. 6", "C. 0", "D. 1/6"], "B. 6", "绝对值表示数轴上到原点的距离。", "绝对值"],
      ["下列数中最小的是？", ["A. −5", "B. −1", "C. 0", "D. 2"], "A. −5", "数轴上越靠左的数越小。", "有理数大小比较"],
    ];
    return base.map((item, index) => ({
      id: index + 1,
      type: fill ? "fill" : "choice",
      question: item[0] as string,
      options: fill ? undefined : (item[1] as string[]),
      answer: fill ? (item[2] as string).replace(/^[A-D]\.\s*/, "") : (item[2] as string),
      explanation: item[3] as string,
      knowledgePoint: item[4] as string,
    }));
  }

  return Array.from({ length: 5 }, (_, index) => ({
    id: index + 1,
    type: fill ? "fill" : "choice",
    question: `${index + 1}. 关于“${input.topic}”的第${index + 1}个基础理解，下面哪项符合本节知识？`,
    options: fill ? undefined : ["A. 符合定义和条件", "B. 忽略了成立条件", "C. 混淆了相近概念", "D. 与题意无关"],
    answer: fill ? "请根据教材定义填写关键概念" : "A. 符合定义和条件",
    explanation: "先圈出题目条件，再与教材定义逐项比较。当前为无密钥演示题，接入模型后会生成对应章节的具体题目。",
    knowledgePoint: input.topic,
  }));
}
