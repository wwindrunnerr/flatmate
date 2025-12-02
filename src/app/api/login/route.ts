import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "src/app/api/data/users.json"); // <--- FIXED PATH

export async function POST(request: Request) {
    const { email, password } = await request.json();

    if (!email || !password) {
        return NextResponse.json({ error: "Fehlende Felder" }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "Keine Nutzer" }, { status: 404 });
    }

    const users = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const found = users.find(
        (user: any) => user.email === email && user.password === password
    );

    if (!found) {
        return NextResponse.json({ error: "Falsche Daten" }, { status: 401 });
    }

    // -------------------------------
    //     FIX: SET SESSION COOKIE
    // -------------------------------
    const response = NextResponse.json({ success: true });

    response.cookies.set("user", found.email, {
        httpOnly: false,        // for now, so frontend can read it
        path: "/",
        sameSite: "lax",
    });

    return response;
}
