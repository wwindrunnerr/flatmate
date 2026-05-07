import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

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
    try {
        const { id: wgId } = await context.params;

        const auth = await requireMembershipOrResponse(wgId);
        if (auth.error) return auth.error;

        await cleanupExpiredOverrides(wgId);

        const currentMonday = getMonday(new Date());
        const sixWeeksAgo = addDays(currentMonday, -42);

        const [memberships, rooms, overrides, ratings] = await Promise.all([
            prisma.membership.findMany({
                where: { wgId },
                orderBy: { joinedAt: "asc" },
                include: { user: { select: { id: true, name: true, email: true } } },
            }),
            prisma.cleaningRoom.findMany({
                where: { wgId },
                orderBy: { sortOrder: "asc" },
            }),
            prisma.cleaningWeekOverride.findMany({
                where: { wgId },
                orderBy: { weekStart: "asc" },
            }),
            prisma.cleaningRating.findMany({
                // Holt alle Ratings der letzten 6 Wochen (und simulierte in der Zukunft)
                where: { wgId, weekStart: { gte: sixWeeksAgo } },
            }),
        ]);

        const userScores: Record<string, { total: number; count: number }> = {};
        ratings.forEach((r) => {
            if (!userScores[r.ratedUserId]) userScores[r.ratedUserId] = { total: 0, count: 0 };
            userScores[r.ratedUserId].total += r.score;
            userScores[r.ratedUserId].count += 1;
        });

        const leaderboard = memberships.map((m) => {
            const stats = userScores[m.user.id];
            return {
                userId: m.user.id,
                userName: m.user.name,
                average: stats ? stats.total / stats.count : null,
            };
        }).sort((a, b) => (b.average || 0) - (a.average || 0));

        // NEU: Gibt ALLE Ratings des aktuellen Users zurück, gepaart mit der Woche
        const myRatings = ratings
            .filter((r) => r.raterId === auth.user.id)
            .map((r) => ({
                ratedUserId: r.ratedUserId,
                score: r.score,
                weekStart: r.weekStart.toISOString(),
            }));

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
            leaderboard,
            myRatings,
        });
    } catch (error) {
        console.error("PUTZPLAN_GET_ERROR", error);
        return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: wgId } = await context.params;

        const auth = await requireMembershipOrResponse(wgId);
        if (auth.error) return auth.error;

        await cleanupExpiredOverrides(wgId);

        const body: PutzplanUpdateBody = await req.json();

        if (body.rooms) {
            const cleanedRooms = body.rooms.map((r) => r.trim()).filter(Boolean);
            await prisma.$transaction(async (tx) => {
                await tx.cleaningRoom.deleteMany({ where: { wgId } });
                if (cleanedRooms.length > 0) {
                    await tx.cleaningRoom.createMany({
                        data: cleanedRooms.map((name, index) => ({ wgId, name, sortOrder: index })),
                    });
                }
            });
        }

        if (body.weekOverride) {
            const weekStart = startOfDay(new Date(body.weekOverride.weekStart));
            if (Number.isNaN(weekStart.getTime())) {
                return NextResponse.json({ error: "Ungültiges weekStart-Datum" }, { status: 400 });
            }
            const weekEnd = addDays(weekStart, 6);
            const expiresAt = addDays(weekEnd, 7);

            await prisma.cleaningWeekOverride.upsert({
                where: { wgId_weekStart: { wgId, weekStart } },
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

        // NEU: Rating wird für die exakte Woche gespeichert, die das Frontend meldet
        if (body.rating) {
            const ratingWeekStart = startOfDay(new Date(body.rating.weekStart));
            
            await prisma.cleaningRating.upsert({
                where: {
                    wgId_raterId_ratedUserId_weekStart: {
                        wgId,
                        raterId: auth.user.id,
                        ratedUserId: body.rating.ratedUserId,
                        weekStart: ratingWeekStart,
                    },
                },
                update: { score: body.rating.score },
                create: {
                    wgId,
                    raterId: auth.user.id,
                    ratedUserId: body.rating.ratedUserId,
                    weekStart: ratingWeekStart,
                    score: body.rating.score,
                },
            });
        }

        const updatedRooms = await prisma.cleaningRoom.findMany({
            where: { wgId },
            orderBy: { sortOrder: "asc" },
        });

        return NextResponse.json({
            success: true,
            rooms: updatedRooms.map((room) => room.name),
        });
    } catch (error) {
        console.error("PUTZPLAN_PUT_ERROR", error);
        return NextResponse.json({ error: "Interner Serverfehler" }, { status: 500 });
    }
}