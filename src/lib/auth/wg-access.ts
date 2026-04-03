import { prisma } from "@/lib/prisma";

export async function getMembershipOrNull(userId: string, wgId: string) {
    return prisma.membership.findFirst({
        where: {
            userId,
            wgId,
        },
    });
}

export async function requireWGMembership(userId: string, wgId: string) {
    const membership = await getMembershipOrNull(userId, wgId);

    if (!membership) {
        throw new Error("WG_MEMBERSHIP_REQUIRED");
    }

    return membership;
}

export async function requireWGAdmin(userId: string, wgId: string) {
    const membership = await requireWGMembership(userId, wgId);

    if (membership.role !== "ADMIN") {
        throw new Error("WG_ADMIN_REQUIRED");
    }

    return membership;
}