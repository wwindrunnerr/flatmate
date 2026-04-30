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
            where: {
                id: sessionUser.id,
            },
            select: {
                id: true,
                name: true,
                email: true,
                birthDate: true,
                memberships: {
                    orderBy: {
                        joinedAt: "asc",
                    },
                    select: {
                        id: true,
                        role: true,
                        wg: {
                            select: {
                                id: true,
                                title: true,
                                deletedAt: true,
                            },
                        },
                    },
                },
            },
        });

        if (!user) {
            return NextResponse.json(
                { error: "Benutzer nicht gefunden" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                birthDate: user.birthDate,
                memberships: user.memberships
                    .filter((membership) => membership.wg.deletedAt === null)
                    .map((membership) => ({
                        id: membership.id,
                        role: membership.role,
                        wg: {
                            id: membership.wg.id,
                            title: membership.wg.title,
                        },
                    })),
            },
        });
    } catch (error) {
        console.error("ME_ERROR", error);
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
            return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
        }

        const body = await req.json();
        
        // Falls ein Datum kommt, umwandeln, sonst null (wenn der User es löscht)
        const parsedDate = body.birthDate ? new Date(body.birthDate) : null;

        const updatedUser = await prisma.user.update({
            where: { id: sessionUser.id },
            data: { birthDate: parsedDate },
            select: { id: true, birthDate: true }
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        // HIER WIRD DER FEHLER IM TERMINAL ANGEZEIGT
        console.error("UPDATE_BIRTHDATE_ERROR", error);
        return NextResponse.json(
            { error: "Fehler beim Speichern in der Datenbank" },
            { status: 500 }
        );
    }
}