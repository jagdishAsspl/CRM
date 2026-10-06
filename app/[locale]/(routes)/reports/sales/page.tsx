import { getTranslations } from "next-intl/server";
import { cookies } from "next/headers";
import { getDefaultCurrency, formatCurrency as formatCurrencyUtil } from "@/lib/currency";
import { Decimal } from "decimal.js";
import { Card, CardContent } from "@/components/ui/card";
import { ReportPageLayout } from "@/components/reports/ReportPageLayout";
import dynamic from "next/dynamic";
const ReportChart = dynamic(
  () => import("@/components/reports/ReportChart").then((mod) => mod.ReportChart),
  { loading: () => <div className="h-72 border rounded-md p-4 animate-pulse bg-muted" /> }
);
import { parseSearchParamsToFilters } from "@/actions/reports/types";
import { getAllSalesData } from "@/actions/reports/sales";

type Props = { searchParams: Promise<Record<string, string | undefined>> };

export default async function SalesReportPage({ searchParams }: Props) {
  const pageStart = performance.now();
  console.log(`[PERF] /reports/sales page START`);
  const resolvedParams = await searchParams;
  const params = new URLSearchParams(
    Object.entries(resolvedParams).filter(
      (entry): entry is [string, string] => entry[1] !== undefined
    )
  );
  const filters = parseSearchParamsToFilters(params);

  const cookieStore = await cookies();
  const [t, defaultCurrency] = await Promise.all([
    getTranslations("ReportsPage"),
    getDefaultCurrency(),
  ]);
  const displayCurrency = cookieStore.get("display_currency")?.value || defaultCurrency;

  console.log(`[PERF] getAllSalesData START`);
  const salesDataStart = performance.now();
  const {
    revenue,
    pipeline,
    oppsByStage,
    oppsByMonth,
    winLoss,
    avgDeal,
    cycleLength,
  } = await getAllSalesData(filters, displayCurrency);
  const salesDataEnd = performance.now();
  console.log(`[PERF] getAllSalesData END: ${(salesDataEnd - salesDataStart).toFixed(2)} ms`);
  const pageEnd = performance.now();
  console.log(`[PERF] /reports/sales page TOTAL: ${(pageEnd - pageStart).toFixed(2)} ms`);

  return (
    <ReportPageLayout
      title={t("sales.title")}
      description={t("sales.description")}
      category="sales"
      currentFilters={params.toString()}
    >
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{t("sales.revenue")}</p>
          <p className="text-2xl font-bold mt-1">{formatCurrencyUtil(new Decimal(revenue), displayCurrency)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{t("sales.pipeline")}</p>
          <p className="text-2xl font-bold mt-1">{formatCurrencyUtil(new Decimal(pipeline), displayCurrency)}</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{t("sales.avgDeal")}</p>
          <p className="text-2xl font-bold mt-1">{formatCurrencyUtil(new Decimal(avgDeal), displayCurrency)}</p>
        </CardContent></Card>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{t("sales.winRate")}</p>
          <p className="text-2xl font-bold mt-1">{winLoss.rate}%</p>
        </CardContent></Card>
        <Card><CardContent className="p-4">
          <p className="text-sm text-muted-foreground">{t("sales.cycleLength")}</p>
          <p className="text-2xl font-bold mt-1">{cycleLength} {t("sales.days")}</p>
        </CardContent></Card>
      </div>
      <ReportChart data={oppsByStage} titleKey="oppsByStage" type="bar" />
      <ReportChart data={oppsByMonth} titleKey="oppsByMonth" type="area" />
    </ReportPageLayout>
  );
}
