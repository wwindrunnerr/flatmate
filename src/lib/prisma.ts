import fs from "node:fs";
import path from "node:path";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../../generated/prisma";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

function resolveDatabaseUrl() {
    const envUrl = process.env.DATABASE_URL;

    if (envUrl && envUrl.startsWith("file:")) {
        return envUrl;
    }

    const dbPath = path.resolve(process.cwd(), "dev.db");

    if (!fs.existsSync(dbPath)) {
        throw new Error(`SQLite database not found at: ${dbPath}`);
    }

    return `file:${dbPath.replace(/\\/g, "/")}`;
}

const adapter = new PrismaBetterSqlite3({
    url: resolveDatabaseUrl(),
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