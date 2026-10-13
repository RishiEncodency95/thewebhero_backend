import { Schema, SchemaDefinition } from "mongoose";
import { Field, FieldMap } from "./fields";
import { seoMongooseSchema } from "./seo";

const STRING_TYPES = new Set(["text", "textarea", "slug", "url", "email", "image", "icon", "date", "select"]);

function toPath(field: Field): SchemaDefinition[string] {
  if (STRING_TYPES.has(field.type)) {
    return {
      type: String,
      trim: true,
      ...(field.type === "select" ? { enum: [...field.options.map((o) => o.value), ""] } : {}),
    };
  }

  switch (field.type) {
    case "markdown":
      return { type: String };
    case "number":
      return { type: Number };
    case "boolean":
      return { type: Boolean, default: false };
    case "stringList":
    case "refs":
      return { type: [String], default: [] };
    case "list":
      return { type: [new Schema(buildDefinition(field.of), { _id: false })], default: [] };
    case "object":
      return { type: new Schema(buildDefinition(field.of), { _id: false }), default: () => ({}) };
    case "seo":
      return { type: seoMongooseSchema, default: () => ({}) };
    default:
      return { type: String };
  }
}

/** Mongoose schema definition for a field map. Validation lives in Zod, not here. */
export function buildDefinition(fields: FieldMap): SchemaDefinition {
  const def: SchemaDefinition = {};
  for (const [key, field] of Object.entries(fields)) def[key] = toPath(field);
  return def;
}
