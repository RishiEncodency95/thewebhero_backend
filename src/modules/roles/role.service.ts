import { Role, IRole } from "./role.model";
import { User } from "../users/user.model";
import { DEFAULT_ROLES } from "../../config/constants";
import { ApiError } from "../../common/utils/ApiError";
import { CreateRoleInput, UpdateRoleInput } from "./role.validation";
import { RESOURCES, ACTIONS } from "../../config/constants";

export const roleService = {
  async create(data: CreateRoleInput): Promise<IRole> {
    const exists = await Role.findOne({ name: data.name.toLowerCase() });
    if (exists) throw ApiError.conflict("Role with this name already exists");
    return Role.create(data);
  },

  async getAll(): Promise<IRole[]> {
    return Role.find().sort({ createdAt: -1 });
  },

  async getById(id: string): Promise<IRole> {
    const role = await Role.findById(id);
    if (!role) throw ApiError.notFound("Role not found");
    return role;
  },

  async update(id: string, data: UpdateRoleInput): Promise<IRole> {
    const role = await Role.findById(id);
    if (!role) throw ApiError.notFound("Role not found");
    // Super admin always has every permission; other built-in roles can be
    // re-permissioned but keep their name so seeds and checks still find them.
    if (role.name === DEFAULT_ROLES.SUPER_ADMIN) throw ApiError.forbidden("The super admin role cannot be modified");
    if (role.isSystem && data.name && data.name.toLowerCase() !== role.name) throw ApiError.forbidden("Built-in roles cannot be renamed");

    Object.assign(role, data);
    await role.save();
    return role;
  },

  async remove(id: string): Promise<void> {
    const role = await Role.findById(id);
    if (!role) throw ApiError.notFound("Role not found");
    if (role.isSystem) throw ApiError.forbidden("System roles cannot be deleted");

    const usersWithRole = await User.countDocuments({ role: id });
    if (usersWithRole > 0) {
      throw ApiError.conflict("Cannot delete a role that is assigned to users");
    }

    await role.deleteOne();
  },

  // Returns the full permission matrix (all resources x actions) - used by the
  // admin's PermissionsMatrix.tsx to render checkboxes.
  getPermissionMatrix() {
    return { resources: RESOURCES, actions: ACTIONS };
  },
};
