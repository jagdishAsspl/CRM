import { inngest } from "@/inngest/client";
import { prismadb } from "@/lib/prisma";
import {
  buildEmbeddingText,
  computeContentHash,
  generateEmbedding,
  toVectorLiteral,
} from "@/inngest/lib/embedding-utils";

export const embedContact = inngest.createFunction(
  { id: "embed-contact", name: "Embed Contact", triggers: [{ event: "crm/contact.saved" }] },
  async ({ event }) => {
    const { record_id } = event.data as { record_id: string };

    const contact = await prismadb.crm_Contacts.findUnique({
      where: { id: record_id },
      select: { id: true, first_name: true, last_name: true, position: true, email: true },
    });
    if (!contact) return { skipped: "record not found" };

    const text = buildEmbeddingText([
      contact.first_name,
      contact.last_name,
      contact.position,
      contact.email,
    ]);
    if (!text) return { skipped: "no embeddable text" };

    const newHash = computeContentHash(text);

    const existing = await prismadb.crm_Embeddings_Contacts.findUnique({
      where: { contact_id: record_id },
      select: { content_hash: true },
    });
    if (existing?.content_hash === newHash) return { skipped: "hash unchanged" };

    const embedding = await generateEmbedding(text);

    await prismadb.crm_Embeddings_Contacts.upsert({
      where: { contact_id: record_id },
      create: {
        contact_id: record_id,
        embedding: embedding as any,
        content_hash: newHash,
      },
      update: {
        embedding: embedding as any,
        content_hash: newHash,
        embedded_at: new Date(),
      },
    });

    return { embedded: true, contact_id: record_id };
  }
);
