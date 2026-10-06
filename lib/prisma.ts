import { PrismaClient } from "@prisma/client";

declare global {
  var cachedPrisma: any | undefined;
}

export const prismaPerfStats = {
  queries: [] as { query: string; duration: number }[],
  reset() {
    this.queries = [];
  },
  summary() {
    const totalCount = this.queries.length;
    const totalTime = this.queries.reduce((acc, q) => acc + q.duration, 0);
    const slowest = this.queries.reduce((max, q) => Math.max(max, q.duration), 0);

    const queryCounts: Record<string, number> = {};
    for (const q of this.queries) {
      queryCounts[q.query] = (queryCounts[q.query] || 0) + 1;
    }
    const duplicates = Object.values(queryCounts).filter((c) => c > 1).reduce((acc, c) => acc + (c - 1), 0);

    return {
      totalQueries: totalCount,
      totalTimeMs: Number(totalTime.toFixed(2)),
      slowestMs: Number(slowest.toFixed(2)),
      duplicateQueries: duplicates,
      sequentialQueries: totalCount,
    };
  },
};

const createPrismaClient = () => {
  const baseClient = new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

  return baseClient.$extends({
    query: {
      $allModels: {
        async $allOperations({ model, operation, args, query }) {
          const start = performance.now();
          const result = await query(args);
          const duration = performance.now() - start;
          const queryName = `${model}.${operation}`;
          prismaPerfStats.queries.push({ query: queryName, duration });
          console.log(`[PRISMA] ${queryName} duration: ${duration.toFixed(2)}ms`);
          return result;
        },
      },
    },
  });
};

let prisma: any;

if (process.env.NODE_ENV === "production") {
  prisma = createPrismaClient();
} else {
  if (!global.cachedPrisma) {
    global.cachedPrisma = createPrismaClient();
  }
  prisma = global.cachedPrisma;
}

export const prismadb = prisma;



