import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import crypto from "crypto";

export async function POST() {
    try {
        const sessionUser = await getSessionUser();

        if (!sessionUser) {
            return NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 });
        }

        // Token generieren und Ablaufzeit (z.B. 1 Stunde) festlegen
        const token = crypto.randomBytes(32).toString("hex");
        const expiry = new Date(Date.now() + 1000 * 60 * 60);

        // User updaten und Token speichern
        const user = await prisma.user.update({
            where: { id: sessionUser.id },
            data: {
                resetToken: token,
                resetTokenExpiry: expiry
            }
        });

        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
        const resetLink = `${baseUrl}/reset-password?token=${token}`;

        // ==========================================
        // HIER KOMMT DER ECHTE E-MAIL-VERSAND HIN
        // ==========================================
        // Da wir deine E-Mail-Konfiguration nicht kennen, geben wir es in die Konsole aus.
        // Sobald du z.B. Resend eingebaut hast, tauschst du das console.log gegen:
        // await resend.emails.send({ to: user.email, subject: "Passwort zurücksetzen", html: `<a href="${resetLink}">Passwort ändern</a>` });
        
        console.log(`\n\n=== E-MAIL SIMULATION ===`);
        console.log(`An: ${user.email}`);
        console.log(`Betreff: Passwort zurücksetzen`);
        console.log(`Link: ${resetLink}`);
        console.log(`=========================\n\n`);

        return NextResponse.json({ success: true, message: "E-Mail erfolgreich gesendet" });
    } catch (error) {
        console.error("RESET_LINK_ERROR", error);
        return NextResponse.json(
            { error: "Fehler beim Vorbereiten der E-Mail" },
            { status: 500 }
        );
    }
}