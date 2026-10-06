"use server";
import { prismadb } from "@/lib/prisma";
import {
  requireAuthenticated,
  assertCanReadTemplate,
  targetListReadScopeWhere,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

type StepInput = {
  order: number;
  template_id: string;
  subject: string;
  delay_days: number;
  send_to: "all" | "non_openers";
};

export const createCampaign = async (data: {
  name: string;
  description?: string;
  from_name?: string;
  reply_to?: string;
  template_id?: string;
  target_list_ids: string[];
  steps: StepInput[];
  scheduled_at?: Date;
}) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    throw e;
  }

  if (data.template_id) {
    try {
      await assertCanReadTemplate(user, data.template_id);
    } catch (e) {
      if (e instanceof AuthorizationError) return { error: "Forbidden" };
      throw e;
    }
  }

  if (data.target_list_ids?.length) {
    const accessible = await prismadb.crm_TargetLists.findMany({
      where: {
        id: { in: data.target_list_ids },
        ...targetListReadScopeWhere(user),
      },
      select: { id: true },
    });
    if (accessible.length !== data.target_list_ids.length) {
      return { error: "Forbidden" };
    }
  }

  let campaignTemplateId = data.template_id;
  if (!campaignTemplateId) {
    const firstTemplate = await prismadb.crm_campaign_templates.findFirst({
      where: { deletedAt: null },
    });
    if (firstTemplate) {
      campaignTemplateId = firstTemplate.id;
    } else {
      const created = await prismadb.crm_campaign_templates.create({
        data: {
          name: "Default Campaign Template",
          description: "System generated campaign template",
          content_html: "<p>Hello,</p>",
          content_json: {},
          created_by: user.id,
        },
      });
      campaignTemplateId = created.id;
    }
  }

  const truncate = (str?: string | null, max = 190) => {
    if (!str) return "";
    const trimmed = str.trim();
    return trimmed.length > max ? trimmed.substring(0, max) : trimmed;
  };

  const { target_list_ids, steps, ...campaignData } = data;

  const sanitizedCampaignData = {
    ...campaignData,
    name: truncate(campaignData.name, 190),
    description: campaignData.description ? truncate(campaignData.description, 500) : undefined,
    from_name: campaignData.from_name ? truncate(campaignData.from_name, 190) : undefined,
    reply_to: campaignData.reply_to ? truncate(campaignData.reply_to, 190) : undefined,
  };

  const mappedSteps = (steps || []).map((s) => {
    const rawSubject = s.subject || data.name || "Campaign Step";
    return {
      order: s.order ?? 0,
      subject: truncate(rawSubject, 190),
      delay_days: s.delay_days ?? 0,
      send_to: s.send_to || "all",
      template_id: s.template_id || campaignTemplateId,
      scheduled_at: data.scheduled_at
        ? new Date(new Date(data.scheduled_at).getTime() + (s.delay_days || 0) * 86_400_000)
        : null,
    };
  });

  return prismadb.crm_campaigns.create({
    data: {
      ...sanitizedCampaignData,
      template_id: campaignTemplateId,
      v: 0,
      status: data.scheduled_at ? "scheduled" : "draft",
      created_by: user.id,
      target_lists: {
        create: (target_list_ids || []).map((id) => ({ target_list_id: id })),
      },
      steps: {
        create: mappedSteps,
      },
    },
  });
};
