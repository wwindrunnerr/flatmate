import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

const wgsPath = path.join(process.cwd(), "src/app/api/data/wgs.json");

export async function GET() {
    const wgs = JSON.parse(fs.readFileSync(wgsPath, "utf8"));
    return NextResponse.json({ wgs });
}
