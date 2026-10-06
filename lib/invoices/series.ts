import { prismadb } from "@/lib/prisma";

export async function getInvoiceSeries() {
  let series = await prismadb.invoice_Series.findMany({
    where: { active: true },
    orderBy: { isDefault: "desc" },
  });

  if (!series || series.length === 0) {
    const defaultSeries = [
      {
        name: "Main",
        prefixTemplate: "INV-{YYYY}-{####}",
        resetPolicy: "YEARLY" as const,
        counter: 0,
        isDefault: true,
        active: true,
      },
      {
        name: "Standard",
        prefixTemplate: "INV-{####}",
        resetPolicy: "NEVER" as const,
        counter: 0,
        isDefault: false,
        active: true,
      },
      {
        name: "Proforma",
        prefixTemplate: "PRO-{YYYY}-{####}",
        resetPolicy: "YEARLY" as const,
        counter: 0,
        isDefault: false,
        active: true,
      },
    ];

    try {
      await prismadb.invoice_Series.createMany({
        data: defaultSeries,
      });
      series = await prismadb.invoice_Series.findMany({
        where: { active: true },
        orderBy: { isDefault: "desc" },
      });
    } catch (e) {
      console.error("Failed to auto-seed default invoice series:", e);
    }
  }

  return series;
}
