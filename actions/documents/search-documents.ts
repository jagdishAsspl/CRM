"use server";
import {
  requireAuthenticated,
  documentReadScopeWhere,
  filterAuthorizedDocumentIds,
  AuthenticationError,
} from "@/lib/authz";
import { prismadb } from "@/lib/prisma";
import {
  generateEmbedding,
} from "@/inngest/lib/embedding-utils";

export interface DocumentSearchResult {
  id: string;
  name: string;
  summary: string | null;
  systemType: string | null;
  accountName: string | null;
}

function cosineSimilarity(a: number[], b: number[]): number {
  if (!a || !b || a.length === 0 || b.length === 0) return 0;
  let dot = 0, normA = 0, normB = 0;
  for (let i = 0; i < Math.min(a.length, b.length); i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  return dot / (Math.sqrt(normA) * Math.sqrt(normB) || 1);
}

export async function searchDocuments(
  query: string
): Promise<DocumentSearchResult[]> {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return [];
    throw e;
  }
  if (!query || query.trim().length < 2) return [];

  const kwResults = await prismadb.documents.findMany({
    where: {
      parent_document_id: null,
      ...documentReadScopeWhere(user),
      AND: [
        {
          OR: [
            { document_name: { contains: query } },
            { summary: { contains: query } },
          ],
        },
      ],
    },
    take: 5,
    select: {
      id: true,
      document_name: true,
      summary: true,
      document_system_type: true,
      accounts: { select: { account: { select: { name: true } } }, take: 1 },
    },
  });

  let semResults: { id: string; similarity: number }[] = [];
  try {
    const embedding = await generateEmbedding(query.trim());
    const targetEmbeddings = await prismadb.crm_Embeddings_Documents.findMany({
      select: {
        document_id: true,
        embedding: true,
      },
      take: 25,
    });

    const calculated = targetEmbeddings
      .map((t) => {
        if (!t.embedding) return null;
        const targetVec: number[] = Array.isArray(t.embedding)
          ? (t.embedding as unknown as number[])
          : JSON.parse(String(t.embedding));
        const sim = cosineSimilarity(embedding, targetVec);
        return { id: t.document_id, similarity: sim };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null && r.similarity > 0.7)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 5);

    const allowedIds = new Set(
      await filterAuthorizedDocumentIds(
        user,
        calculated.map((r) => r.id),
      ),
    );
    semResults = calculated.filter((r) => allowedIds.has(r.id));
  } catch {
    // Fall back to keyword-only
  }

  const kwIds = new Set(kwResults.map((r) => r.id));
  const semOnlyIds = semResults.filter((r) => !kwIds.has(r.id)).map((r) => r.id);

  let extraDocs: typeof kwResults = [];
  if (semOnlyIds.length > 0) {
    extraDocs = await prismadb.documents.findMany({
      where: { id: { in: semOnlyIds }, parent_document_id: null },
      select: {
        id: true,
        document_name: true,
        summary: true,
        document_system_type: true,
        accounts: { select: { account: { select: { name: true } } }, take: 1 },
      },
    });
  }

  return [...kwResults, ...extraDocs].map((r) => ({
    id: r.id,
    name: r.document_name,
    summary: r.summary,
    systemType: r.document_system_type,
    accountName: r.accounts?.[0]?.account?.name ?? null,
  }));
}
