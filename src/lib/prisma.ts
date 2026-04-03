import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

const dbPath = path.resolve(process.cwd(), "dev.db");

if (!fs.existsSync(dbPath)) {
    throw new Error(`SQLite database not found at: ${dbPath}`);
}

const dbUrl = `file:${dbPath.replace(/\\/g, "/")}`;

const adapter = new PrismaBetterSqlite3({
    url: dbUrl,
});

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: ["error", "warn"],
    });

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}