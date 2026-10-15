import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { ApiError } from "../../common/utils/ApiError";
import { SeoContext, SeoSuggestion } from "./seo.types";
import { DESCRIPTION_RANGE, keywordSlug, seoProblems, TITLE_RANGE } from "./seo.score";

const OPENAI_MODEL = "gpt-5-mini";
const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_ATTEMPTS = 3;

export const BUSINESS = `TheWebHero (thewebhero.in) is an IT services company based in Govindpuram, Ghaziabad (Uttar Pradesh, India), serving clients across India and worldwide. It builds custom websites, web apps, mobile apps, SaaS products, AI solutions, cloud/DevOps and provides IT support.`;

function buildPrompt(ctx: SeoContext, feedback: string[]): string {
  return `You are a senior SEO specialist writing on-page SEO for one page of ${BUSINESS}

Page type: ${ctx.pageType ?? "page"}
Page URL path: ${ctx.path ?? "(unknown)"}${ctx.slug ? `\nURL slug: ${ctx.slug}` : ""}${ctx.location ? `\nTarget location: ${ctx.location}` : ""}
Page title: ${ctx.title}
Page content:
${ctx.body.slice(0, 4000) || "(no body text - infer from the title)"}

Write metadata that ranks for what a real customer would search and earns the click.
Rules (all are checked automatically - break one and the answer is rejected):
- "focusKeyword": the main search phrase for this page, 2-5 words, lowercase.${ctx.slug ? ` It MUST match the URL slug: written with hyphens it has to appear inside "${ctx.slug}" (e.g. slug "react-development" -> "react development").` : ""}
- "seoTitle": ${TITLE_RANGE[0] + 15}-${TITLE_RANGE[1]} characters, starts with or contains the exact focus keyword, written in Title Case, ends with " | TheWebHero" when it fits. No ALL CAPS, no keyword stuffing.
- "seoDescription": ${DESCRIPTION_RANGE[0] + 30}-${DESCRIPTION_RANGE[1] - 2} characters, contains the exact focus keyword once, states the benefit and ends with a call to action.
- "keywords": 5-8 related lowercase search phrases (long-tail, include location variants when relevant).
- "ogImageAlt": max 120 characters describing a share image for this page.
- Do not invent facts, prices, awards, client names or statistics.
${feedback.length ? `\nYour previous answer was rejected because: ${feedback.join("; ")}. Fix every point.` : ""}
Respond with ONLY a JSON object with keys focusKeyword, seoTitle, seoDescription, keywords, ogImageAlt.`;
}

function parseSuggestion(raw: string): SeoSuggestion {
  const cleaned = raw.replace(/```json|```/g, "").trim();
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`AI response was not valid JSON: ${cleaned.slice(0, 200)}`);
  }
  return {
    focusKeyword: String(parsed.focusKeyword ?? "").trim().toLowerCase().slice(0, 80),
    seoTitle: String(parsed.seoTitle ?? "").replace(/\s+/g, " ").trim().slice(0, 120),
    seoDescription: String(parsed.seoDescription ?? "").replace(/\s+/g, " ").trim().slice(0, 320),
    keywords: Array.isArray(parsed.keywords) ? [...new Set(parsed.keywords.map((k) => String(k).trim().toLowerCase()).filter(Boolean))].slice(0, 8) : [],
    ogImageAlt: String(parsed.ogImageAlt ?? "").trim().slice(0, 120),
  };
}

async function askOpenAI(prompt: string): Promise<string> {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");
  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY, timeout: 90_000 });
  const completion = await client.chat.completions.create({
    model: OPENAI_MODEL,
    messages: [{ role: "user", content: prompt }],
    response_format: { type: "json_object" },
  });
  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned an empty response");
  return text;
}

async function askGemini(prompt: string): Promise<string> {
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");
  const model = new GoogleGenerativeAI(env.GEMINI_API_KEY).getGenerativeModel({
    model: GEMINI_MODEL,
    generationConfig: { responseMimeType: "application/json", temperature: 0.4 },
  });
  const result = await model.generateContent(prompt);
  return result.response.text();
}

/** OpenAI first, Gemini if OpenAI is unavailable. Returns raw JSON text. */
export async function ask(prompt: string): Promise<string> {
  try {
    return await askOpenAI(prompt);
  } catch (openAiError) {
    logger.warn(openAiError, "OpenAI SEO generation failed - trying Gemini");
    return askGemini(prompt);
  }
}

/** Problems with a suggestion, judged by the same rules as the SEO score. */
function check(s: SeoSuggestion, ctx: SeoContext): string[] {
  const problems = seoProblems({ seo: { title: s.seoTitle, description: s.seoDescription, focusKeyword: s.focusKeyword }, slug: ctx.slug });
  if (s.keywords.length < 3) problems.push("give at least 5 keywords");
  return problems;
}

/**
 * Generates SEO metadata and re-asks the model (with the exact problems)
 * until it passes every check. Returns the best attempt if none is perfect.
 */
export async function generateSeoSuggestion(ctx: SeoContext): Promise<SeoSuggestion & { problems: string[] }> {
  let best: (SeoSuggestion & { problems: string[] }) | null = null;
  let feedback: string[] = [];

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    let suggestion: SeoSuggestion;
    try {
      suggestion = parseSuggestion(await ask(buildPrompt(ctx, feedback)));
    } catch (err) {
      logger.error(err, "AI SEO generation failed");
      if (attempt === MAX_ATTEMPTS && !best) throw ApiError.internal("AI SEO generation failed. Check OPENAI_API_KEY / GEMINI_API_KEY in .env.");
      continue;
    }

    // A slug-based keyword always satisfies the URL rule - use it if the model keeps missing.
    if (ctx.slug && attempt === MAX_ATTEMPTS && suggestion.focusKeyword && !ctx.slug.includes(keywordSlug(suggestion.focusKeyword))) {
      suggestion.focusKeyword = ctx.slug.replace(/-\d+$/, "").replace(/-/g, " ");
    }

    const problems = check(suggestion, ctx);
    if (!best || problems.length < best.problems.length) best = { ...suggestion, problems };
    if (!problems.length) break;
    feedback = problems;
  }
  return best!;
}
