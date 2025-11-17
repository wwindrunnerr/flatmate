import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const wgsPath = path.join(process.cwd(), "app/api/data/wgs.json");

export async function GET(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    // ⬅️ params MUST be awaited
    const { id } = await context.params;

    // Get cookie
    const cookieHeader = req.headers.get("cookie") || "";
    let email = cookieHeader.match(/user=([^;]+)/)?.[1];
    if (email) email = decodeURIComponent(email);

    if (!email) {
        return NextResponse.json({ error: "Not logged in" }, { status: 401 });
    }

    // Load WGs
    const wgs = JSON.parse(fs.readFileSync(wgsPath, "utf8"));
    const wg = wgs.find((w: any) => w.id === id);

    if (!wg) {
        return NextResponse.json({ error: "WG not found" }, { status: 404 });
    }

    // Security: Check membership
    if (!wg.members.includes(email)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, wg });
}
