import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
    try {
        const user = await getSessionUser();

        if (!user) {
            return NextResponse.json(
                { error: "Nicht eingeloggt" },
                { status: 401 }
            );
        }

        return NextResponse.json({ user });
    } catch (error) {
        console.error("ME_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}