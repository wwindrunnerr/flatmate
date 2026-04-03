import { z } from "zod";

export const registerSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(8).max(128),
    name: z.string().trim().min(2).max(50),
    birthDate: z
        .string()
        .regex(/^\d{2}\.\d{2}\.\d{4}$/, "Datum muss im Format TT.MM.JJJJ sein")
        .optional()
        .or(z.literal("")),
});