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

        const currentMembership = await prisma.membership.findFirst({
            where: {
                userId: user.id,
                wgId,
            },
        });

        if (!currentMembership) {
            return NextResponse.json(
                { error: "Du bist kein Mitglied dieser WG" },
                { status: 404 }
            );
        }

        const allMemberships = await prisma.membership.findMany({
            where: { wgId },
            orderBy: {
                joinedAt: "asc",
            },
        });

        const otherMemberships = allMemberships.filter(
            (membership) => membership.userId !== user.id
        );

        // Fall 1: letzter Teilnehmer -> WG komplett löschen
        if (otherMemberships.length === 0) {
            await prisma.wG.delete({
                where: { id: wgId },
            });

            return NextResponse.json({
                success: true,
                message: "Du warst das letzte Mitglied. Die WG wurde gelöscht.",
                deletedWG: true,
            });
        }

        // Fall 2: normaler Member -> nur Membership löschen
        if (currentMembership.role === "MEMBER") {
            await prisma.membership.delete({
                where: {
                    id: currentMembership.id,
                },
            });

            return NextResponse.json({
                success: true,
                message: "Du hast die WG verlassen.",
            });
        }

        // Fall 3: Admin verlässt WG
        const otherAdmins = otherMemberships.filter(
            (membership) => membership.role === "ADMIN"
        );

        await prisma.$transaction(async (tx) => {
            // Wenn kein anderer Admin da ist, befördere das früheste andere Mitglied
            if (otherAdmins.length === 0) {
                const nextAdmin = otherMemberships[0];

                await tx.membership.update({
                    where: {
                        id: nextAdmin.id,
                    },
                    data: {
                        role: "ADMIN",
                    },
                });
            }

            // Danach aktuellen Nutzer entfernen
            await tx.membership.delete({
                where: {
                    id: currentMembership.id,
                },
            });
        });

        return NextResponse.json({
            success: true,
            message: "Du hast die WG verlassen.",
        });
    } catch (error) {
        console.error("WG_LEAVE_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}