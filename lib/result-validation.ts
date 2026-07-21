import { buildPrompt } from "./prompts";
import type { GenerateRequest, GenerateResult, QuizQuestion, QuizResult } from "./types";

type ValidationResult =
  | { ok: true; result: GenerateResult }
  | { ok: false; reason: string };

type RepairOptions = {
  result: GenerateResult;
  originalContent: string;
  input: GenerateRequest;
  baseUrl: string;
  apiKey?: string;
  model: string;
};

export async function validateOrRepairResult(options: RepairOptions): Promise<GenerateResult> {
  const firstPass = validateAndNormalize(options.result, options.input);
  if (firstPass.ok) return firstPass.result;
  if (!options.apiKey) throw new Error("MODEL_API_KEY_MISSING");

  const expectedType = options.input.questionType === "fill" ? "fill-in-the-blank" : "multiple-choice";
  const repairResponse = await fetch(`${options.baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${options.apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: options.model,
      messages: [
        { role: "system", content: "Return valid JSON only. Follow the requested educational content schema exactly." },
        { role: "user", content: buildPrompt(options.input) },
        { role: "assistant", content: options.originalContent },
        {
          role: "user",
          content: `The previous JSON is invalid: ${firstPass.reason}. Return a corrected complete JSON object. Keep the content in Chinese. The quiz must contain exactly five ${expectedType} questions and no mixed question types. Multiple-choice questions must each contain exactly four options and one answer matching an option.`,
        },
      ],
      temperature: 0.15,
      response_format: { type: "json_object" },
    }),
  });

  if (!repairResponse.ok) {
    const detail = await repairResponse.text();
    console.error("LLM repair request failed", repairResponse.status, detail);
    throw new Error("MODEL_REPAIR_REQUEST_FAILED");
  }

  const payload = await repairResponse.json();
  const content = payload?.choices?.[0]?.message?.content;
  if (typeof content !== "string") throw new Error("MODEL_REPAIR_CONTENT_MISSING");
  const repaired = JSON.parse(cleanJson(content)) as GenerateResult;
  const secondPass = validateAndNormalize(repaired, options.input);
  if (!secondPass.ok) throw new Error(`MODEL_SCHEMA_INVALID: ${secondPass.reason}`);
  return secondPass.result;
}

function validateAndNormalize(result: GenerateResult, input: GenerateRequest): ValidationResult {
  if (!result || typeof result !== "object") return { ok: false, reason: "result is not an object" };
  if (result.mode !== input.mode) return { ok: false, reason: `mode must be ${input.mode}` };
  if (input.mode !== "quiz") return { ok: true, result };
  if (result.mode !== "quiz" || !Array.isArray(result.questions)) return { ok: false, reason: "questions must be an array" };
  if (result.questions.length !== 5) return { ok: false, reason: "quiz must contain exactly five questions" };

  const requestedType = input.questionType ?? "choice";
  const normalizedQuestions: QuizQuestion[] = [];
  for (const [index, question] of result.questions.entries()) {
    if (!question || typeof question.question !== "string" || typeof question.answer !== "string") {
      return { ok: false, reason: `question ${index + 1} is incomplete` };
    }

    if (requestedType === "choice") {
      if (!Array.isArray(question.options) || question.options.length !== 4 || question.options.some((option) => typeof option !== "string" || !option.trim())) {
        return { ok: false, reason: `question ${index + 1} must contain exactly four options` };
      }
      const answer = matchChoiceAnswer(question.answer, question.options);
      if (!answer) return { ok: false, reason: `question ${index + 1} answer must match one option` };
      normalizedQuestions.push({ ...question, id: index + 1, type: "choice", options: question.options, answer });
    } else {
      normalizedQuestions.push({ ...question, id: index + 1, type: "fill", options: undefined });
    }
  }

  const normalized: QuizResult = { ...result, mode: "quiz", questions: normalizedQuestions };
  return { ok: true, result: normalized };
}

function matchChoiceAnswer(answer: string, options: string[]): string | null {
  const trimmed = answer.trim();
  const direct = options.find((option) => normalize(option) === normalize(trimmed));
  if (direct) return direct;
  const letter = trimmed.match(/^([A-D])(?:[.\u3001:\uff1a])?$/i)?.[1]?.toUpperCase();
  if (letter) return options[letter.charCodeAt(0) - 65] ?? null;
  const withoutPrefix = normalize(trimmed.replace(/^[A-D][.\u3001:\uff1a]\s*/i, ""));
  return options.find((option) => normalize(option.replace(/^[A-D][.\u3001:\uff1a]\s*/i, "")) === withoutPrefix) ?? null;
}

function normalize(value: string): string {
  return value.toLowerCase().replace(/\s+/g, "").replace(/[,.\u3002\uff0c]/g, "");
}

function cleanJson(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}
