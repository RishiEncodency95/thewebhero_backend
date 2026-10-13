import { Field, FieldMap } from "./fields";
import { seoFields } from "./seo";

// JSON description of a field map for the admin form renderer.
export interface FieldDescription {
  key: string;
  type: Field["type"];
  label: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  group?: string;
  options?: { value: string; label: string }[];
  from?: string;
  resource?: string;
  itemLabel?: string;
  rows?: number;
  max?: number;
  min?: number;
  of?: FieldDescription[];
}

export function describeFields(fields: FieldMap): FieldDescription[] {
  return Object.entries(fields).map(([key, field]) => {
    const { type, label, help, placeholder, required, group } = field;
    const out: FieldDescription = { key, type, label, help, placeholder, required, group };

    if (field.type === "select") out.options = field.options;
    if (field.type === "slug") out.from = field.from;
    if (field.type === "refs") {
      out.resource = field.resource;
      out.max = field.max;
    }
    if (field.type === "textarea") out.rows = field.rows;
    if ("max" in field && typeof field.max === "number") out.max = field.max;
    if (field.type === "number") out.min = field.min;
    if (field.type === "list") {
      out.of = describeFields(field.of);
      out.itemLabel = field.itemLabel;
    }
    if (field.type === "object") out.of = describeFields(field.of);
    if (field.type === "seo") out.of = describeFields(seoFields);

    // Drop undefined keys to keep the payload small.
    return Object.fromEntries(Object.entries(out).filter(([, v]) => v !== undefined)) as FieldDescription;
  });
}
