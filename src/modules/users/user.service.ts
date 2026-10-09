import { User, IUser } from "./user.model";
import { Role } from "../roles/role.model";
import { ApiError } from "../../common/utils/ApiError";
import { getPagination, buildMeta } from "../../common/utils/pagination";
import { Request } from "express";
import { CreateUserInput, UpdateUserInput } from "./user.validation";

const resolveRole = async (roleIdOrName: string) => {
  const isObjectId = /^[a-f\d]{24}$/i.test(roleIdOrName);
  const role = isObjectId
    ? await Role.findById(roleIdOrName)
    : await Role.findOne({ name: roleIdOrName.toLowerCase() });

  if (!role) throw ApiError.badRequest("Invalid role");
  return role;
};

export const userService = {
  async create(data: CreateUserInput): Promise<IUser> {
    const existing = await User.findOne({ email: data.email.toLowerCase() });
    if (existing) throw ApiError.conflict("A user with this email already exists");

    const role = await resolveRole(data.role);

    return User.create({
      name: data.name,
      email: data.email.toLowerCase(),
      password: data.password,
      avatar: data.avatar,
      role: role._id,
    });
  },

  async getAll(req: Request) {
    const { page, limit, skip, sort } = getPagination(req);
    const filter: Record<string, unknown> = {};
    if (req.query.role) filter.role = req.query.role;
    if (req.query.search) {
      filter.$or = [
        { name: { $regex: req.query.search, $options: "i" } },
        { email: { $regex: req.query.search, $options: "i" } },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter).populate("role", "name permissions").sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return { items, meta: buildMeta(total, page, limit) };
  },

  async getById(id: string): Promise<IUser> {
    const user = await User.findById(id).populate("role", "name permissions");
    if (!user) throw ApiError.notFound("User not found");
    return user;
  },

  async update(id: string, data: UpdateUserInput): Promise<IUser> {
    const user = await User.findById(id);
    if (!user) throw ApiError.notFound("User not found");

    if (data.role) {
      const role = await resolveRole(data.role);
      user.role = role._id;
    }
    if (data.name !== undefined) user.name = data.name;
    if (data.avatar !== undefined) user.avatar = data.avatar;
    if (data.isActive !== undefined) user.isActive = data.isActive;

    await user.save();
    return user;
  },

  async remove(id: string, requesterId: string): Promise<void> {
    if (id === requesterId) throw ApiError.badRequest("You cannot delete your own account");
    const user = await User.findByIdAndDelete(id);
    if (!user) throw ApiError.notFound("User not found");
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string): Promise<void> {
    const user = await User.findById(userId).select("+password");
    if (!user) throw ApiError.notFound("User not found");

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw ApiError.badRequest("Current password is incorrect");

    user.password = newPassword;
    await user.save();
  },
};
