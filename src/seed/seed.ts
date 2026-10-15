import { connectDB, disconnectDB } from "../config/db";
import { logger } from "../config/logger";
import { env } from "../config/env";
import { Role } from "../modules/roles/role.model";
import { User } from "../modules/users/user.model";
import { RESOURCES, ACTIONS, DEFAULT_ROLES } from "../config/constants";

const allPermissions = RESOURCES.flatMap((resource) => ACTIONS.map((action) => `${resource}:${action}`));

const CONTENT_RESOURCES = RESOURCES.filter(
  (r) => !["users", "roles", "audit-logs", "settings"].includes(r)
);
const editorPermissions = CONTENT_RESOURCES.flatMap((resource) => ACTIONS.map((action) => `${resource}:${action}`));
const viewerPermissions = RESOURCES.map((resource) => `${resource}:read`);

async function seed() {
  await connectDB();

  const superAdminRole = await Role.findOneAndUpdate(
    { name: DEFAULT_ROLES.SUPER_ADMIN },
    {
      name: DEFAULT_ROLES.SUPER_ADMIN,
      description: "Full access to everything",
      permissions: allPermissions,
      isSystem: true,
    },
    { upsert: true, new: true }
  );

  await Role.findOneAndUpdate(
    { name: DEFAULT_ROLES.EDITOR },
    {
      name: DEFAULT_ROLES.EDITOR,
      description: "Can manage content but not users, roles or settings",
      permissions: editorPermissions,
      isSystem: true,
    },
    { upsert: true, new: true }
  );

  await Role.findOneAndUpdate(
    { name: DEFAULT_ROLES.VIEWER },
    {
      name: DEFAULT_ROLES.VIEWER,
      description: "Read-only access",
      permissions: viewerPermissions,
      isSystem: true,
    },
    { upsert: true, new: true }
  );

  logger.info("Default roles seeded: super-admin, editor, viewer");

  const existingAdmin = await User.findOne({ email: env.SEED_ADMIN_EMAIL });
  if (existingAdmin) {
    logger.info(`Super admin already exists: ${env.SEED_ADMIN_EMAIL}`);
  } else {
    await User.create({
      name: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL,
      password: env.SEED_ADMIN_PASSWORD,
      role: superAdminRole!._id,
    });
    logger.info(`Super admin created -> ${env.SEED_ADMIN_EMAIL} / ${env.SEED_ADMIN_PASSWORD}`);
    logger.warn("Change this password immediately after first login.");
  }

  // Extra users from SEED_USERS="email|password|Name|role;..." - existing ones are left untouched.
  for (const entry of (env.SEED_USERS ?? "").split(";").map((e) => e.trim()).filter(Boolean)) {
    const [email, password, name, roleName = DEFAULT_ROLES.SUPER_ADMIN] = entry.split("|").map((p) => p.trim());
    if (!email || !password) {
      logger.warn(`Skipping SEED_USERS entry without email/password: ${email ?? "?"}`);
      continue;
    }
    const role = await Role.findOne({ name: roleName.toLowerCase() });
    if (!role) {
      logger.warn(`Skipping ${email}: unknown role "${roleName}"`);
      continue;
    }
    if (await User.exists({ email: email.toLowerCase() })) {
      logger.info(`User already exists: ${email}`);
      continue;
    }
    await User.create({ name: name || email.split("@")[0], email: email.toLowerCase(), password, role: role._id });
    logger.info(`User created -> ${email} (${role.name})`);
  }

  await disconnectDB();
  process.exit(0);
}

seed().catch((error) => {
  logger.error(error, "Seeding failed");
  process.exit(1);
});
