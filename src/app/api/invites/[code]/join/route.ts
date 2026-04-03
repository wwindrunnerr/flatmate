import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function POST(
    _req: Request,
    context: { params: Promise<{ code: string }> }
) {
    try {
        const user = await getSessionUser();

        if (!user) {
            return NextResponse.json(
                { error: "Nicht eingeloggt" },
                { status: 401 }
            );
        }

        const { code } = await context.params;

        const invite = await prisma.invite.findUnique({
            where: { code },
            include: {
                wg: true,
            },
        });

        if (!invite) {
            return NextResponse.json(
                { error: "Einladung nicht gefunden" },
                { status: 404 }
            );
        }

        if (invite.expiresAt && invite.expiresAt < new Date()) {
            return NextResponse.json(
                { error: "Einladung ist abgelaufen" },
                { status: 400 }
            );
        }

        if (invite.maxUses !== null && invite.usedCount >= invite.maxUses) {
            return NextResponse.json(
                { error: "Einladung wurde zu oft verwendet" },
                { status: 400 }
            );
        }

        const existingMembership = await prisma.membership.findFirst({
            where: {
                userId: user.id,
                wgId: invite.wgId,
            },
        });

        if (existingMembership) {
            return NextResponse.json(
                { error: "Du bist bereits Mitglied dieser WG" },
                { status: 400 }
            );
        }

        await prisma.$transaction(async (tx) => {
            await tx.membership.create({
                data: {
                    userId: user.id,
                    wgId: invite.wgId,
                    role: "MEMBER",
                },
            });

            await tx.invite.update({
                where: { id: invite.id },
                data: {
                    usedCount: {
                        increment: 1,
                    },
                },
            });
        });

        return NextResponse.json({
            success: true,
            wg: {
                id: invite.wg.id,
                title: invite.wg.title,
            },
        });
    } catch (error) {
        console.error("JOIN_INVITE_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}