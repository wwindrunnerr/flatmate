import { z } from "zod";

export const createEventSchema = z.object({
    title: z.string().trim().min(1, "Titel ist erforderlich").max(100),
    description: z.string().trim().max(500).optional().default(""),
    startsAt: z.string().min(1, "Datum ist erforderlich"),
});