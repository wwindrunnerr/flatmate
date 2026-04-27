import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { updateExpenseSchema } from "@/lib/validation/budget";
import {
    canManageExpense,
    expenseInclude,
    loadWgMemberIds,
    mapExpenseToResponse,
    requireMembershipOrResponse,
    validateParticipantMembership,
    type ExpenseWithRelations,
} from "@/lib/budget/expense-route-helpers";

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
        });

        if (!existingExpense) {
            return NextResponse.json(
                { error: "Ausgabe nicht gefunden" },
                { status: 404 }
            );
        }

        const userCanManageExpense = canManageExpense(
            existingExpense.paidByUserId,
            auth.user!.id,
            auth.membership!.role
        );

        if (!userCanManageExpense) {
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

        const memberIds = await loadWgMemberIds(wgId);
        const participantValidationError = validateParticipantMembership(
            participantUserIds,
            memberIds
        );

        if (participantValidationError) {
            return NextResponse.json(
                { error: participantValidationError },
                { status: 400 }
            );
        }

        const updatedExpense = await prisma.$transaction(async (tx) => {
            await tx.expenseParticipant.deleteMany({
                where: { expenseId },
            });

            return tx.expense.update({
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
                include: expenseInclude,
            });
        });

        return NextResponse.json({
            success: true,
            expense: mapExpenseToResponse(updatedExpense as ExpenseWithRelations),
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
            return NextResponse.json(
                { error: "Ausgabe nicht gefunden" },
                { status: 404 }
            );
        }

        const userCanManageExpense = canManageExpense(
            existingExpense.paidByUserId,
            auth.user!.id,
            auth.membership!.role
        );

        if (!userCanManageExpense) {
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