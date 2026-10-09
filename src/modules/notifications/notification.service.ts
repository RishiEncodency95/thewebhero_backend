import { Notification, INotification } from "./notification.model";
import { ApiError } from "../../common/utils/ApiError";
import { getPagination, buildMeta } from "../../common/utils/pagination";
import { Request } from "express";

export const notificationService = {
  // Called internally by other modules (e.g. new lead submitted) - not exposed via a public route.
  async notify(recipient: string, title: string, message: string, link?: string): Promise<INotification> {
    return Notification.create({ recipient, title, message, link });
  },

  async getForUser(req: Request, userId: string) {
    const { page, limit, skip, sort } = getPagination(req);
    const filter: Record<string, unknown> = { recipient: userId };
    if (req.query.unreadOnly === "true") filter.isRead = false;

    const [items, total, unreadCount] = await Promise.all([
      Notification.find(filter).sort(sort).skip(skip).limit(limit),
      Notification.countDocuments(filter),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);

    return { items, meta: buildMeta(total, page, limit), unreadCount };
  },

  async markAsRead(id: string, userId: string): Promise<void> {
    const notification = await Notification.findOne({ _id: id, recipient: userId });
    if (!notification) throw ApiError.notFound("Notification not found");
    notification.isRead = true;
    await notification.save();
  },

  async markAllAsRead(userId: string): Promise<void> {
    await Notification.updateMany({ recipient: userId, isRead: false }, { isRead: true });
  },
};
