import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { createExpenseSchema } from "@/lib/validation/budget";

type BalanceDirection = "you_owe" | "owes_you" | "settled";

function centsToAmount(cents: number) {
    return Number((cents / 100).toFixed(2));
}

function splitAmountCents(totalCents: number, participantIds: string[]) {
    const count = participantIds.length;
    const baseShare = Math.floor(totalCents / count);
    const remainder = totalCents % count;

    return participantIds.map((userId, index) => ({
        userId,
        shareCents: baseShare + (index < remainder ? 1 : 0),
    }));
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

type ExpenseForCalculation = {
    id: string;
    description: string;
    amountCents: number;
    createdAt: Date;
    paidByUserId: string;
    paidBy: {
        id: string;
        name: string;
        email: string;
    };
    participants: Array<{
        sortOrder: number;
        user: {
            id: string;
            name: string;
            email: string;
        };
    }>;
};

function calculateBalances(expenses: ExpenseForCalculation[], currentUserId: string) {
    const directedBalances = new Map<string, number>();
    const userMap = new Map<string, { id: string; name: string; email: string }>();

    for (const expense of expenses) {
        userMap.set(expense.paidBy.id, expense.paidBy);

        const sortedParticipants = [...expense.participants].sort(
            (a, b) => a.sortOrder - b.sortOrder
        );

        for (const participant of sortedParticipants) {
            userMap.set(participant.user.id, participant.user);
        }

        const participantIds = sortedParticipants.map((p) => p.user.id);
        const shares = splitAmountCents(expense.amountCents, participantIds);

        for (const share of shares) {
            if (share.userId === expense.paidByUserId) continue;

            const key = `${share.userId}->${expense.paidByUserId}`;
            directedBalances.set(key, (directedBalances.get(key) ?? 0) + share.shareCents);
        }
    }

    const processedPairs = new Set<string>();
    const pairwiseBalances: Array<{
        fromUserId: string;
        fromUserName: string;
        toUserId: string;
        toUserName: string;
        amountCents: number;
    }> = [];

    for (const [key, amount] of directedBalances.entries()) {
        const [fromUserId, toUserId] = key.split("->");
        const pairKey = [fromUserId, toUserId].sort().join("|");

        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        const forward = directedBalances.get(`${fromUserId}->${toUserId}`) ?? 0;
        const backward = directedBalances.get(`${toUserId}->${fromUserId}`) ?? 0;
        const net = forward - backward;

        if (net > 0) {
            pairwiseBalances.push({
                fromUserId,
                fromUserName: userMap.get(fromUserId)?.name ?? fromUserId,
                toUserId,
                toUserName: userMap.get(toUserId)?.name ?? toUserId,
                amountCents: net,
            });
        } else if (net < 0) {
            pairwiseBalances.push({
                fromUserId: toUserId,
                fromUserName: userMap.get(toUserId)?.name ?? toUserId,
                toUserId: fromUserId,
                toUserName: userMap.get(fromUserId)?.name ?? fromUserId,
                amountCents: Math.abs(net),
            });
        }
    }

    const summaryMap = new Map<string, number>();

    for (const balance of pairwiseBalances) {
        if (balance.fromUserId === currentUserId) {
            summaryMap.set(balance.toUserId, (summaryMap.get(balance.toUserId) ?? 0) - balance.amountCents);
        } else if (balance.toUserId === currentUserId) {
            summaryMap.set(balance.fromUserId, (summaryMap.get(balance.fromUserId) ?? 0) + balance.amountCents);
        }
    }

    const currentUserSummary = Array.from(summaryMap.entries()).map(([otherUserId, netCents]) => {
        const otherUser = userMap.get(otherUserId);
        let direction: BalanceDirection = "settled";

        if (netCents > 0) direction = "owes_you";
        else if (netCents < 0) direction = "you_owe";

        return {
            otherUserId,
            otherUserName: otherUser?.name ?? otherUserId,
            direction,
            amountCents: Math.abs(netCents),
            amount: centsToAmount(Math.abs(netCents)),
        };
    });

    return {
        pairwiseBalances: pairwiseBalances.map((balance) => ({
            ...balance,
            amount: centsToAmount(balance.amountCents),
        })),
        currentUserSummary,
    };
}

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

        const balances = calculateBalances(expenses as ExpenseForCalculation[], auth.user!.id);

        return NextResponse.json({
            expenses: expenses.map((expense) => ({
                id: expense.id,
                description: expense.description,
                amountCents: expense.amountCents,
                amount: centsToAmount(expense.amountCents),
                createdAt: expense.createdAt.toISOString(),
                paidBy: expense.paidBy,
                participantUserIds: expense.participants.map((p) => p.user.id),
                participantNames: expense.participants.map((p) => p.user.name),
            })),
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

        const memberships = await prisma.membership.findMany({
            where: { wgId },
            select: { userId: true },
        });

        const memberIds = new Set(memberships.map((m) => m.userId));

        if (!memberIds.has(paidByUserId)) {
            return NextResponse.json(
                { error: "Bezahlt-von muss Mitglied der WG sein" },
                { status: 400 }
            );
        }

        for (const participantUserId of participantUserIds) {
            if (!memberIds.has(participantUserId)) {
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

        return NextResponse.json(
            {
                success: true,
                expense: {
                    id: expense.id,
                    description: expense.description,
                    amountCents: expense.amountCents,
                    amount: centsToAmount(expense.amountCents),
                    createdAt: expense.createdAt.toISOString(),
                    paidBy: expense.paidBy,
                    participantUserIds: expense.participants.map((p) => p.user.id),
                    participantNames: expense.participants.map((p) => p.user.name),
                },
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