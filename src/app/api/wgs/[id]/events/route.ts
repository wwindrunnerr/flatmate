import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { createEventSchema } from "@/lib/validation/event";

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

        const events = await prisma.event.findMany({
            where: { wgId },
            orderBy: {
                startsAt: "asc",
            },
            select: {
                id: true,
                title: true,
                description: true,
                startsAt: true,
                createdAt: true,
                createdById: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({ events });
    } catch (error) {
        console.error("WG_EVENTS_GET_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

export async function POST(
    req: Request,
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

        const body = await req.json();
        const parsed = createEventSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Ungültige Eingaben",
                    fields: parsed.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { title, description, startsAt } = parsed.data;
        const startsAtDate = new Date(startsAt);

        if (Number.isNaN(startsAtDate.getTime())) {
            return NextResponse.json(
                {
                    error: "Ungültige Eingaben",
                    fields: {
                        startsAt: ["Ungültiges Datum"],
                    },
                },
                { status: 400 }
            );
        }

        const event = await prisma.event.create({
            data: {
                title,
                description: description || null,
                startsAt: startsAtDate,
                wgId,
                createdById: user.id,
            },
            select: {
                id: true,
                title: true,
                description: true,
                startsAt: true,
                createdAt: true,
                createdById: true,
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json(
            {
                success: true,
                event,
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("WG_EVENTS_POST_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}