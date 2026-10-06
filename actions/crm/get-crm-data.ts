import { cache } from "react";
import { prismadb } from "@/lib/prisma";
import { serializeDecimalsList } from "@/lib/serialize-decimals";

export const getAllCrmData = cache(async () => {
  let [
    accounts,
    opportunities,
    leads,
    contacts,
    contracts,
    saleTypes,
    saleStages,
    campaigns,
    industries,
    contactTypes,
    leadSources,
    leadStatuses,
    leadTypes,
    currencies,
    exchangeRates,
    productCategories,
  ] = await Promise.all([
    prismadb.crm_Accounts.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, email: true, office_phone: true, status: true, type: true },
    }),
    prismadb.crm_Opportunities.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, budget: true, currency: true, status: true, sales_stage: true },
    }),
    prismadb.crm_Leads.findMany({
      where: { deletedAt: null },
      select: { id: true, firstName: true, lastName: true, company: true, email: true, phone: true },
    }),
    prismadb.crm_Contacts.findMany({
      where: { deletedAt: null },
      select: { id: true, first_name: true, last_name: true, email: true, office_phone: true },
    }),
    prismadb.crm_Contracts.findMany({
      where: { deletedAt: null },
      select: { id: true, title: true, value: true, currency: true, status: true },
    }),
    prismadb.crm_Opportunities_Type.findMany({}),
    prismadb.crm_Opportunities_Sales_Stages.findMany({}),
    prismadb.crm_campaigns.findMany({
      where: { deletedAt: null },
      select: { id: true, name: true, status: true },
    }),
    prismadb.crm_Industry_Type.findMany({}),
    prismadb.crm_Contact_Types.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Sources.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Statuses.findMany({ orderBy: { name: "asc" } }),
    prismadb.crm_Lead_Types.findMany({ orderBy: { name: "asc" } }),
    prismadb.currency.findMany({ where: { isEnabled: true }, orderBy: { code: "asc" } }),
    prismadb.exchangeRate.findMany(),
    prismadb.crm_ProductCategories.findMany({
      where: { isActive: true },
      orderBy: { order: "asc" },
    }),
  ]);

  // Auto-seed Product Categories if empty
  if (!productCategories || productCategories.length === 0) {
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
      productCategories = await prismadb.crm_ProductCategories.findMany({
        where: { isActive: true },
        orderBy: { order: "asc" },
      });
    } catch (e) {
      console.error("Failed to seed default product categories:", e);
    }
  }

  // Auto-seed Campaigns if empty
  if (!campaigns || campaigns.length === 0) {
    const defaultCampaigns = [
      { name: "Email Campaign Q1", status: "Active", v: 0 },
      { name: "Social Media Outreach", status: "Active", v: 0 },
      { name: "Search Ads Campaign", status: "Active", v: 0 },
      { name: "Partner Referral Program", status: "Active", v: 0 },
    ];
    try {
      await prismadb.crm_campaigns.createMany({ data: defaultCampaigns });
      campaigns = await prismadb.crm_campaigns.findMany({ where: { deletedAt: null } });
    } catch (e) {
      console.error("Failed to seed default campaigns:", e);
    }
  }

  // Auto-seed Sales Types if empty
  if (!saleTypes || saleTypes.length === 0) {
    const defaultTypes = [
      { name: "New deal", order: 1, v: 0 },
      { name: "Business from partners", order: 2, v: 0 },
      { name: "Upsale", order: 3, v: 0 },
      { name: "Cross sale", order: 4, v: 0 },
    ];
    try {
      await prismadb.crm_Opportunities_Type.createMany({ data: defaultTypes });
      saleTypes = await prismadb.crm_Opportunities_Type.findMany({});
    } catch (e) {
      console.error("Failed to seed sales types:", e);
    }
  }

  // Auto-seed Sales Stages if empty
  if (!saleStages || saleStages.length === 0) {
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
      await prismadb.crm_Opportunities_Sales_Stages.createMany({ data: defaultStages });
      saleStages = await prismadb.crm_Opportunities_Sales_Stages.findMany({});
    } catch (e) {
      console.error("Failed to seed sales stages:", e);
    }
  }

  // Auto-seed Lead Sources if empty
  if (!leadSources || leadSources.length === 0) {
    const defaultSources = [
      { name: "Web" },
      { name: "Referral" },
      { name: "Cold Call" },
      { name: "Email Campaign" },
      { name: "Event" },
      { name: "Other" },
    ];
    try {
      await prismadb.crm_Lead_Sources.createMany({ data: defaultSources });
      leadSources = await prismadb.crm_Lead_Sources.findMany({ orderBy: { name: "asc" } });
    } catch (e) {
      console.error("Failed to seed lead sources:", e);
    }
  }

  // Auto-seed Lead Statuses if empty
  if (!leadStatuses || leadStatuses.length === 0) {
    const defaultStatuses = [
      { name: "New" },
      { name: "Contacted" },
      { name: "Qualified" },
      { name: "Lost" },
    ];
    try {
      await prismadb.crm_Lead_Statuses.createMany({ data: defaultStatuses });
      leadStatuses = await prismadb.crm_Lead_Statuses.findMany({ orderBy: { name: "asc" } });
    } catch (e) {
      console.error("Failed to seed lead statuses:", e);
    }
  }

  // Auto-seed Lead Types if empty
  if (!leadTypes || leadTypes.length === 0) {
    const defaultTypes = [
      { name: "Inbound" },
      { name: "Outbound" },
      { name: "Demo" },
      { name: "Partner" },
    ];
    try {
      await prismadb.crm_Lead_Types.createMany({ data: defaultTypes });
      leadTypes = await prismadb.crm_Lead_Types.findMany({ orderBy: { name: "asc" } });
    } catch (e) {
      console.error("Failed to seed lead types:", e);
    }
  }

  // Ensure default currencies (including INR) exist in DB
  const defaultCurrencies = [
    { code: "EUR", name: "Euro", symbol: "€", isEnabled: true, isDefault: true },
    { code: "USD", name: "US Dollar", symbol: "$", isEnabled: true, isDefault: false },
    { code: "INR", name: "Indian Rupee", symbol: "₹", isEnabled: true, isDefault: false },
    { code: "CZK", name: "Czech Koruna", symbol: "Kč", isEnabled: true, isDefault: false },
  ];

  let addedNewCurrency = false;
  for (const cur of defaultCurrencies) {
    if (!currencies.some((c: { code: string }) => c.code === cur.code)) {
      try {
        await prismadb.currency.upsert({
          where: { code: cur.code },
          update: { name: cur.name, symbol: cur.symbol, isEnabled: true },
          create: cur,
        });
        addedNewCurrency = true;
      } catch (e) {
        console.error("Failed to upsert currency:", cur.code, e);
      }
    }
  }

  if (addedNewCurrency) {
    currencies = await prismadb.currency.findMany({ where: { isEnabled: true }, orderBy: { code: "asc" } });
  }

  const data = {
    accounts,
    opportunities: serializeDecimalsList(opportunities),
    leads,
    contacts,
    contracts: serializeDecimalsList(contracts),
    saleTypes,
    saleStages,
    campaigns,
    industries,
    contactTypes,
    leadSources,
    leadStatuses,
    leadTypes,
    currencies,
    productCategories,
    exchangeRates: exchangeRates.map((r: { fromCurrency: string; toCurrency: string; rate: unknown }) => ({
      fromCurrency: r.fromCurrency,
      toCurrency: r.toCurrency,
      rate: Number(r.rate),
    })),
  };

  return data;
});
