import { NextResponse } from "next/server";
import { deleteSession } from "@/lib/auth/session";

export async function POST() {
    try {
        await deleteSession();
        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("LOGOUT_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}