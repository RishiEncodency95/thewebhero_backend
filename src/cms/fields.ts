// Field DSL for CMS content types.
//
// A content type's fields are declared ONCE (see src/content/*.ts). From that
// single declaration the CMS builds:
//   - the Mongoose schema          (cms/mongoose.ts)
//   - the Zod request validators   (cms/validation.ts)
//   - the admin form description   (cms/describe.ts -> GET /content-types)
// so the database, the API and the admin forms can never drift apart.

interface BaseField {
  label: string;
  help?: string;
  placeholder?: string;
  required?: boolean;
  /** Admin form tab, e.g. "Content", "Details". Defaults to "General". */
  group?: string;
}

export interface TextField extends BaseField {
  type: "text";
  max?: number;
}
export interface TextareaField extends BaseField {
  type: "textarea";
  max?: number;
  rows?: number;
}
/** Long-form content written in Markdown (blog posts, legal pages). */
export interface MarkdownField extends BaseField {
  type: "markdown";
  max?: number;
}
export interface NumberField extends BaseField {
  type: "number";
  min?: number;
  max?: number;
  integer?: boolean;
}
export interface BooleanField extends BaseField {
  type: "boolean";
}
export interface SelectField extends BaseField {
  type: "select";
  options: { value: string; label: string }[];
}
export interface SlugField extends BaseField {
  type: "slug";
  /** Field the slug is generated from when left empty. */
  from: string;
}
export interface UrlField extends BaseField {
  type: "url";
}
export interface EmailField extends BaseField {
  type: "email";
}
/** Image URL; the admin offers upload to the media library + preview. */
export interface ImageField extends BaseField {
  type: "image";
}
/** Lucide icon name, e.g. "Layers". */
export interface IconField extends BaseField {
  type: "icon";
}
/** ISO date, "YYYY-MM-DD". */
export interface DateField extends BaseField {
  type: "date";
}
export interface StringListField extends BaseField {
  type: "stringList";
  max?: number;
  itemMax?: number;
}
/** Repeatable group of fields, e.g. FAQs or process steps. */
export interface ListField extends BaseField {
  type: "list";
  of: FieldMap;
  /** Key whose value titles each row in the admin, e.g. "question". */
  itemLabel?: string;
  max?: number;
}
export interface ObjectField extends BaseField {
  type: "object";
  of: FieldMap;
}
/** Ordered slugs of other content (e.g. related services). Public reads populate them. */
export interface RefsField extends BaseField {
  type: "refs";
  resource: string;
  max?: number;
}
/** Standard on-page SEO block (title, description, OG, robots, schema...). */
export interface SeoField extends BaseField {
  type: "seo";
}

export type Field =
  | TextField
  | TextareaField
  | MarkdownField
  | NumberField
  | BooleanField
  | SelectField
  | SlugField
  | UrlField
  | EmailField
  | ImageField
  | IconField
  | DateField
  | StringListField
  | ListField
  | ObjectField
  | RefsField
  | SeoField;

export type FieldMap = Record<string, Field>;

type Opts<F extends Field> = Omit<F, "type">;
const opts = (o: string | object) => (typeof o === "string" ? { label: o } : o);

/** Field builders. Pass a label string, or an options object. */
export const f = {
  text: (o: string | Opts<TextField>): TextField => ({ type: "text", ...opts(o) }) as TextField,
  textarea: (o: string | Opts<TextareaField>): TextareaField => ({ type: "textarea", ...opts(o) }) as TextareaField,
  markdown: (o: string | Opts<MarkdownField>): MarkdownField => ({ type: "markdown", ...opts(o) }) as MarkdownField,
  number: (o: string | Opts<NumberField>): NumberField => ({ type: "number", ...opts(o) }) as NumberField,
  boolean: (o: string | Opts<BooleanField>): BooleanField => ({ type: "boolean", ...opts(o) }) as BooleanField,
  select: (o: Opts<SelectField> | (Omit<Opts<SelectField>, "options"> & { options: string[] })): SelectField => ({
    type: "select",
    ...o,
    options: o.options.map((v) => (typeof v === "string" ? { value: v, label: v } : v)),
  }),
  slug: (o: Opts<SlugField>): SlugField => ({ type: "slug", ...o }),
  url: (o: string | Opts<UrlField>): UrlField => ({ type: "url", ...opts(o) }) as UrlField,
  email: (o: string | Opts<EmailField>): EmailField => ({ type: "email", ...opts(o) }) as EmailField,
  image: (o: string | Opts<ImageField>): ImageField => ({ type: "image", ...opts(o) }) as ImageField,
  icon: (o: string | Opts<IconField>): IconField => ({ type: "icon", ...opts(o) }) as IconField,
  date: (o: string | Opts<DateField>): DateField => ({ type: "date", ...opts(o) }) as DateField,
  stringList: (o: string | Opts<StringListField>): StringListField => ({ type: "stringList", ...opts(o) }) as StringListField,
  list: (o: Opts<ListField>): ListField => ({ type: "list", ...o }),
  object: (o: Opts<ObjectField>): ObjectField => ({ type: "object", ...o }),
  refs: (o: Opts<RefsField>): RefsField => ({ type: "refs", ...o }),
  seo: (o: string | Opts<SeoField> = "SEO"): SeoField => ({ type: "seo", group: "SEO", ...opts(o) }) as SeoField,
};

// ── Reusable field groups shared by several content types ─────────────────

export const titleDescriptionItem = (titleLabel = "Title"): FieldMap => ({
  title: f.text({ label: titleLabel, required: true, max: 200 }),
  description: f.textarea({ label: "Description", max: 2000 }),
});

export const processStepItem: FieldMap = {
  step: f.number({ label: "Step #", integer: true, min: 1, max: 50 }),
  title: f.text({ label: "Title", required: true, max: 200 }),
  description: f.textarea({ label: "Description", max: 2000 }),
};

export const faqItem: FieldMap = {
  question: f.text({ label: "Question", required: true, max: 300 }),
  answer: f.textarea({ label: "Answer", required: true, max: 4000 }),
};

export const integrationItem: FieldMap = {
  name: f.text({ label: "Name", required: true, max: 120 }),
  type: f.text({ label: "Type", max: 120 }),
  description: f.textarea({ label: "Description", max: 1000 }),
};
