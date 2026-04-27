import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionUser } from "@/lib/auth/session";

export type BalanceDirection = "you_owe" | "owes_you" | "settled";
export type MembershipRole = "ADMIN" | "MEMBER";

export type ExpenseParticipantUser = {
    id: string;
    name: string;
    email: string;
};

export type ExpenseParticipant = {
    sortOrder: number;
    user: ExpenseParticipantUser;
};

export type ExpenseWithRelations = {
    id: string;
    description: string;
    amountCents: number;
    createdAt: Date;
    paidByUserId: string;
    paidBy: ExpenseParticipantUser;
    participants: ExpenseParticipant[];
};

export type PairwiseBalance = {
    fromUserId: string;
    fromUserName: string;
    toUserId: string;
    toUserName: string;
    amountCents: number;
    amount: number;
};

export type CurrentUserSummaryItem = {
    otherUserId: string;
    otherUserName: string;
    direction: BalanceDirection;
    amountCents: number;
    amount: number;
};

export type ExpenseResponse = {
    id: string;
    description: string;
    amountCents: number;
    amount: number;
    createdAt: string;
    paidBy: ExpenseParticipantUser;
    participantUserIds: string[];
    participantNames: string[];
};

export const expenseInclude = {
    paidBy: {
        select: {
            id: true,
            name: true,
            email: true,
        },
    },
    participants: {
        orderBy: { sortOrder: "asc" as const },
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
} as const;

export function centsToAmount(cents: number): number {
    return Number((cents / 100).toFixed(2));
}

export function mapExpenseToResponse(expense: ExpenseWithRelations): ExpenseResponse {
    return {
        id: expense.id,
        description: expense.description,
        amountCents: expense.amountCents,
        amount: centsToAmount(expense.amountCents),
        createdAt: expense.createdAt.toISOString(),
        paidBy: expense.paidBy,
        participantUserIds: expense.participants.map((participant) => participant.user.id),
        participantNames: expense.participants.map((participant) => participant.user.name),
    };
}

export async function requireMembershipOrResponse(wgId: string) {
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

export async function loadWgMemberIds(wgId: string): Promise<Set<string>> {
    const memberships = await prisma.membership.findMany({
        where: { wgId },
        select: { userId: true },
    });

    return new Set(memberships.map((membership) => membership.userId));
}

export function validateParticipantMembership(
    participantUserIds: string[],
    memberIds: Set<string>
): string | null {
    for (const participantUserId of participantUserIds) {
        if (!memberIds.has(participantUserId)) {
            return "Alle Teilnehmer müssen Mitglieder der WG sein";
        }
    }

    return null;
}

export function canManageExpense(
    expensePaidByUserId: string,
    currentUserId: string,
    membershipRole: MembershipRole
): boolean {
    return expensePaidByUserId === currentUserId || membershipRole === "ADMIN";
}

type DirectedBalanceMap = Map<string, number>;
type UserMap = Map<string, ExpenseParticipantUser>;

function splitAmountCents(
    totalCents: number,
    participantIds: string[]
): Array<{ userId: string; shareCents: number }> {
    const participantCount = participantIds.length;
    const baseShare = Math.floor(totalCents / participantCount);
    const remainder = totalCents % participantCount;

    return participantIds.map((userId, index) => ({
        userId,
        shareCents: baseShare + (index < remainder ? 1 : 0),
    }));
}

function addUsersFromExpense(expense: ExpenseWithRelations, users: UserMap): void {
    users.set(expense.paidBy.id, expense.paidBy);

    for (const participant of expense.participants) {
        users.set(participant.user.id, participant.user);
    }
}

function buildDirectedBalances(expenses: ExpenseWithRelations[]): {
    directedBalances: DirectedBalanceMap;
    users: UserMap;
} {
    const directedBalances: DirectedBalanceMap = new Map();
    const users: UserMap = new Map();

    for (const expense of expenses) {
        addUsersFromExpense(expense, users);

        const sortedParticipants = [...expense.participants].sort(
            (left, right) => left.sortOrder - right.sortOrder
        );

        const participantIds = sortedParticipants.map(
            (participant) => participant.user.id
        );

        const shares = splitAmountCents(expense.amountCents, participantIds);

        for (const share of shares) {
            if (share.userId === expense.paidByUserId) continue;

            const balanceKey = `${share.userId}->${expense.paidByUserId}`;
            const previousValue = directedBalances.get(balanceKey) ?? 0;

            directedBalances.set(balanceKey, previousValue + share.shareCents);
        }
    }

    return { directedBalances, users };
}

function buildPairwiseBalances(
    directedBalances: DirectedBalanceMap,
    users: UserMap
): PairwiseBalance[] {
    const processedPairs = new Set<string>();
    const pairwiseBalances: PairwiseBalance[] = [];

    for (const balanceKey of directedBalances.keys()) {
        const [fromUserId, toUserId] = balanceKey.split("->");
        const pairKey = [fromUserId, toUserId].sort().join("|");

        if (processedPairs.has(pairKey)) continue;
        processedPairs.add(pairKey);

        const forwardAmount = directedBalances.get(`${fromUserId}->${toUserId}`) ?? 0;
        const backwardAmount = directedBalances.get(`${toUserId}->${fromUserId}`) ?? 0;
        const netAmount = forwardAmount - backwardAmount;

        if (netAmount === 0) continue;

        if (netAmount > 0) {
            pairwiseBalances.push({
                fromUserId,
                fromUserName: users.get(fromUserId)?.name ?? fromUserId,
                toUserId,
                toUserName: users.get(toUserId)?.name ?? toUserId,
                amountCents: netAmount,
                amount: centsToAmount(netAmount),
            });
            continue;
        }

        pairwiseBalances.push({
            fromUserId: toUserId,
            fromUserName: users.get(toUserId)?.name ?? toUserId,
            toUserId: fromUserId,
            toUserName: users.get(fromUserId)?.name ?? fromUserId,
            amountCents: Math.abs(netAmount),
            amount: centsToAmount(Math.abs(netAmount)),
        });
    }

    return pairwiseBalances;
}

function buildCurrentUserSummary(
    pairwiseBalances: PairwiseBalance[],
    users: UserMap,
    currentUserId: string
): CurrentUserSummaryItem[] {
    const summaryMap = new Map<string, number>();

    for (const balance of pairwiseBalances) {
        if (balance.fromUserId === currentUserId) {
            const previousValue = summaryMap.get(balance.toUserId) ?? 0;
            summaryMap.set(balance.toUserId, previousValue - balance.amountCents);
            continue;
        }

        if (balance.toUserId === currentUserId) {
            const previousValue = summaryMap.get(balance.fromUserId) ?? 0;
            summaryMap.set(balance.fromUserId, previousValue + balance.amountCents);
        }
    }

    return Array.from(summaryMap.entries()).map(([otherUserId, netCents]) => {
        const otherUser = users.get(otherUserId);

        let direction: BalanceDirection = "settled";
        if (netCents > 0) direction = "owes_you";
        if (netCents < 0) direction = "you_owe";

        return {
            otherUserId,
            otherUserName: otherUser?.name ?? otherUserId,
            direction,
            amountCents: Math.abs(netCents),
            amount: centsToAmount(Math.abs(netCents)),
        };
    });
}

export function calculateBalances(
    expenses: ExpenseWithRelations[],
    currentUserId: string
): {
    pairwiseBalances: PairwiseBalance[];
    currentUserSummary: CurrentUserSummaryItem[];
} {
    const { directedBalances, users } = buildDirectedBalances(expenses);
    const pairwiseBalances = buildPairwiseBalances(directedBalances, users);
    const currentUserSummary = buildCurrentUserSummary(
        pairwiseBalances,
        users,
        currentUserId
    );

    return {
        pairwiseBalances,
        currentUserSummary,
    };
}