import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
    try {
        const user = await getSessionUser();

        if (!user) {
            return NextResponse.json(
                { error: "Nicht eingeloggt" },
                { status: 401 }
            );
        }

        const memberships = await prisma.membership.findMany({
            where: {
                userId: user.id,
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
                    },
                },
            },
            orderBy: {
                joinedAt: "asc",
            },
        });

        const wgs = memberships.map((membership) => ({
            id: membership.wg.id,
            title: membership.wg.title,
            description: membership.wg.description,
            createdAt: membership.wg.createdAt,
            updatedAt: membership.wg.updatedAt,
            role: membership.role,
            joinedAt: membership.joinedAt,
        }));

        return NextResponse.json({ wgs });
    } catch (error) {
        console.error("WGS_GET_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}