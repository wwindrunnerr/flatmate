export const runtime = "nodejs";

import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { User, Avatar } from "@/models/user";

const filePath = path.join(process.cwd(), "app/api/data/users.json");

export async function POST(req: Request) {
    try {
        const { name, age, gender, email, password } = await req.json();

        if (!name || !email || !password) {
            return NextResponse.json({ error: "Felder fehlen" }, { status: 400 });
        }


        const users = JSON.parse(fs.readFileSync(filePath, "utf8") || "[]");

        if (users.some((u: any) => u.email === email)) {
            return NextResponse.json({ error: "Benutzer existiert" }, { status: 409 });
        }

        const newUser = new User(name, age, gender, email);
        (newUser as any).password = password;

        users.push(newUser);
        fs.writeFileSync(filePath, JSON.stringify(users, null, 2), "utf8");

        return NextResponse.json({
            success: true,
            message: "Benutzer gespeichert",
            user: newUser,
        });
    } catch (err: any) {
        console.error("REGISTER ERROR:", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
