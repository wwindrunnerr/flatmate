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

export async function PATCH(
    request: NextRequest,
    context: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const { id: wgId, itemId } = await context.params;
        const auth = await requireMembershipOrResponse(wgId);

        if (auth.error) return auth.error;

        const existingItem = await prisma.shoppingListItem.findFirst({
            where: {
                id: itemId,
                wgId,
            },
        });

        if (!existingItem) {
            return NextResponse.json({ error: "Artikel nicht gefunden." }, { status: 404 });
        }

        const body = await request.json();

        const data: {
            name?: string;
            status?: "TO_BUY" | "INVENTORY";
        } = {};

        if (body?.name !== undefined) {
            const name = String(body.name).trim();

            if (!name) {
                return NextResponse.json(
                    { error: "Bitte einen gültigen Artikelnamen eingeben." },
                    { status: 400 }
                );
            }

            data.name = name;
        }

        if (body?.status !== undefined) {
            if (body.status !== "TO_BUY" && body.status !== "INVENTORY") {
                return NextResponse.json({ error: "Ungültiger Status." }, { status: 400 });
            }

            data.status = body.status;
        }

        const item = await prisma.shoppingListItem.update({
            where: { id: itemId },
            data,
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

        return NextResponse.json({ item });
    } catch (error) {
        console.error("UPDATE_SHOPPING_LIST_ITEM_ERROR", error);
        return NextResponse.json(
            { error: "Artikel konnte nicht aktualisiert werden." },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _request: NextRequest,
    context: { params: Promise<{ id: string; itemId: string }> }
) {
    try {
        const { id: wgId, itemId } = await context.params;
        const auth = await requireMembershipOrResponse(wgId);

        if (auth.error) return auth.error;

        const existingItem = await prisma.shoppingListItem.findFirst({
            where: {
                id: itemId,
                wgId,
            },
        });

        if (!existingItem) {
            return NextResponse.json({ error: "Artikel nicht gefunden." }, { status: 404 });
        }

        await prisma.shoppingListItem.delete({
            where: { id: itemId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE_SHOPPING_LIST_ITEM_ERROR", error);
        return NextResponse.json(
            { error: "Artikel konnte nicht gelöscht werden." },
            { status: 500 }
        );
    }
}