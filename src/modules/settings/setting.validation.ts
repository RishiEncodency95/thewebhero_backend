import { z } from "zod";

export const updateSettingSchema = z.object({
  siteName: z.string().min(1).optional(),
  logo: z.string().url().optional(),
  favicon: z.string().url().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  address: z.string().optional(),
  socialLinks: z
    .object({
      facebook: z.string().url().optional(),
      twitter: z.string().url().optional(),
      linkedin: z.string().url().optional(),
      instagram: z.string().url().optional(),
      youtube: z.string().url().optional(),
    })
    .optional(),
  defaultSeo: z
    .object({
      title: z.string().optional(),
      description: z.string().optional(),
      ogImage: z.string().url().optional(),
    })
    .optional(),
  maintenanceMode: z.boolean().optional(),
});

export type UpdateSettingInput = z.infer<typeof updateSettingSchema>;
