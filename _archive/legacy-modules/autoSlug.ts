import { Schema } from "mongoose";
import slugify from "slugify";

// Mongoose plugin: auto-generates `slug` from `sourceField` when slug is empty.
// Usage: schema.plugin(autoSlug("title"));
export function autoSlug(sourceField = "title") {
  return function (schema: Schema): void {
    schema.pre("validate", function (next) {
      const doc = this as unknown as Record<string, string>;
      if (!doc.slug && doc[sourceField]) {
        doc.slug = slugify(doc[sourceField], { lower: true, strict: true });
      }
      next();
    });
  };
}
