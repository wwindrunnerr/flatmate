import { z } from "zod";

export const createWGSchema = z.object({
    title: z.string().trim().min(1, "Titel ist erforderlich").max(100),
    description: z.string().trim().max(500).optional().default(""),
});