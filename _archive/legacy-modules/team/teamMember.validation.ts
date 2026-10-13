import { z } from "zod";

export const createTeamMemberSchema = z.object({
  name: z.string().min(1).max(100),
  designation: z.string().min(1).max(100),
  photo: z.string().url().optional(),
  bio: z.string().optional(),
  socialLinks: z
    .object({
      linkedin: z.string().url().optional(),
      twitter: z.string().url().optional(),
      github: z.string().url().optional(),
    })
    .optional(),
  status: z.enum(["draft", "published"]).default("draft"),
  order: z.number().default(0),
});

export const updateTeamMemberSchema = createTeamMemberSchema.partial();
