import { z } from "zod";

export const ExtractSchema = z.object({
  targetCompany: z.string().nullable(),
  targetRoleTitle: z.string().nullable(),

  jobKeywords: z.array(z.string()).default([]),

  requirements: z
    .array(
      z.object({
        requirement: z.string(),
        keywords: z.array(z.string()).default([]),
        evidence: z.array(z.string()).default([]),
        supportLevel: z.enum(["strong", "weak", "unsupported"]),
      })
    )
    .default([]),

  roles: z
    .array(
      z.object({
        title: z.string(),
        company: z.string(),
        location: z.string().nullable(),
        start: z.string().nullable(),
        end: z.string().nullable(),
        bullets: z.array(z.string()).default([]),
      })
    )
    .default([]),

  topAchievements: z.array(z.string()).default([]),

  education: z
    .array(
      z.object({
        degree: z.string(),
        field: z.string().nullable(),
        institution: z.string(),
        details: z.array(z.string()).default([]),
      })
    )
    .default([]),

  certifications: z
    .array(
      z.object({
        name: z.string(),
        issuer: z.string().nullable(),
        date: z.string().nullable(),
      })
    )
    .default([]),
  
  gaps: z.array(z.string()).default([]),
});
