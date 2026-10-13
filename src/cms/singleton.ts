import { Router, Request, Response } from "express";
import { Schema, model as createModel } from "mongoose";
import { asyncHandler } from "../common/utils/asyncHandler";
import { ApiResponse } from "../common/utils/ApiResponse";
import { authenticate } from "../common/middlewares/auth.middleware";
import { checkPermission } from "../common/middlewares/rbac.middleware";
import { validateBody } from "../common/middlewares/validate.middleware";
import { auditLog } from "../common/middlewares/auditLogger.middleware";
import { Resource } from "../config/constants";
import { FieldMap } from "./fields";
import { buildDefinition } from "./mongoose";
import { buildValidator } from "./validation";
import { contentRegistry } from "./registry";
import { revalidateFrontend } from "./revalidate";

export interface SingletonConfig {
  resource: Resource;
  modelName: string;
  label: string;
  description?: string;
  fields: FieldMap;
  /** Fields hidden from the public GET (e.g. internal notification emails). */
  privateFields?: string[];
}

// A content type with exactly one record (site settings, company info, home page).
export function defineSingleton<T extends object = Record<string, unknown>>(config: SingletonConfig) {
  const { resource } = config;
  const schema = new Schema({ ...buildDefinition(config.fields), key: { type: String, default: "main", unique: true } }, {
    timestamps: true,
    versionKey: false,
  });
  const Model = createModel(config.modelName, schema);
  const validator = buildValidator(config.fields).partial();

  /** Returns the single record, creating an empty one on first use. */
  async function get(): Promise<T> {
    const doc = await Model.findOneAndUpdate({ key: "main" }, { $setOnInsert: { key: "main" } }, { upsert: true, new: true });
    return doc.toObject() as T;
  }

  const read = asyncHandler(async (req: Request, res: Response) => {
    const data = (await get()) as Record<string, unknown>;
    const isStaff = Boolean(req.user);
    if (!isStaff) for (const key of config.privateFields ?? []) delete data[key];
    delete data.key;
    res.status(200).json(new ApiResponse(200, data));
  });

  const write = asyncHandler(async (req: Request, res: Response) => {
    const doc = await Model.findOne({ key: "main" });
    const target = doc ?? new Model({ key: "main" });
    target.set(req.body);
    await target.save();
    revalidateFrontend([resource]);
    const data = target.toObject() as Record<string, unknown>;
    delete data.key;
    res.status(200).json(new ApiResponse(200, data, `${config.label} saved`));
  });

  const router = Router();
  // Public read (private fields stripped); the admin reads through the
  // authenticated route so it sees everything.
  router.get("/", read);
  router.get("/admin", authenticate, checkPermission(resource, "read"), read);
  router.put("/", authenticate, checkPermission(resource, "update"), validateBody(validator), auditLog(resource, "update"), write);

  contentRegistry.register({
    resource,
    kind: "singleton",
    label: config.label,
    labelPlural: config.label,
    description: config.description,
    fields: config.fields,
    model: Model,
    titleField: "",
    slugField: null,
    listColumns: [],
    hasStatus: false,
  });

  return { Model, router, get };
}
