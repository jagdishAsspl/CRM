import { inngest } from "@/inngest/client";
import { prismadb } from "@/lib/prisma";
import {
  buildEmbeddingText,
  computeContentHash,
  generateEmbedding,
  toVectorLiteral,
} from "@/inngest/lib/embedding-utils";

export const embedLead = inngest.createFunction(
  { id: "embed-lead", name: "Embed Lead", triggers: [{ event: "crm/lead.saved" }] },
  async ({ event }) => {
    const { record_id } = event.data as { record_id: string };

    const lead = await prismadb.crm_Leads.findUnique({
      where: { id: record_id },
      select: { id: true, firstName: true, lastName: true, description: true },
    });
    if (!lead) return { skipped: "record not found" };

    const text = buildEmbeddingText([
      lead.firstName,
      lead.lastName,
      lead.description,
    ]);
    if (!text) return { skipped: "no embeddable text" };

    const newHash = computeContentHash(text);

    const existing = await prismadb.crm_Embeddings_Leads.findUnique({
      where: { lead_id: record_id },
      select: { content_hash: true },
    });
    if (existing?.content_hash === newHash) return { skipped: "hash unchanged" };

    const embedding = await generateEmbedding(text);

    await prismadb.crm_Embeddings_Leads.upsert({
      where: { lead_id: record_id },
      create: {
        lead_id: record_id,
        embedding: embedding as any,
        content_hash: newHash,
      },
      update: {
        embedding: embedding as any,
        content_hash: newHash,
        embedded_at: new Date(),
      },
    });

    return { embedded: true, lead_id: record_id };
  }
);
