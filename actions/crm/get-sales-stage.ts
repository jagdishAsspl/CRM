import { prismadb } from "@/lib/prisma";

export const getSaleStages = async () => {
  let data = await prismadb.crm_Opportunities_Sales_Stages.findMany({
    orderBy: {
      probability: "asc",
    },
  });

  if (!data || data.length === 0) {
    const defaultStages = [
      { name: "New", order: 0, probability: 10, v: 0 },
      { name: "Need analysis", order: 1, probability: 25, v: 0 },
      { name: "Offer sent", order: 2, probability: 30, v: 0 },
      { name: "Offer accepted", order: 3, probability: 45, v: 0 },
      { name: "Contract draft", order: 4, probability: 65, v: 0 },
      { name: "Contract negotiation", order: 5, probability: 75, v: 0 },
      { name: "Send for signing", order: 6, probability: 80, v: 0 },
      { name: "Signing", order: 7, probability: 95, v: 0 },
      { name: "Realization of the project", order: 8, probability: 100, v: 0 },
    ];

    try {
      await prismadb.crm_Opportunities_Sales_Stages.createMany({
        data: defaultStages,
      });
      data = await prismadb.crm_Opportunities_Sales_Stages.findMany({
        orderBy: {
          probability: "asc",
        },
      });
    } catch (error) {
      console.error("Error creating default sales stages:", error);
    }
  }

  return data;
};
