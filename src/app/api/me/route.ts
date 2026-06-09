import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { hash } from "bcryptjs";

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
        const { name, birthDate, password } = body;
        
        const updateData: any = {};

        // 1. Namen aktualisieren
        if (name !== undefined) {
            if (name.trim() === "") {
                return NextResponse.json({ error: "Der Name darf nicht leer sein" }, { status: 400 });
            }
            updateData.name = name.trim();
        }

        // 2. Geburtsdatum aktualisieren
        if (birthDate !== undefined) {
            updateData.birthDate = birthDate ? new Date(birthDate) : null;
        }

        // 3. Passwort aktualisieren
        if (password) {
            if (password.length < 6) {
                return NextResponse.json({ error: "Das Passwort muss mindestens 6 Zeichen lang sein" }, { status: 400 });
            }
            updateData.password = await hash(password, 10);
        }

        if (Object.keys(updateData).length === 0) {
             return NextResponse.json({ error: "Keine Daten zum Aktualisieren gefunden" }, { status: 400 });
        }

        const updatedUser = await prisma.user.update({
            where: { id: sessionUser.id },
            data: updateData,
            select: { id: true, name: true, birthDate: true }
        });

        return NextResponse.json({ user: updatedUser });
    } catch (error) {
        console.error("UPDATE_PROFILE_ERROR", error);
        return NextResponse.json(
            { error: "Fehler beim Speichern in der Datenbank" },
            { status: 500 }
        );
    }
}