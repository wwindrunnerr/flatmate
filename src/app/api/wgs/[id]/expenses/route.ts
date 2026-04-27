import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createExpenseSchema } from "@/lib/validation/budget";
import {
    calculateBalances,
    expenseInclude,
    loadWgMemberIds,
    mapExpenseToResponse,
    requireMembershipOrResponse,
    validateParticipantMembership,
    type ExpenseWithRelations,
} from "@/lib/budget/expense-route-helpers";

export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id: wgId } = await context.params;

        const auth = await requireMembershipOrResponse(wgId);
        if (auth.error) return auth.error;

        const expenses = await prisma.expense.findMany({
            where: { wgId },
            orderBy: { createdAt: "desc" },
            include: expenseInclude,
        });

        const balances = calculateBalances(
            expenses as ExpenseWithRelations[],
            auth.user!.id
        );

        return NextResponse.json({
            expenses: expenses.map((expense) =>
                mapExpenseToResponse(expense as ExpenseWithRelations)
            ),
            pairwiseBalances: balances.pairwiseBalances,
            currentUserSummary: balances.currentUserSummary,
        });
    } catch (error) {
        console.error("GET_EXPENSES_ERROR", error);
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
        const { id: wgId } = await context.params;

        const auth = await requireMembershipOrResponse(wgId);
        if (auth.error) return auth.error;

        const body = await req.json();
        const parsed = createExpenseSchema.safeParse(body);

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
        const paidByUserId = auth.user!.id;

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

        const expense = await prisma.expense.create({
            data: {
                wgId,
                description,
                amountCents,
                paidByUserId,
                participants: {
                    create: participantUserIds.map((userId, index) => ({
                        userId,
                        sortOrder: index,
                    })),
                },
            },
            include: expenseInclude,
        });

        return NextResponse.json(
            {
                success: true,
                expense: mapExpenseToResponse(expense as ExpenseWithRelations),
            },
            { status: 201 }
        );
    } catch (error) {
        console.error("CREATE_EXPENSE_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}