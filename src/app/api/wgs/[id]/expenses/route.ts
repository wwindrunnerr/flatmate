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
import { writeRouteMetric } from "@/lib/metrics";

export async function GET(
    _req: Request,
    context: { params: Promise<{ id: string }> }
) {
    const startTime = performance.now();

    try {
        const { id: wgId } = await context.params;

        const auth = await requireMembershipOrResponse(wgId);
        if (auth.error) {
            writeRouteMetric("GET /api/wgs/[id]/expenses (auth fail)", startTime);
            return auth.error;
        }

        const expenses = await prisma.expense.findMany({
            where: { wgId },
            orderBy: { createdAt: "desc" },
            include: expenseInclude,
        });

        const balances = calculateBalances(
            expenses as ExpenseWithRelations[],
            auth.user!.id
        );

        writeRouteMetric("GET /api/wgs/[id]/expenses", startTime);

        return NextResponse.json({
            expenses: expenses.map((expense) =>
                mapExpenseToResponse(expense as ExpenseWithRelations)
            ),
            pairwiseBalances: balances.pairwiseBalances,
            currentUserSummary: balances.currentUserSummary,
        });
    } catch (error) {
        writeRouteMetric("GET /api/wgs/[id]/expenses (error)", startTime);
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
    const startTime = performance.now();

    try {
        const { id: wgId } = await context.params;

        const auth = await requireMembershipOrResponse(wgId);
        if (auth.error) {
            writeRouteMetric("POST /api/wgs/[id]/expenses (auth fail)", startTime);
            return auth.error;
        }

        const body = await req.json();
        const parsed = createExpenseSchema.safeParse(body);

        if (!parsed.success) {
            writeRouteMetric("POST /api/wgs/[id]/expenses (validation fail)", startTime);
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

        const memberships = await prisma.membership.findMany({
            where: { wgId },
            select: { userId: true },
        });

        const memberIds = new Set(memberships.map((m) => m.userId));

        if (!memberIds.has(paidByUserId)) {
            writeRouteMetric("POST /api/wgs/[id]/expenses (payer invalid)", startTime);
            return NextResponse.json(
                { error: "Bezahlt-von muss Mitglied der WG sein" },
                { status: 400 }
            );
        }

        for (const participantUserId of participantUserIds) {
            if (!memberIds.has(participantUserId)) {
                writeRouteMetric("POST /api/wgs/[id]/expenses (participant invalid)", startTime);
                return NextResponse.json(
                    { error: "Alle Teilnehmer müssen Mitglieder der WG sein" },
                    { status: 400 }
                );
            }
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

        writeRouteMetric("POST /api/wgs/[id]/expenses", startTime);

        return NextResponse.json(
            {
                success: true,
                expense: mapExpenseToResponse(expense as ExpenseWithRelations),
            },
            { status: 201 }
        );
    } catch (error) {
        writeRouteMetric("POST /api/wgs/[id]/expenses (error)", startTime);
        console.error("CREATE_EXPENSE_ERROR", error);
        return NextResponse.json(
            { error: "Interner Serverfehler" },
            { status: 500 }
        );
    }
}