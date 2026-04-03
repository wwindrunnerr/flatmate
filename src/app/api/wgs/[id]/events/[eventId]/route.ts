import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function DELETE(
    _req: Request,
    context: { params: Promise<{ id: string; eventId: string }> }
) {
    try {
        const user = await getSessionUser();

        if (!user) {
            return NextResponse.json(
                { error: "Nicht eingeloggt" },
                { status: 401 }
            );
        }

        const { id: wgId, eventId } = await context.params;

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

        const event = await prisma.event.findFirst({
            where: {
                id: eventId,
                wgId,
            },
        });

        if (!event) {
            return NextResponse.json(
                { error: "Event nicht gefunden" },
                { status: 404 }
            );
        }

        const canDelete =
            membership.role === "ADMIN" || event.createdById === user.id;

        if (!canDelete) {
            return NextResponse.json(
                { error: "Du darfst dieses Event nicht löschen" },
                { status: 403 }
            );
        }

        await prisma.event.delete({
            where: {
                id: eventId,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Event wurde gelöscht",
        });
    } catch (error) {
        console.error("WG_EVENT_DELETE_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}