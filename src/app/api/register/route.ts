import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";
import { registerSchema } from "@/lib/validation/auth";

function parseGermanDate(value: string): Date | null {
    const match = value.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);

    if (!match) return null;

    const [, day, month, year] = match;
    const iso = `${year}-${month}-${day}T00:00:00`;
    const date = new Date(iso);

    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = registerSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Ungültige Eingaben",
                    fields: parsed.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { email, password, name, birthDate } = parsed.data;

        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            return NextResponse.json(
                {
                    error: "Benutzer konnte nicht erstellt werden",
                    fields: {
                        email: ["Diese E-Mail ist bereits registriert"],
                    },
                },
                { status: 409 }
            );
        }

        const normalizedBirthDate =
            birthDate && birthDate !== "" ? parseGermanDate(birthDate) : null;

        if (birthDate && !normalizedBirthDate) {
            return NextResponse.json(
                {
                    error: "Ungültige Eingaben",
                    fields: {
                        birthDate: ["Datum muss im Format TT.MM.JJJJ sein"],
                    },
                },
                { status: 400 }
            );
        }

        const passwordHash = await bcrypt.hash(password, 12);

        const user = await prisma.user.create({
            data: {
                email,
                passwordHash,
                name,
                birthDate: normalizedBirthDate,
            },
            select: {
                id: true,
                email: true,
                name: true,
                birthDate: true,
                avatarUrl: true,
                createdAt: true,
            },
        });

        await createSession(user.id);

        return NextResponse.json(
            {
                success: true,
                user,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("REGISTER_ERROR", error);

        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}