import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/auth/session";
import { z } from "zod";

const loginSchema = z.object({
    email: z.string().trim().toLowerCase().email(),
    password: z.string().min(1),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const parsed = loginSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Ungültige Eingaben",
                    fields: parsed.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { email, password } = parsed.data;

        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Ungültige E-Mail oder Passwort" },
                { status: 401 }
            );
        }

        const passwordMatches = await bcrypt.compare(password, user.passwordHash);

        if (!passwordMatches) {
            return NextResponse.json(
                { error: "Ungültige E-Mail oder Passwort" },
                { status: 401 }
            );
        }

        await createSession(user.id);

        return NextResponse.json({
            success: true,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                birthDate: user.birthDate,
                avatarUrl: user.avatarUrl,
                createdAt: user.createdAt,
            },
        });
    } catch (error) {
        console.error("LOGIN_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}