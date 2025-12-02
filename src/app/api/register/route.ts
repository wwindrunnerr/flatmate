import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

const filePath = path.join(process.cwd(), "app/api/data/users.json");

export async function POST(req: Request) {
    const { name, age, gender, email, password } = await req.json();

    const users = JSON.parse(fs.readFileSync(filePath, "utf8") || "[]");

    if (users.some((u: any) => u.email === email)) {
        return NextResponse.json({ error: "Benutzer existiert" }, { status: 409 });
    }

    const newUser = {
        id: randomUUID(),
        name,
        age,
        gender,
        email,
        password,
        wgIds: [],
        invitations: []
    };

    users.push(newUser);

    fs.writeFileSync(filePath, JSON.stringify(users, null, 2));

    return NextResponse.json({ success: true, user: newUser });
}
