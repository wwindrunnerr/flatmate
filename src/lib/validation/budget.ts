import { z } from "zod";

export const createExpenseSchema = z.object({
    description: z.string().trim().min(1, "Beschreibung ist erforderlich").max(120),
    amountCents: z.number().int().positive("Betrag muss größer als 0 sein"),
    participantUserIds: z
        .array(z.string().min(1))
        .min(1, "Mindestens ein Teilnehmer muss ausgewählt werden"),
});

export const updateExpenseSchema = createExpenseSchema;