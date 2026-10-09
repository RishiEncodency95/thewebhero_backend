import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { env } from "../../config/env";
import { logger } from "../../config/logger";
import { ApiError } from "../../common/utils/ApiError";
import { SeoSuggestion } from "./seo.types";

const buildPrompt = (title: string, body: string): string =>
  `You are an SEO copywriter for a web development agency called TheWebHero.
Given a page's title and content below, write SEO metadata for it.

Respond with ONLY a raw JSON object (no markdown, no code fences) with exactly these keys:
- "seoTitle": a compelling SEO title, max 60 characters
- "seoDescription": a meta description that encourages clicks, max 160 characters
- "keywords": an array of 5 to 8 relevant, lowercase, comma-worthy keywords
- "ogImageAlt": a short descriptive alt text for the social share image, max 120 characters

Title: ${title}
Content: ${body.slice(0, 3000)}`;

function parseSuggestion(raw: string): SeoSuggestion {
  const cleaned = raw.replace(/```json|```/g, "").trim();

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new Error(`AI response was not valid JSON: ${cleaned.slice(0, 200)}`);
  }

  const keywords = Array.isArray(parsed.keywords) ? parsed.keywords.map(String).slice(0, 8) : [];

  return {
    seoTitle: String(parsed.seoTitle ?? "").slice(0, 60),
    seoDescription: String(parsed.seoDescription ?? "").slice(0, 160),
    keywords,
    ogImageAlt: String(parsed.ogImageAlt ?? "").slice(0, 120),
  };
}

async function generateWithOpenAI(title: string, body: string): Promise<SeoSuggestion> {
  if (!env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not configured");

  const client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  const completion = await client.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: buildPrompt(title, body) }],
    response_format: { type: "json_object" },
    temperature: 0.4,
  });

  const text = completion.choices[0]?.message?.content;
  if (!text) throw new Error("OpenAI returned an empty response");

  return parseSuggestion(text);
}

async function generateWithGemini(title: string, body: string): Promise<SeoSuggestion> {
  if (!env.GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not configured");

  const genAI = new GoogleGenerativeAI(env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
  const result = await model.generateContent(buildPrompt(title, body));
  const text = result.response.text();

  return parseSuggestion(text);
}

// OpenAI first, Gemini as a fallback if OpenAI is unavailable/fails.
export async function generateSeoSuggestion(title: string, body: string): Promise<SeoSuggestion> {
  try {
    return await generateWithOpenAI(title, body);
  } catch (openAiError) {
    logger.warn(openAiError, "OpenAI SEO generation failed - falling back to Gemini");

    try {
      return await generateWithGemini(title, body);
    } catch (geminiError) {
      logger.error(geminiError, "Gemini SEO generation also failed");
      throw ApiError.internal(
        "AI SEO generation failed. Check OPENAI_API_KEY / GEMINI_API_KEY in .env."
      );
    }
  }
}
