import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const usersPath = path.join(process.cwd(), "src/app/api/data/users.json");

export async function GET(req: Request) {
    const cookie = req.headers.get("cookie") || "";

    // Extract cookie & decode URL encoding (ww%40gmail.com → ww@gmail.com)
    let email = cookie.match(/user=([^;]+)/)?.[1];
    if (email) {
        email = decodeURIComponent(email);
    }

    if (!email) {
        return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    const users = JSON.parse(fs.readFileSync(usersPath, "utf8"));
    const user = users.find((u: any) => u.email === email);

    if (!user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
}
