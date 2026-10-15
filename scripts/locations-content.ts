// Writes unique, location-specific copy for the /locations pages with AI, so
// they are not near-duplicates of each other (which Google ignores).
//
//   npm run locations:content                    # locations without sections yet
//   npm run locations:content -- --slug=raj-nagar
//   npm run locations:content -- --force         # rewrite all

import { connectDB, disconnectDB } from "../src/config/db";
import { locations } from "../src/content/editorial";
import { ask, BUSINESS } from "../src/modules/seo/seo.provider";
import { revalidateFrontend } from "../src/cms/revalidate";

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const force = process.argv.includes("--force");
const CONCURRENCY = 4;

interface Generated {
  intro: string;
  sections: { title: string; description: string }[];
  highlights: { title: string; description: string }[];
  faqs: { question: string; answer: string }[];
}

const prompt = (name: string, type: string) => `You write landing-page copy for ${BUSINESS}

Write the page for businesses in ${name} (${type === "city" ? "a city/area in Uttar Pradesh, India, in or near Ghaziabad / Delhi NCR" : "a country TheWebHero serves remotely from India"}).

Make it genuinely specific to ${name}: mention the kinds of businesses common there, how TheWebHero works with them ${type === "city" ? "(on-site meetings are possible because the office is nearby, in Govindpuram, Ghaziabad)" : "(remote delivery, time-zone overlap, communication in English, pricing in USD or local currency on request)"}, and which services fit best. Use only widely known, general facts about ${name}. Never invent clients, project names, numbers, years in business, rankings, awards, prices or guarantees.

Return ONLY JSON:
{
  "intro": "60-90 words, mentions ${name} and 'web development' naturally",
  "sections": [3 items: {"title": "H2 heading that includes ${name}", "description": "110-160 words, plain text, no markdown"}],
  "highlights": [4 items: {"title": "2-4 words", "description": "max 18 words"}],
  "faqs": [4 items: {"question": "a question a business owner in ${name} would ask", "answer": "40-80 words"}]
}`;

function valid(g: Generated): boolean {
  return Boolean(g.intro && g.sections?.length >= 2 && g.highlights?.length >= 3 && g.faqs?.length >= 3 && g.sections.every((s) => s.title && s.description) && g.faqs.every((f) => f.question && f.answer));
}

async function main() {
  await connectDB();
  const Model = locations.Model;
  const slug = arg("slug");
  const docs = await Model.find(slug ? { slug } : force ? {} : { $or: [{ sections: { $exists: false } }, { sections: { $size: 0 } }] });
  console.log(`${docs.length} location(s) to write`);

  let ok = 0;
  const queue = [...docs];
  const next = async (): Promise<void> => {
    const doc = queue.shift();
    if (!doc) return;
    const name = String(doc.get("name"));
    for (let attempt = 1; attempt <= 2; attempt++) {
      try {
        const g = JSON.parse((await ask(prompt(name, String(doc.get("type"))))).replace(/```json|```/g, "").trim()) as Generated;
        if (!valid(g)) throw new Error("incomplete answer");
        doc.set({ intro: g.intro.trim(), sections: g.sections.slice(0, 4), highlights: g.highlights.slice(0, 4), faqs: g.faqs.slice(0, 5) });
        await doc.save();
        revalidateFrontend(["locations", `locations:${doc.get("slug")}`]);
        ok++;
        console.log(`  ✓ ${name}`);
        break;
      } catch (err) {
        if (attempt === 2) console.log(`  x ${name}: ${(err as Error).message}`);
      }
    }
    return next();
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, next));
  console.log(`Finished: ${ok}/${docs.length} written.`);
  await disconnectDB();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
