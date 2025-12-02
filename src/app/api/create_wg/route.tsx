import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

//
//  PATHS
//
const wgsPath = path.join(process.cwd(), "app/api/data/wgs.json");
const usersPath = path.join(process.cwd(), "app/api/data/users.json");

//
//  HELPERS
//
const readJSON = (p: string) => JSON.parse(fs.readFileSync(p, "utf8"));
const writeJSON = (p: string, data: any) =>
    fs.writeFileSync(p, JSON.stringify(data, null, 2), "utf8");

//
//  CREATE WG ROUTE
//
export async function POST(req: Request) {
    const body = await req.json();

    // 🔐 GET USER IDENTIFIER FROM COOKIE
    const cookieHeader = req.headers.get("cookie") || "";
    let email = cookieHeader.match(/user=([^;]+)/)?.[1];
    if (email) {
        email = decodeURIComponent(email);
    }


    if (!email) {
        return NextResponse.json(
            { success: false, error: "Not logged in" },
            { status: 401 }
        );
    }

    // LOAD DATA
    const wgs = readJSON(wgsPath);
    const users = readJSON(usersPath);

    // FIND USER
    const user = users.find((u: any) => u.email === email);
    if (!user) {
        return NextResponse.json(
            { success: false, error: "User not found" },
            { status: 404 }
        );
    }

    //
    //  CREATE NEW WG
    //
    const newWG = {
        id: randomUUID(),
        title: body.title,
        description: body.description,
        admin: email,
        members: [email],
        createdAt: Date.now(),
    };

    // SAVE WG
    wgs.push(newWG);
    writeJSON(wgsPath, wgs);

    //
    //  UPDATE USER → ADD WG ID
    //
    user.wgIds = user.wgIds || [];
    user.wgIds.push(newWG.id);

    writeJSON(usersPath, users);

    return NextResponse.json({ success: true, wg: newWG });
}
