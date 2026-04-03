import { cookies } from "next/headers";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";

const SESSION_COOKIE_NAME = "session_token";
const SESSION_DURATION_DAYS = 7;

export async function createSession(userId: string) {
    const token = randomUUID();

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + SESSION_DURATION_DAYS);

    await prisma.session.create({
        data: {
            token,
            userId,
            expiresAt,
        },
    });

    const cookieStore = await cookies();

    cookieStore.set(SESSION_COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: expiresAt,
        path: "/",
    });
}

export async function getSessionUser() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (!token) {
        return null;
    }

    const session = await prisma.session.findUnique({
        where: { token },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                    birthDate: true,
                    avatarUrl: true,
                    createdAt: true,
                },
            },
        },
    });

    if (!session) {
        return null;
    }

    if (session.expiresAt < new Date()) {
        await prisma.session.delete({
            where: { token },
        });

        return null;
    }

    return session.user;
}

export async function deleteSession() {
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

    if (token) {
        await prisma.session.deleteMany({
            where: { token },
        });
    }

    cookieStore.set(SESSION_COOKIE_NAME, "", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        expires: new Date(0),
        path: "/",
    });
}