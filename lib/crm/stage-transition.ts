import { prismadb } from "@/lib/prisma";
import { inngest } from "@/inngest/client";

// Single funnel-transition chokepoint: every action that writes
// crm_Opportunities.sales_stage calls this after its update so the
// timer engine (cadence/care) reacts to exactly one event shape.
export async function handleStageTransition(opts: {
  opportunityId: string;
  fromStage: string | null;
  toStage: string | null;
}): Promise<boolean> {
  const { opportunityId, fromStage, toStage } = opts;
  if (!toStage || toStage === fromStage) return false;

  await prismadb.crm_Opportunities.update({
    where: { id: opportunityId },
    data: { stage_entered_at: new Date() },
  });
  try {
    await inngest.send({
      name: "crm/opportunity.stage-changed",
      data: { record_id: opportunityId, to_stage: toStage },
    });
  } catch (err) {
    console.warn("[INNGEST_SEND_FAILED]", err);
  }
  return true;
}
