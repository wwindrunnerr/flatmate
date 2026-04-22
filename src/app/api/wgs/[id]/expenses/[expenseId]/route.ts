import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { updateExpenseSchema } from "@/lib/validation/budget";

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
        where: {
            userId: user.id,
            wgId,
        },
    });

    if (!membership) {
        return {
            error: NextResponse.json({ error: "Kein Zugriff auf diese WG" }, { status: 403 }),
            user,
            membership: null,
        };
    }

    return {
        error: null,
        user,
        membership,
    };
}

export async function PATCH(
    req: Request,
    context: { params: Promise<{ id: string; expenseId: string }> }
) {
    try {
        const { id: wgId, expenseId } = await context.params;

        const auth = await requireMembershipOrResponse(wgId);
        if (auth.error) return auth.error;

        const existingExpense = await prisma.expense.findFirst({
            where: {
                id: expenseId,
                wgId,
            },
            include: {
                participants: true,
            },
        });

        if (!existingExpense) {
            return NextResponse.json({ error: "Ausgabe nicht gefunden" }, { status: 404 });
        }

        const canManageExpense =
            existingExpense.paidByUserId === auth.user!.id ||
            auth.membership!.role === "ADMIN";

        if (!canManageExpense) {
            return NextResponse.json(
                { error: "Du darfst diese Ausgabe nicht bearbeiten" },
                { status: 403 }
            );
        }

        const body = await req.json();
        const parsed = updateExpenseSchema.safeParse(body);

        if (!parsed.success) {
            return NextResponse.json(
                {
                    error: "Ungültige Eingaben",
                    fields: parsed.error.flatten().fieldErrors,
                },
                { status: 400 }
            );
        }

        const { description, amountCents, participantUserIds } = parsed.data;

        const memberships = await prisma.membership.findMany({
            where: { wgId },
            select: { userId: true },
        });

        const memberIds = new Set(memberships.map((m) => m.userId));

        for (const participantUserId of participantUserIds) {
            if (!memberIds.has(participantUserId)) {
                return NextResponse.json(
                    { error: "Alle Teilnehmer müssen Mitglieder der WG sein" },
                    { status: 400 }
                );
            }
        }

        const updatedExpense = await prisma.$transaction(async (tx) => {
            await tx.expenseParticipant.deleteMany({
                where: { expenseId },
            });

            const expense = await tx.expense.update({
                where: { id: expenseId },
                data: {
                    description,
                    amountCents,
                    participants: {
                        create: participantUserIds.map((userId, index) => ({
                            userId,
                            sortOrder: index,
                        })),
                    },
                },
                include: {
                    paidBy: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                        },
                    },
                    participants: {
                        orderBy: { sortOrder: "asc" },
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                },
            });

            return expense;
        });

        return NextResponse.json({
            success: true,
            expense: {
                id: updatedExpense.id,
                description: updatedExpense.description,
                amountCents: updatedExpense.amountCents,
                amount: Number((updatedExpense.amountCents / 100).toFixed(2)),
                createdAt: updatedExpense.createdAt.toISOString(),
                paidBy: updatedExpense.paidBy,
                participantUserIds: updatedExpense.participants.map((p) => p.user.id),
                participantNames: updatedExpense.participants.map((p) => p.user.name),
            },
        });
    } catch (error) {
        console.error("UPDATE_EXPENSE_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    _req: Request,
    context: { params: Promise<{ id: string; expenseId: string }> }
) {
    try {
        const { id: wgId, expenseId } = await context.params;

        const auth = await requireMembershipOrResponse(wgId);
        if (auth.error) return auth.error;

        const existingExpense = await prisma.expense.findFirst({
            where: {
                id: expenseId,
                wgId,
            },
        });

        if (!existingExpense) {
            return NextResponse.json({ error: "Ausgabe nicht gefunden" }, { status: 404 });
        }

        const canManageExpense =
            existingExpense.paidByUserId === auth.user!.id ||
            auth.membership!.role === "ADMIN";

        if (!canManageExpense) {
            return NextResponse.json(
                { error: "Du darfst diese Ausgabe nicht löschen" },
                { status: 403 }
            );
        }

        await prisma.expense.delete({
            where: { id: expenseId },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("DELETE_EXPENSE_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}