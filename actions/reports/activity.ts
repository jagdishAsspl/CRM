import { prismadb } from "@/lib/prisma";
import type { ReportFilters, ChartDataPoint } from "./types";
import { groupedToChartData } from "./types";
import type { ReportScope } from "@/lib/authz/scopes/report-scope";
import { getReportScope } from "@/lib/authz/scopes/report-scope";

const DEFAULT_SCOPE: ReportScope = getReportScope({ id: "", role: "manager" });

export async function getAllActivityData(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
) {
  const [tasks, overdue, activities] = await Promise.all([
    prismadb.tasks.findMany({
      where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo }, ...scope.task },
      select: {
        createdAt: true,
        taskStatus: true,
        assigned_user: { select: { name: true } },
      },
    }),
    prismadb.tasks.count({
      where: { dueDateAt: { lt: new Date(), gte: filters.dateFrom }, taskStatus: "ACTIVE", ...scope.task },
    }),
    prismadb.crm_Activities.findMany({
      where: { createdAt: { gte: filters.dateFrom, lte: filters.dateTo } },
      select: { type: true },
    }),
  ]);

  const createdCompletedGrouped: Record<string, { created: number; completed: number }> = {};
  const assigneeGrouped: Record<string, number> = {};

  for (const task of tasks) {
    if (task.createdAt) {
      const d = new Date(task.createdAt);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (!createdCompletedGrouped[key]) createdCompletedGrouped[key] = { created: 0, completed: 0 };
      createdCompletedGrouped[key].created++;
      if (task.taskStatus === "COMPLETE") createdCompletedGrouped[key].completed++;
    }

    const assigneeName = task.assigned_user?.name ?? "Unassigned";
    assigneeGrouped[assigneeName] = (assigneeGrouped[assigneeName] || 0) + 1;
  }

  const tasksData: { name: string; created: number; completed: number }[] = [];
  for (const key of Object.keys(createdCompletedGrouped).sort()) {
    tasksData.push({ name: key, ...createdCompletedGrouped[key] });
  }

  const typeGrouped: Record<string, number> = {};
  for (const a of activities) {
    typeGrouped[a.type] = (typeGrouped[a.type] || 0) + 1;
  }

  return {
    tasksData,
    overdue,
    tasksByAssignee: groupedToChartData(assigneeGrouped),
    activitiesByType: groupedToChartData(typeGrouped),
  };
}

export async function getTasksCreatedCompleted(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<{ name: string; created: number; completed: number }[]> {
  const data = await getAllActivityData(filters, scope);
  return data.tasksData;
}

export async function getOverdueTasks(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<number> {
  const data = await getAllActivityData(filters, scope);
  return data.overdue;
}

export async function getTasksByAssignee(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<ChartDataPoint[]> {
  const data = await getAllActivityData(filters, scope);
  return data.tasksByAssignee;
}

export async function getActivitiesByType(
  filters: ReportFilters,
  scope: ReportScope = DEFAULT_SCOPE,
): Promise<ChartDataPoint[]> {
  const data = await getAllActivityData(filters, scope);
  return data.activitiesByType;
}

