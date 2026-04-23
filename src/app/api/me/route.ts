import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
    try {
        const sessionUser = await getSessionUser();

        if (!sessionUser) {
            return NextResponse.json(
                { error: "Nicht eingeloggt" },
                { status: 401 }
            );
        }

        const user = await prisma.user.findUnique({
            where: { id: sessionUser.id },
            select: {
                id: true,
                name: true,
                email: true,
                birthDate: true,
                avatarUrl: true,
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Benutzer nicht gefunden" },
                { status: 404 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("ME_GET_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

export async function PATCH(req: Request) {
    try {
        const sessionUser = await getSessionUser();

        if (!sessionUser) {
            return NextResponse.json(
                { error: "Nicht eingeloggt" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const { birthDate } = body as { birthDate?: string | null };

        let parsedBirthDate: Date | null = null;

        if (birthDate) {
            const date = new Date(birthDate);

            if (Number.isNaN(date.getTime())) {
                return NextResponse.json(
                    { error: "Ungültiges Geburtsdatum" },
                    { status: 400 }
                );
            }

            parsedBirthDate = date;
        }

        const updatedUser = await prisma.user.update({
            where: { id: sessionUser.id },
            data: {
                birthDate: parsedBirthDate,
            },
            select: {
                id: true,
                name: true,
                email: true,
                birthDate: true,
                avatarUrl: true,
            },
        });

        return NextResponse.json({
            success: true,
            user: updatedUser,
        });
    } catch (error) {
        console.error("ME_PATCH_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}