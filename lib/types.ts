export type LearningMode = "explain" | "preview" | "quiz" | "mindmap";
export type QuestionType = "choice" | "fill";
export type ExperimentVariant = "definition-first" | "example-first";

export interface CurriculumContext {
  grade: "七年级" | "八年级" | "九年级";
  subject: "数学" | "物理" | "化学";
  textbook: string;
  volume: "上册" | "下册";
}

export interface GenerateRequest extends CurriculumContext {
  mode: LearningMode;
  topic: string;
  difficulty?: "基础" | "适中" | "提高";
  questionType?: QuestionType;
  variant?: ExperimentVariant;
}

export interface ExplainResult {
  mode: "explain";
  title: string;
  textbookMeaning: string;
  plainExplanation: string;
  lifeExample: string;
  whyItWorks: string;
  commonMistake: string;
  quickCheck: string;
}

export interface PreviewResult {
  mode: "preview";
  title: string;
  learningGoal: string;
  keyPoints: string[];
  prerequisite: string;
  thinkingQuestions: string[];
}

export interface QuizQuestion {
  id: number;
  type: QuestionType;
  question: string;
  options?: string[];
  answer: string;
  explanation: string;
  knowledgePoint: string;
}

export interface QuizResult {
  mode: "quiz";
  title: string;
  questions: QuizQuestion[];
}

export interface MindmapResult {
  mode: "mindmap";
  title: string;
  tree: string;
  reviewTip: string;
}

export type GenerateResult = ExplainResult | PreviewResult | QuizResult | MindmapResult;

export interface GenerateResponse {
  result: GenerateResult;
  meta: {
    provider: "demo" | "llm";
    model: string;
    curriculumLabel: string;
    variant?: ExperimentVariant;
  };
}
