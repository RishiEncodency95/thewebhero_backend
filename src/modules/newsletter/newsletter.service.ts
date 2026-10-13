import { Subscriber, ISubscriber } from "./subscriber.model";
import { ApiError } from "../../common/utils/ApiError";
import { getPagination, buildMeta } from "../../common/utils/pagination";
import { generateRandomToken } from "../../common/utils/tokens";
import { Request } from "express";

export const newsletterService = {
  async subscribe(email: string): Promise<ISubscriber> {
    const existing = await Subscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      if (existing.isActive) throw ApiError.conflict("This email is already subscribed");
      existing.isActive = true;
      await existing.save();
      return existing;
    }

    const { raw } = generateRandomToken();
    return Subscriber.create({ email: email.toLowerCase(), unsubscribeToken: raw });
  },

  async unsubscribe(token: string): Promise<void> {
    const subscriber = await Subscriber.findOne({ unsubscribeToken: token });
    if (!subscriber) throw ApiError.notFound("Invalid unsubscribe link");
    subscriber.isActive = false;
    await subscriber.save();
  },

  async getAll(req: Request) {
    const { page, limit, skip, sort } = getPagination(req);
    const filter: Record<string, unknown> = {};
    if (req.query.isActive !== undefined) filter.isActive = req.query.isActive === "true";
    const search = typeof req.query.search === "string" ? req.query.search.trim().slice(0, 100) : "";
    if (search) filter.email = { $regex: search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };

    const [items, total] = await Promise.all([
      Subscriber.find(filter).sort(sort).skip(skip).limit(limit),
      Subscriber.countDocuments(filter),
    ]);
    return { items, meta: buildMeta(total, page, limit) };
  },

  async remove(id: string): Promise<void> {
    const doc = await Subscriber.findByIdAndDelete(id);
    if (!doc) throw ApiError.notFound("Subscriber not found");
  },
};
