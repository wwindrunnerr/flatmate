import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";

async function getSessionUser() {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get("session_token")?.value;

    if (!sessionToken) return null;

    const session = await prisma.session.findUnique({
        where: { token: sessionToken },
        include: { user: true },
    });

    if (!session) return null;

    return session.user;
}

async function requireMembershipOrResponse(wgId: string) {
    const user = await getSessionUser();

    if (!user) {
        return {
            user: null,
            membership: null,
            error: NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 }),
        };
    }

    const membership = await prisma.membership.findFirst({
        where: {
            wgId,
            userId: user.id,
        },
    });

    if (!membership) {
        return {
            user,
            membership: null,
            error: NextResponse.json({ error: "Kein Zugriff auf diese WG." }, { status: 403 }),
        };
    }

    return {
        user,
        membership,
        error: null,
    };
}

export async function GET(
    _request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: wgId } = await context.params;
        const auth = await requireMembershipOrResponse(wgId);

        if (auth.error) return auth.error;

        const items = await prisma.shoppingListItem.findMany({
            where: { wgId },
            orderBy: [
                { status: "asc" },
                { createdAt: "desc" },
            ],
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({
            items,
            toBuyItems: items.filter((item) => item.status === "TO_BUY"),
            inventoryItems: items.filter((item) => item.status === "INVENTORY"),
        });
    } catch (error) {
        console.error("GET_SHOPPING_LIST_ERROR", error);
        return NextResponse.json(
            { error: "Einkaufsliste konnte nicht geladen werden." },
            { status: 500 }
        );
    }
}

export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: wgId } = await context.params;
        const auth = await requireMembershipOrResponse(wgId);

        if (auth.error) return auth.error;
        if (!auth.user) {
            return NextResponse.json({ error: "Nicht eingeloggt." }, { status: 401 });
        }

        const body = await request.json();
        const name = String(body?.name ?? "").trim();
        const status = body?.status === "INVENTORY" ? "INVENTORY" : "TO_BUY";

        if (!name) {
            return NextResponse.json(
                { error: "Bitte einen Artikelnamen eingeben." },
                { status: 400 }
            );
        }

        const item = await prisma.shoppingListItem.create({
            data: {
                name,
                status,
                wgId,
                createdById: auth.user.id,
            },
            include: {
                createdBy: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                    },
                },
            },
        });

        return NextResponse.json({ item }, { status: 201 });
    } catch (error) {
        console.error("CREATE_SHOPPING_LIST_ITEM_ERROR", error);
        return NextResponse.json(
            { error: "Artikel konnte nicht erstellt werden." },
            { status: 500 }
        );
    }
}