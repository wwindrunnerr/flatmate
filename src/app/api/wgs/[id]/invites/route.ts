import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getSessionUser();

        if (!user) {
            return NextResponse.json(
                { error: "Nicht eingeloggt" },
                { status: 401 }
            );
        }

        const { id: wgId } = await context.params;

        const membership = await prisma.membership.findFirst({
            where: {
                userId: user.id,
                wgId,
            },
        });

        if (!membership) {
            return NextResponse.json(
                { error: "Kein Zugriff auf diese WG" },
                { status: 403 }
            );
        }

        if (membership.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Nur Admins dürfen Einladungen erstellen" },
                { status: 403 }
            );
        }

        const code = randomUUID();

        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7);

        const invite = await prisma.invite.create({
            data: {
                code,
                wgId,
                createdById: user.id,
                expiresAt,
                maxUses: 20,
            },
        });

        return NextResponse.json({
            success: true,
            invite: {
                id: invite.id,
                code: invite.code,
                expiresAt: invite.expiresAt,
                maxUses: invite.maxUses,
            },
        });
    } catch (error) {
        console.error("CREATE_INVITE_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}