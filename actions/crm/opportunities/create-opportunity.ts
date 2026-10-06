"use server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import sendEmail from "@/lib/sendmail";
import { inngest } from "@/inngest/client";
import { writeAuditLog } from "@/lib/audit-log";
import { getSnapshotRate, getDefaultCurrency } from "@/lib/currency";
import { handleStageTransition } from "@/lib/crm/stage-transition";
import {
  requireAuthenticated,
  assertCanWriteAccount,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export const createOpportunity = async (data: {
  account?: string;
  assigned_to?: string;
  budget?: string;
  campaign?: string;
  close_date?: Date;
  delivery_deadline?: Date;
  contact?: string;
  currency?: string;
  description?: string;
  expected_revenue?: string;
  name: string;
  next_step?: string;
  sales_stage?: string;
  type?: string;
}) => {
  const {
    account,
    assigned_to,
    budget,
    campaign,
    close_date,
    delivery_deadline,
    contact,
    currency,
    description,
    expected_revenue,
    name,
    next_step,
    sales_stage,
    type,
  } = data;

  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    throw e;
  }
  try {
    // Parent-write: attaching the opportunity to an account requires write on it.
    if (account) await assertCanWriteAccount(user, account);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }
  const userId = user.id;

  try {
    const parseDate = (val?: Date | string | null) => {
      if (!val) return undefined;
      const d = new Date(val);
      return isNaN(d.getTime()) ? undefined : d;
    };

    const parseDecimal = (val?: string | null) => {
      if (!val || typeof val !== "string") return undefined;
      const cleaned = val.replace(/,/g, "").trim();
      if (!cleaned) return undefined;
      const num = parseFloat(cleaned);
      return isNaN(num) ? undefined : num;
    };

    const cleanStr = (val?: string | null) => {
      if (!val || typeof val !== "string") return undefined;
      const trimmed = val.trim();
      return trimmed.length > 0 ? trimmed : undefined;
    };

    const cleanCurrency = cleanStr(currency);
    const defaultCurrency = await getDefaultCurrency();
    const snapshotRate = cleanCurrency
      ? await getSnapshotRate(cleanCurrency, defaultCurrency)
      : null;

    const parsedCloseDate = parseDate(close_date);
    const parsedDeliveryDeadline = parseDate(delivery_deadline);
    const parsedBudget = parseDecimal(budget);
    const parsedExpectedRevenue = parseDecimal(expected_revenue);

    let resolvedSalesStage = cleanStr(sales_stage);
    if (resolvedSalesStage) {
      const stageRecord = await prismadb.crm_Opportunities_Sales_Stages.findFirst({
        where: {
          OR: [{ id: resolvedSalesStage }, { name: resolvedSalesStage }],
        },
      });
      if (stageRecord) {
        resolvedSalesStage = stageRecord.id;
      }
    }

    const opportunity = await prismadb.crm_Opportunities.create({
      data: {
        account: cleanStr(account),
        assigned_to: cleanStr(assigned_to) || userId,
        budget: parsedBudget,
        campaign: cleanStr(campaign),
        close_date: parsedCloseDate,
        delivery_deadline: parsedDeliveryDeadline,
        contact: cleanStr(contact),
        createdBy: userId,
        last_activity_by: userId,
        updatedBy: userId,
        currency: cleanCurrency,
        description: cleanStr(description),
        expected_revenue: parsedExpectedRevenue,
        snapshot_rate: snapshotRate ? parseFloat(snapshotRate.toString()) : undefined,
        name: name.trim(),
        next_step: cleanStr(next_step),
        sales_stage: resolvedSalesStage,
        stage_entered_at: new Date(),
        status: "ACTIVE",
        type: cleanStr(type),
      },
    });

    await handleStageTransition({
      opportunityId: opportunity.id,
      fromStage: null,
      toStage: opportunity.sales_stage ?? null,
    });

    if (assigned_to && assigned_to !== userId) {
      const notifyRecipient = await prismadb.users.findFirst({
        where: { id: assigned_to },
      });

      if (notifyRecipient) {
        await sendEmail({
          from: process.env.EMAIL_FROM as string,
          to: notifyRecipient.email || "info@softbase.cz",
          subject:
            notifyRecipient.userLanguage === "en"
              ? `New opportunity ${name} has been added to the system and assigned to you.`
              : `Nová příležitost ${name} byla přidána do systému a přidělena vám.`,
          text:
            notifyRecipient.userLanguage === "en"
              ? `New opportunity ${name} has been added to the system and assigned to you. You can click here for detail: ${process.env.NEXT_PUBLIC_APP_URL}/crm/opportunities/${opportunity.id}`
              : `Nová příležitost ${name} byla přidána do systému a přidělena vám. Detaily naleznete zde: ${process.env.NEXT_PUBLIC_APP_URL}/crm/opportunities/${opportunity.id}`,
        });
      }
    }

    await writeAuditLog({
      entityType: "opportunity",
      entityId: opportunity.id,
      action: "created",
      changes: null,
      userId: user.id,
    });
    void inngest.send({ name: "crm/opportunity.saved", data: { record_id: opportunity.id } }).catch((err) => {
      console.warn("[INNGEST_SEND_FAILED]", err);
    });
    revalidatePath("/[locale]/(routes)/crm/opportunities", "page");
    return { data: opportunity };
  } catch (error: any) {
    console.error("[CREATE_OPPORTUNITY_ERROR]", error);
    return { error: error?.message || "Failed to create opportunity" };
  }
};
