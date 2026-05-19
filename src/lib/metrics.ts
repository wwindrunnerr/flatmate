import fs from "node:fs";
import path from "node:path";

type RouteMetricEntry = {
    timestamp: string;
    route: string;
    durationMs: number;
    rssMb: number;
    heapUsedMb: number;
    heapTotalMb: number;
    externalMb: number;
};

function toMb(bytes: number): number {
    return Number((bytes / 1024 / 1024).toFixed(2));
}

function getMetricsLogFilePath(): string {
    const logDir = path.resolve(process.cwd(), "metrics");
    if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
    }

    return path.join(logDir, "performance.log");
}

export function writeRouteMetric(route: string, startTime: number): void {
    try {
        const durationMs = Number((performance.now() - startTime).toFixed(2));
        const memory = process.memoryUsage();

        const entry: RouteMetricEntry = {
            timestamp: new Date().toISOString(),
            route,
            durationMs,
            rssMb: toMb(memory.rss),
            heapUsedMb: toMb(memory.heapUsed),
            heapTotalMb: toMb(memory.heapTotal),
            externalMb: toMb(memory.external),
        };

        const logFile = getMetricsLogFilePath();
        fs.appendFileSync(logFile, JSON.stringify(entry) + "\n", "utf8");
    } catch (error) {
        console.error("METRICS_WRITE_ERROR", error);
    }
}