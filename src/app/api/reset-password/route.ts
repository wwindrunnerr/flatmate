import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hash } from "bcryptjs";

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, password } = body;

        // 1. Prüfen, ob Token und Passwort vorhanden sind
        if (!token) {
            return NextResponse.json({ error: "Kein Token übergeben." }, { status: 400 });
        }

        if (!password || password.length < 6) {
            return NextResponse.json({ error: "Das Passwort muss mindestens 6 Zeichen lang sein." }, { status: 400 });
        }

        // 2. User anhand des Tokens suchen und prüfen, ob es noch nicht abgelaufen ist
        const user = await prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date() // Token-Ablaufdatum muss in der Zukunft liegen
                }
            }
        });

        if (!user) {
            return NextResponse.json(
                { error: "Dieser Reset-Link ist ungültig oder bereits abgelaufen." }, 
                { status: 400 }
            );
        }

        // 3. Neues Passwort sicher verschlüsseln
        const hashedPassword = await hash(password, 10);

        // 4. Passwort in der DB updaten und das Token löschen, damit es verfällt
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordHash: hashedPassword, // HIER IST DIE WICHTIGE ÄNDERUNG!
                resetToken: null,
                resetTokenExpiry: null
            }
        });

        return NextResponse.json({ success: true });

    } catch (error) {
        console.error("PASSWORD_RESET_ERROR", error);
        return NextResponse.json(
            { error: "Ein unerwarteter Fehler ist aufgetreten." }, 
            { status: 500 }
        );
    }
}