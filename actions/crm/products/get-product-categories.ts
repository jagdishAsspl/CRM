import { cache } from "react";
import { prismadb } from "@/lib/prisma";

export const getProductCategories = cache(async () => {
  let categories = await prismadb.crm_ProductCategories.findMany({
    where: { isActive: true },
    orderBy: { order: "asc" },
  });

  if (!categories || categories.length === 0) {
    const defaultCategories = [
      { name: "Software & Licenses", description: "Software subscriptions and licenses", order: 1, isActive: true, createdBy: "system" },
      { name: "Hardware & Equipment", description: "Physical hardware devices and equipment", order: 2, isActive: true, createdBy: "system" },
      { name: "Professional Services", description: "Consulting, implementation and professional services", order: 3, isActive: true, createdBy: "system" },
      { name: "Maintenance & Support", description: "Ongoing support and maintenance contracts", order: 4, isActive: true, createdBy: "system" },
      { name: "Training & Education", description: "Training sessions, courses and workshops", order: 5, isActive: true, createdBy: "system" },
      { name: "Other Products", description: "Miscellaneous products and services", order: 6, isActive: true, createdBy: "system" },
    ];
    try {
      await prismadb.crm_ProductCategories.createMany({ data: defaultCategories });
      categories = await prismadb.crm_ProductCategories.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      });
    } catch (e) {
      console.error("Failed to seed default product categories:", e);
    }
  }

  return categories;
});
