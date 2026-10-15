// Fills in on-page SEO with AI for every record that does not score 100.
//
//   npm run seo:optimize                         # all content types
//   npm run seo:optimize -- --resource=services  # one type
//   npm run seo:optimize -- --limit=5 --dry-run  # preview, nothing saved
//   npm run seo:optimize -- --force              # rewrite even perfect records
//
// Keeps share images, canonical URLs, robots and structured data the editors set.

import { connectDB, disconnectDB } from "../src/config/db";
import "../src/content/offerings";
import "../src/content/editorial";
import "../src/content/site";
import { contentRegistry } from "../src/cms/registry";
import { seoService, scoreInputs } from "../src/modules/seo/seo.service";
import { seoProblems } from "../src/modules/seo/seo.score";

const arg = (name: string) => process.argv.find((a) => a.startsWith(`--${name}=`))?.split("=")[1];
const flag = (name: string) => process.argv.includes(`--${name}`);
const CONCURRENCY = Number(arg("concurrency") ?? 4);

async function main() {
  await connectDB();
  const only = arg("resource");
  const limit = Number(arg("limit") ?? Infinity);
  const dryRun = flag("dry-run");
  const force = flag("force");

  const defs = contentRegistry.all().filter((d) => d.kind === "collection" && d.fields.seo?.type === "seo" && (!only || d.resource === only));
  const queue: { resource: string; id: string; label: string }[] = [];
  for (const def of defs) {
    const docs = await def.model.find().lean<Record<string, unknown>[]>();
    for (const doc of docs) {
      if (!force && !seoProblems(scoreInputs(def, doc)).length) continue;
      queue.push({ resource: def.resource, id: String(doc._id), label: `${def.resource}/${doc[def.slugField ?? ""] ?? doc[def.titleField]}` });
    }
  }
  const work = queue.slice(0, limit);
  console.log(`${work.length} record(s) to optimize${dryRun ? " (dry run)" : ""}`);

  let done = 0;
  let perfect = 0;
  const failed: string[] = [];
  const next = async (): Promise<void> => {
    const item = work.shift();
    if (!item) return;
    try {
      if (dryRun) {
        const s = await seoService.generateForRecord(item.resource, item.id);
        console.log(`\n${item.label}\n  kw: ${s.focusKeyword}\n  title (${s.seoTitle.length}): ${s.seoTitle}\n  desc (${s.seoDescription.length}): ${s.seoDescription}\n  keywords: ${s.keywords.join(", ")}${s.problems.length ? `\n  ! ${s.problems.join("; ")}` : ""}`);
        if (!s.problems.length) perfect++;
      } else {
        const r = await seoService.optimizeRecord(item.resource, item.id, { force });
        if (!r.problems.length) perfect++;
        else console.log(`  ! ${item.label}: ${r.problems.join("; ")}`);
      }
    } catch (err) {
      failed.push(item.label);
      console.log(`  x ${item.label}: ${(err as Error).message}`);
    }
    done++;
    if (!dryRun && done % 10 === 0) console.log(`  ${done} done…`);
    return next();
  };
  await Promise.all(Array.from({ length: CONCURRENCY }, next));

  console.log(`\nFinished: ${done} processed, ${perfect} now score 100, ${failed.length} failed.`);
  await disconnectDB();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
