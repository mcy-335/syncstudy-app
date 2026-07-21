import { NextResponse } from "next/server";
import { buildDemoResult } from "@/lib/demo";
import { buildPrompt } from "@/lib/prompts";
import type { GenerateRequest, GenerateResponse, GenerateResult } from "@/lib/types";
import { validateOrRepairResult } from "@/lib/result-validation";

export const runtime = "nodejs";

function isRequest(value: unknown): value is GenerateRequest {
  if (!value || typeof value !== "object") return false;
  const item = value as Partial<GenerateRequest>;
  return Boolean(item.grade && item.subject && item.textbook && item.volume && item.topic && item.mode);
}

function cleanJson(raw: string): string {
  return raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
}

export async function POST(request: Request) {
  try {
    const input: unknown = await request.json();
    if (!isRequest(input) || input.topic.trim().length < 2) {
      return NextResponse.json({ error: "请填写完整的教材信息和至少2个字的学习主题。" }, { status: 400 });
    }

    const curriculumLabel = `${input.grade}${input.subject} · ${input.textbook} · ${input.volume}`;
    const apiKey = process.env.LLM_API_KEY;
    const demoMode = process.env.LLM_DEMO_MODE !== "false" || !apiKey;
    const model = process.env.LLM_MODEL || "qwen3.7-plus";

    if (demoMode) {
      const response: GenerateResponse = {
        result: buildDemoResult(input),
        meta: { provider: "demo", model: "内置演示数据", curriculumLabel, variant: input.variant },
      };
      return NextResponse.json(response);
    }

    const configuredBaseUrl = process.env.LLM_BASE_URL?.trim();
    if (!configuredBaseUrl) {
      return NextResponse.json(
        { error: "真实模型模式缺少 LLM_BASE_URL，请配置后重试或启用演示模式。" },
        { status: 500 },
      );
    }
    const baseUrl = configuredBaseUrl.replace(/\/$/, "");
    const llmResponse = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: "你只输出合法JSON。所有教育内容必须准确、适龄并服从教材范围。" },
          { role: "user", content: buildPrompt(input) },
        ],
        temperature: input.mode === "quiz" ? 0.25 : 0.55,
        response_format: { type: "json_object" },
      }),
    });

    if (!llmResponse.ok) {
      const detail = await llmResponse.text();
      console.error("LLM request failed", llmResponse.status, detail);
      return NextResponse.json({ error: "模型服务暂时不可用，请稍后再试或启用演示模式。" }, { status: 502 });
    }

    const payload = await llmResponse.json();
    const content = payload?.choices?.[0]?.message?.content;
    if (typeof content !== "string") throw new Error("模型未返回文本内容");
    const result = JSON.parse(cleanJson(content)) as GenerateResult;
    const validatedResult = await validateOrRepairResult({
      result,
      originalContent: content,
      input,
      baseUrl,
      apiKey,
      model,
    });

    const response: GenerateResponse = {
      result: validatedResult,
      meta: { provider: "llm", model, curriculumLabel, variant: input.variant },
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "生成失败，请检查输入或稍后重试。" }, { status: 500 });
  }
}
