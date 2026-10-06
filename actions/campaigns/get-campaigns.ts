"use server";
import { prismadb } from "@/lib/prisma";
import {
  requireAuthenticated,
  campaignReadScopeWhere,
  AuthenticationError,
} from "@/lib/authz";

export const getCampaigns = async (filters?: { status?: string; search?: string }) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    throw e;
  }

  let campaigns = await prismadb.crm_campaigns.findMany({
    where: {
      ...campaignReadScopeWhere(user),
      ...(filters?.status ? { status: filters.status } : {}),
      ...(filters?.search ? { name: { contains: filters.search } } : {}),
    },
    orderBy: { created_on: "desc" },
    include: {
      template: { select: { name: true } },
      created_by_user: { select: { name: true } },
      _count: { select: { sends: true } },
    },
  });

  if (!campaigns || campaigns.length === 0) {
    const defaultCampaigns = [
      { name: "Email Campaign Q1", status: "Active", v: 0 },
      { name: "Social Media Outreach", status: "Active", v: 0 },
      { name: "Search Ads Campaign", status: "Active", v: 0 },
      { name: "Partner Referral Program", status: "Active", v: 0 },
    ];
    try {
      await prismadb.crm_campaigns.createMany({ data: defaultCampaigns });
      campaigns = await prismadb.crm_campaigns.findMany({
        where: {
          ...campaignReadScopeWhere(user),
          ...(filters?.status ? { status: filters.status } : {}),
          ...(filters?.search ? { name: { contains: filters.search } } : {}),
        },
        orderBy: { created_on: "desc" },
        include: {
          template: { select: { name: true } },
          created_by_user: { select: { name: true } },
          _count: { select: { sends: true } },
        },
      });
    } catch (e) {
      console.error("Failed to seed campaigns:", e);
    }
  }

  return campaigns;
};
