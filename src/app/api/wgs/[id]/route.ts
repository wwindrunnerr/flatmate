import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const wgsPath = path.join(process.cwd(), "app/api/data/wgs.json");
const usersPath = path.join(process.cwd(), "app/api/data/users.json");

export async function GET(req: Request, { params }: { params: { id: string } }) {
    const { id } = params;

    // Get email from cookie
    const cookie = req.headers.get("cookie") || "";
    let email = cookie.match(/user=([^;]+)/)?.[1];
    if (email) email = decodeURIComponent(email);

    if (!email) {
        return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    // Load data
    const wgs = JSON.parse(fs.readFileSync(wgsPath, "utf8"));
    const wg = wgs.find((w: any) => w.id === id);

    if (!wg) {
        return NextResponse.json({ error: "WG not found" }, { status: 404 });
    }

    // 🔥 Security check: is user a member?
    if (!wg.members.includes(email)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, wg });
}
