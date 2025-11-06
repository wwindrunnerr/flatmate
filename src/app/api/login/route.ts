import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const filePath = path.join(process.cwd(), "app/api/data/users.json");

export async function POST(request: Request) {
    const { email, password } = await request.json();

    if (!email || !password) {
        return NextResponse.json({ error: "Fehlende Felder" }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: "Keine Nutzer" }, { status: 404 });
    }

    const users = JSON.parse(fs.readFileSync(filePath, "utf8"));
    const found = users.find((user: any) => user.email === email && user.password === password);

    if (!found) {
        return NextResponse.json({ error: "Falsche Daten" }, { status: 401 });
    }

    return NextResponse.json({ success: true, user: found });
}
