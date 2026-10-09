import { z } from "zod";
import { ACTIONS, RESOURCES } from "../../config/constants";

const permissionString = z
  .string()
  .refine(
    (val) => {
      const [resource, action] = val.split(":");
      return (RESOURCES as readonly string[]).includes(resource) && (ACTIONS as readonly string[]).includes(action);
    },
    { message: "Invalid permission format. Use resource:action" }
  );

export const createRoleSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().max(200).optional(),
  permissions: z.array(permissionString).default([]),
});

export const updateRoleSchema = createRoleSchema.partial();

export type CreateRoleInput = z.infer<typeof createRoleSchema>;
export type UpdateRoleInput = z.infer<typeof updateRoleSchema>;
