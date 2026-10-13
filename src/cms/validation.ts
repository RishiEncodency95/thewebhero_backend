import { z, ZodTypeAny } from "zod";
import { Field, FieldMap } from "./fields";
import { jsonText, seoFields } from "./seo";

// Absolute http(s) URL or a site-relative path like "/images/a.png".
const urlLike = z
  .string()
  .trim()
  .max(2000)
  .refine((v) => v === "" || v.startsWith("/") || /^https?:\/\/[^\s]+$/i.test(v), {
    message: "Must be a full URL (https://…) or a path starting with /",
  });

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function toZod(field: Field): ZodTypeAny {
  let schema: ZodTypeAny;

  switch (field.type) {
    case "text":
    case "textarea":
    case "icon":
      schema = z.string().trim().max(field.type === "text" ? field.max ?? 300 : field.type === "textarea" ? field.max ?? 5000 : 80);
      if (field.required) schema = (schema as z.ZodString).min(1, `${field.label} is required`);
      break;
    case "markdown":
      schema = z.string().max(field.max ?? 200_000);
      if (field.required) schema = (schema as z.ZodString).min(1, `${field.label} is required`);
      break;
    case "slug":
      schema = z
        .string()
        .trim()
        .toLowerCase()
        .max(160)
        .refine((v) => v === "" || SLUG_RE.test(v), { message: "Use lowercase letters, numbers and hyphens only" });
      break;
    case "url":
    case "image":
      schema = urlLike;
      if (field.required) schema = urlLike.refine((v) => v !== "", { message: `${field.label} is required` });
      break;
    case "email":
      schema = z.union([z.literal(""), z.string().trim().toLowerCase().email().max(254)]);
      break;
    case "date":
      schema = z
        .string()
        .trim()
        .refine((v) => v === "" || /^\d{4}-\d{2}-\d{2}/.test(v), { message: "Use the format YYYY-MM-DD" });
      break;
    case "select": {
      const values = field.options.map((o) => o.value) as [string, ...string[]];
      schema = field.required ? z.enum(values) : z.union([z.enum(values), z.literal("")]);
      break;
    }
    case "number": {
      let n = z.number();
      if (field.integer) n = n.int();
      if (field.min !== undefined) n = n.min(field.min);
      if (field.max !== undefined) n = n.max(field.max);
      schema = field.required ? n : n.nullable();
      break;
    }
    case "boolean":
      schema = z.boolean();
      break;
    case "stringList":
      schema = z.array(z.string().trim().min(1).max(field.itemMax ?? 500)).max(field.max ?? 100);
      break;
    case "refs":
      schema = z.array(z.string().trim().regex(SLUG_RE)).max(field.max ?? 50);
      break;
    case "list":
      schema = z.array(buildValidator(field.of)).max(field.max ?? 100);
      if (field.required) schema = (schema as z.ZodArray<ZodTypeAny>).min(1, `Add at least one ${field.label}`);
      break;
    case "object":
      schema = buildValidator(field.of);
      break;
    case "seo":
      schema = buildValidator(seoFields).extend({ structuredData: jsonText(20000).optional() });
      break;
  }

  return field.required ? schema : schema.optional();
}

/** Zod object validator for a field map. Unknown keys are stripped. */
export function buildValidator(fields: FieldMap) {
  const shape: Record<string, ZodTypeAny> = {};
  for (const [key, field] of Object.entries(fields)) shape[key] = toZod(field);
  return z.object(shape);
}
