import { inngest } from "@/inngest/client";
import { prismadb } from "@/lib/prisma";
import {
  buildEmbeddingText,
  computeContentHash,
  generateEmbedding,
  toVectorLiteral,
} from "@/inngest/lib/embedding-utils";

export const embedOpportunity = inngest.createFunction(
  { id: "embed-opportunity", name: "Embed Opportunity", triggers: [{ event: "crm/opportunity.saved" }] },
  async ({ event }) => {
    const { record_id } = event.data as { record_id: string };

    const opportunity = await prismadb.crm_Opportunities.findUnique({
      where: { id: record_id },
      select: {
        id: true,
        name: true,
        description: true,
        assigned_sales_stage: { select: { name: true } },
      },
    });
    if (!opportunity) return { skipped: "record not found" };

    const stageName = opportunity.assigned_sales_stage?.name;
    const text = buildEmbeddingText([opportunity.name, opportunity.description, stageName]);
    if (!text) return { skipped: "no embeddable text" };

    const newHash = computeContentHash(text);

    const existing = await prismadb.crm_Embeddings_Opportunities.findUnique({
      where: { opportunity_id: record_id },
      select: { content_hash: true },
    });
    if (existing?.content_hash === newHash) return { skipped: "hash unchanged" };

    const embedding = await generateEmbedding(text);

    await prismadb.crm_Embeddings_Opportunities.upsert({
      where: { opportunity_id: record_id },
      create: {
        opportunity_id: record_id,
        embedding: embedding as any,
        content_hash: newHash,
      },
      update: {
        embedding: embedding as any,
        content_hash: newHash,
        embedded_at: new Date(),
      },
    });

    return { embedded: true, opportunity_id: record_id };
  }
);
