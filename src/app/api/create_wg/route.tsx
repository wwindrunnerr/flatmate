import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { createWGSchema } from "@/lib/validation/wg";

export async function POST(req: Request) {
    try {
        const user = await getSessionUser();

        if (!user) {
            return NextResponse.json(
                { error: "Nicht eingeloggt" },
                { status: 401 }
            );
        }

        const body = await req.json();
        const parsed = createWGSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Ungültige Eingaben",
                    fields: parsed.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { title, description } = parsed.data;

        const wg = await prisma.$transaction(async (tx) => {
            const createdWG = await tx.wG.create({
                data: {
                    title,
                    description: description || null,
                },
            });

            await tx.membership.create({
                data: {
                    userId: user.id,
                    wgId: createdWG.id,
                    role: "ADMIN",
                },
            });

            return createdWG;
        });

        return NextResponse.json(
            {
                success: true,
                wg: {
                    id: wg.id,
                    title: wg.title,
                    description: wg.description,
                    createdAt: wg.createdAt,
                    updatedAt: wg.updatedAt,
                },
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("CREATE_WG_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}