import { z } from "zod";

export const profileSchema = z
  .object({
    id: z.string().min(1),
    displayName: z.string().trim().min(1).max(80),
    avatarUrl: z.string().url().nullable(),
    bio: z.string().trim().max(280),
    createdAt: z.string().datetime(),
    updatedAt: z.string().datetime(),
  })
  .strict();

export type Profile = z.infer<typeof profileSchema>;
