import { inngest } from "@/inngest/client";
import { prismadb } from "@/lib/prisma";
import {
  buildEmbeddingText,
  computeContentHash,
  generateEmbedding,
  toVectorLiteral,
} from "@/inngest/lib/embedding-utils";

export const embedEmail = inngest.createFunction(
  {
    id: "email-embed-email",
    name: "Email: Embed Email",
    concurrency: { limit: 10 },
    triggers: [{ event: "email/embed-email" }],
  },
  async ({ event }: { event: { data: { emailId: string } } }) => {
    const { emailId } = event.data;

    const email = await prismadb.email.findUnique({
      where: { id: emailId },
      select: { id: true, subject: true, bodyText: true, fromEmail: true },
    });
    if (!email) return { skipped: "not found" };

    const text = buildEmbeddingText([email.subject, email.bodyText, email.fromEmail]);
    if (!text) return { skipped: "no embeddable text" };

    const newHash = computeContentHash(text);

    const existing = await prismadb.emailEmbedding.findUnique({
      where: { emailId },
      select: { contentHash: true },
    });
    if (existing?.contentHash === newHash) return { skipped: "hash unchanged" };

    const embedding = await generateEmbedding(text);

    await prismadb.emailEmbedding.upsert({
      where: { emailId },
      create: {
        emailId,
        embedding: embedding as any,
        contentHash: newHash,
      },
      update: {
        embedding: embedding as any,
        contentHash: newHash,
        embeddedAt: new Date(),
      },
    });

    return { embedded: true, emailId };
  }
);
