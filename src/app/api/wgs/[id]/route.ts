import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function GET(
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

        const { id } = await context.params;

        const membership = await prisma.membership.findFirst({
            where: {
                userId: user.id,
                wgId: id,
                wg: {
                    deletedAt: null,
                },
            },
            include: {
                wg: {
                    select: {
                        id: true,
                        title: true,
                        description: true,
                        createdAt: true,
                        updatedAt: true,
                        memberships: {
                            select: {
                                id: true,
                                role: true,
                                joinedAt: true,
                                user: {
                                    select: {
                                        id: true,
                                        name: true,
                                        email: true,
                                        avatarUrl: true,
                                    },
                                },
                            },
                            orderBy: {
                                joinedAt: "asc",
                            },
                        },
                    },
                },
            },
        });

        if (!membership) {
            return NextResponse.json(
                { error: "WG nicht gefunden oder kein Zugriff" },
                { status: 404 }
            );
        }

        return NextResponse.json({
            success: true,
            wg: {
                id: membership.wg.id,
                title: membership.wg.title,
                description: membership.wg.description,
                createdAt: membership.wg.createdAt,
                updatedAt: membership.wg.updatedAt,
                currentUserRole: membership.role,
                members: membership.wg.memberships.map((member) => ({
                    id: member.user.id,
                    name: member.user.name,
                    email: member.user.email,
                    avatarUrl: member.user.avatarUrl,
                    role: member.role,
                    joinedAt: member.joinedAt,
                })),
            },
        });
    } catch (error) {
        console.error("WG_BY_ID_GET_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

export async function DELETE(
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

        const { id } = await context.params;

        const membership = await prisma.membership.findFirst({
            where: {
                userId: user.id,
                wgId: id,
            },
        });

        if (!membership) {
            return NextResponse.json(
                { error: "WG nicht gefunden oder kein Zugriff" },
                { status: 404 }
            );
        }

        if (membership.role !== "ADMIN") {
            return NextResponse.json(
                { error: "Nur Admins dürfen die WG löschen" },
                { status: 403 }
            );
        }

        await prisma.wG.delete({
            where: { id },
        });

        return NextResponse.json({
            success: true,
            message: "WG wurde endgültig gelöscht.",
        });
    } catch (error) {
        console.error("WG_DELETE_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}