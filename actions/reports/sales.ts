import { prismadb } from "@/lib/prisma";
import type { ReportFilters, ChartDataPoint } from "./types";
import { groupedToChartData } from "./types";
import { getExchangeRates, convertAmount } from "@/lib/currency";
import { Decimal } from "decimal.js";
import type { ReportScope } from "@/lib/authz/scopes/report-scope";
import { getReportScope } from "@/lib/authz/scopes/report-scope";

const DEFAULT_SCOPE: ReportScope = getReportScope({ id: "", role: "manager" });

function dateRangeWhere(filters: ReportFilters) {
  return {
    created_on: { gte: filters.dateFrom, lte: filters.dateTo },
    deletedAt: null,
  };
}

import { prismaPerfStats } from "@/lib/prisma";

export async function getAllSalesData(
  filters: ReportFilters,
  displayCurrency: string,
  scope: ReportScope = DEFAULT_SCOPE,
) {
  console.log(`[PERF] Prisma START`);
  prismaPerfStats.reset();
  const prismaStart = performance.now();
  const opps = await prismadb.crm_Opportunities.findMany({
    where: { ...dateRangeWhere(filters), ...scope.opportunity },
    select: {
      id: true,
      status: true,
      budget: true,
      currency: true,
      created_on: true,
      close_date: true,
      assigned_sales_stage: { select: { name: true } },
    },
  });

  const rates = await getExchangeRates();
  const prismaEnd = performance.now();
  console.log(`[PERF] Prisma END: ${(prismaEnd - prismaStart).toFixed(2)} ms`);
  const summary = prismaPerfStats.summary();
  console.log(`[PERF SUMMARY]
Total Prisma queries: ${summary.totalQueries}
Total Prisma time: ${summary.totalTimeMs} ms
Slowest query: ${summary.slowestMs} ms
Duplicate queries: ${summary.duplicateQueries}
Sequential queries: ${summary.sequentialQueries}`);

  let revenueDecimal = new Decimal(0);
  let pipelineDecimal = new Decimal(0);
  let closedCount = 0;
  let inactiveCount = 0;
  let totalCycleDays = 0;
  let cycleCount = 0;

  const stageGrouped: Record<string, number> = {};
  const monthGrouped: Record<string, number> = {};

  for (const opp of opps) {
    const stage = opp.assigned_sales_stage?.name ?? "Unassigned";
    stageGrouped[stage] = (stageGrouped[stage] || 0) + 1;

    if (opp.created_on) {
      const d = new Date(opp.created_on);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      monthGrouped[key] = (monthGrouped[key] || 0) + 1;
    }

    const budget = new Decimal(opp.budget?.toString() ?? "0");
    const fromCurrency = opp.currency || displayCurrency;
    const converted = convertAmount(budget, fromCurrency, displayCurrency, rates) ?? budget;

    if (opp.status === "CLOSED") {
      closedCount++;
      revenueDecimal = revenueDecimal.add(converted);

      if (opp.created_on && opp.close_date) {
        const diff = opp.close_date.getTime() - new Date(opp.created_on).getTime();
        totalCycleDays += diff / (1000 * 60 * 60 * 24);
        cycleCount++;
      }
    } else if (opp.status === "ACTIVE") {
      pipelineDecimal = pipelineDecimal.add(converted);
    } else if (opp.status === "INACTIVE") {
      inactiveCount++;
    }
  }

  const revenue = revenueDecimal.toNumber();
  const pipeline = pipelineDecimal.toNumber();
  const avgDeal = closedCount > 0 ? revenueDecimal.div(closedCount).toDecimalPlaces(2).toNumber() : 0;
  const winLossTotal = closedCount + inactiveCount;
  const winLossRate = winLossTotal > 0 ? Math.round((closedCount / winLossTotal) * 100) : 0;
  const cycleLength = cycleCount > 0 ? Math.round(totalCycleDays / cycleCount) : 0;

  return {
    revenue,
    pipeline,
    oppsByStage: groupedToChartData(stageGrouped),
    oppsByMonth: groupedToChartData(monthGrouped, true),
    winLoss: { won: closedCount, total: winLossTotal, rate: winLossRate },
    avgDeal,
    cycleLength,
  };
}

export async function getRevenue(
  filters: ReportFilters,
  displayCurrency: string,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<number> {
  const data = await getAllSalesData(filters, displayCurrency, scope);
  return data.revenue;
}

export async function getPipelineValue(
  filters: ReportFilters,
  displayCurrency: string,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<number> {
  const data = await getAllSalesData(filters, displayCurrency, scope);
  return data.pipeline;
}

export async function getOppsByStage(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<ChartDataPoint[]> {
  const data = await getAllSalesData(filters, "EUR", scope);
  return data.oppsByStage;
}

export async function getOppsByMonth(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<ChartDataPoint[]> {
  const data = await getAllSalesData(filters, "EUR", scope);
  return data.oppsByMonth;
}

export async function getWinLossRate(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<{ won: number; total: number; rate: number }> {
  const data = await getAllSalesData(filters, "EUR", scope);
  return data.winLoss;
}

export async function getAvgDealSize(
  filters: ReportFilters,
  displayCurrency: string,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<number> {
  const data = await getAllSalesData(filters, displayCurrency, scope);
  return data.avgDeal;
}

export async function getSalesCycleLength(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<number> {
  const data = await getAllSalesData(filters, "EUR", scope);
  return data.cycleLength;
}

