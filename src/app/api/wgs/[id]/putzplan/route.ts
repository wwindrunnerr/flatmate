import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { writeRouteMetric } from "@/lib/metrics";

type PutzplanUpdateBody = {
    rooms?: string[];
    weekOverride?: {
        weekStart: string;
        assignments: Record<string, string[]>;
        unassignedRooms: string[];
    };
    rating?: {
        ratedUserId: string;
        score: number;
        weekStart: string; // NEU: Frontend schickt jetzt die exakte Woche mit!
    };
};

function startOfDay(value: Date) {
    const d = new Date(value);
    d.setHours(0, 0, 0, 0);
    return d;
}

function getMonday(date: Date) {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day;
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
}

function addDays(value: Date, days: number) {
    const d = new Date(value);
    d.setDate(d.getDate() + days);
    return d;
}

function safeParseJsonArray(value: string): string[] {
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
    } catch {
        return [];
    }
}

function safeParseAssignments(value: string): Record<string, string[]> {
    try {
        const parsed = JSON.parse(value);
        if (!parsed || typeof parsed !== "object") return {};

        const result: Record<string, string[]> = {};

        for (const [key, val] of Object.entries(parsed)) {
            result[key] = Array.isArray(val)
                ? val.filter((item) => typeof item === "string")
                : [];
        }

        return result;
    } catch {
        return {};
    }
}

async function requireMembershipOrResponse(wgId: string) {
    const user = await getSessionUser();

    if (!user) {
        return {
            error: NextResponse.json({ error: "Nicht eingeloggt" }, { status: 401 }),
            user: null,
            membership: null,
        };
    }

    const membership = await prisma.membership.findFirst({
        where: { userId: user.id, wgId },
    });

    if (!membership) {
        return {
            error: NextResponse.json({ error: "Kein Zugriff auf diese WG" }, { status: 403 }),
            user,
            membership: null,
        };
    }

    return { error: null, user, membership };
}

async function cleanupExpiredOverrides(wgId: string) {
    await prisma.cleaningWeekOverride.deleteMany({
        where: {
            wgId,
            expiresAt: { lt: new Date() },
        },
    });
}

export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const startTime = performance.now();

    try {
        const { id: wgId } = await context.params;

        const auth = await requireMembershipOrResponse(wgId);
        if (auth.error) {
            writeRouteMetric("GET /api/wgs/[id]/putzplan (auth fail)", startTime);
            return auth.error;
        }

        await cleanupExpiredOverrides(wgId);

        const [memberships, rooms, overrides] = await Promise.all([
            prisma.membership.findMany({
                where: { wgId },
                orderBy: { joinedAt: "asc" },
                include: {
                    user: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                },
            }),
            prisma.cleaningRoom.findMany({
                where: { wgId },
                orderBy: { sortOrder: "asc" },
            }),
            prisma.cleaningWeekOverride.findMany({
                where: { wgId },
                orderBy: { weekStart: "asc" },
            }),
        ]);

        writeRouteMetric("GET /api/wgs/[id]/putzplan", startTime);

        return NextResponse.json({
            members: memberships.map((membership) => ({
                id: membership.user.id,
                name: membership.user.name,
                email: membership.user.email,
                role: membership.role,
            })),
            rooms: rooms.map((room) => room.name),
            weekOverrides: overrides.map((override) => ({
                weekStart: override.weekStart.toISOString(),
                assignments: safeParseAssignments(override.assignmentsJson),
                unassignedRooms: safeParseJsonArray(override.unassignedRoomsJson),
                expiresAt: override.expiresAt.toISOString(),
            })),
        });
    } catch (error) {
        writeRouteMetric("GET /api/wgs/[id]/putzplan (error)", startTime);
        console.error("PUTZPLAN_GET_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const startTime = performance.now();

    try {
        const { id: wgId } = await context.params;

        const auth = await requireMembershipOrResponse(wgId);
        if (auth.error) {
            writeRouteMetric("PUT /api/wgs/[id]/putzplan (auth fail)", startTime);
            return auth.error;
        }

        await cleanupExpiredOverrides(wgId);

        const body: PutzplanUpdateBody = await req.json();

        if (body.rooms) {
            const cleanedRooms = body.rooms.map((r) => r.trim()).filter(Boolean);

            await prisma.$transaction(async (tx) => {
                await tx.cleaningRoom.deleteMany({
                    where: { wgId },
                });

                if (cleanedRooms.length > 0) {
                    await tx.cleaningRoom.createMany({
                        data: cleanedRooms.map((name, index) => ({
                            wgId,
                            name,
                            sortOrder: index,
                        })),
                    });
                }
            });
        }

        if (body.weekOverride) {
            const weekStart = startOfDay(new Date(body.weekOverride.weekStart));

            if (Number.isNaN(weekStart.getTime())) {
                writeRouteMetric("PUT /api/wgs/[id]/putzplan (invalid date)", startTime);
                return NextResponse.json(
                    { error: "Ungültiges weekStart-Datum" },
                    { status: 400 }
                );
            }

            const weekEnd = addDays(weekStart, 6);
            const expiresAt = addDays(weekEnd, 7);

            await prisma.cleaningWeekOverride.upsert({
                where: {
                    wgId_weekStart: {
                        wgId,
                        weekStart,
                    },
                },
                update: {
                    assignmentsJson: JSON.stringify(body.weekOverride.assignments ?? {}),
                    unassignedRoomsJson: JSON.stringify(body.weekOverride.unassignedRooms ?? []),
                    expiresAt,
                },
                create: {
                    wgId,
                    weekStart,
                    assignmentsJson: JSON.stringify(body.weekOverride.assignments ?? {}),
                    unassignedRoomsJson: JSON.stringify(body.weekOverride.unassignedRooms ?? []),
                    expiresAt,
                },
            });
        }

        const updatedRooms = await prisma.cleaningRoom.findMany({
            where: { wgId },
            orderBy: { sortOrder: "asc" },
        });

        writeRouteMetric("PUT /api/wgs/[id]/putzplan", startTime);

        return NextResponse.json({
            success: true,
            rooms: updatedRooms.map((room) => room.name),
        });
    } catch (error) {
        writeRouteMetric("PUT /api/wgs/[id]/putzplan (error)", startTime);
        console.error("PUTZPLAN_PUT_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}