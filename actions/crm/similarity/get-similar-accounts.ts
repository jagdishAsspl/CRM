"use server";
import { prismadb } from "@/lib/prisma";
import {
  requireAuthenticated,
  assertCanReadAccount,
  filterAuthorizedAccountIds,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

export type SimilarRecord = {
  id: string;
  name: string;
  subtitle: string;
  similarity: number;
  href: string;
};

export type SimilarityResult =
  | { status: "ok"; records: SimilarRecord[] }
  | { status: "no_embedding" }
  | { status: "error"; message: string };

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

export async function getSimilarAccounts(
  recordId: string,
  limit = 5
): Promise<SimilarityResult> {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError)
      return { status: "ok", records: [] };
    throw e;
  }
  try {
    await assertCanReadAccount(user, recordId);
  } catch (e) {
    if (e instanceof AuthorizationError)
      return { status: "ok", records: [] };
    throw e;
  }

  try {
    const source = await prismadb.crm_Embeddings_Accounts.findUnique({
      where: { account_id: recordId },
      select: { embedding: true },
    });
    if (!source || !source.embedding) return { status: "no_embedding" };

    const sourceVec: number[] = Array.isArray(source.embedding)
      ? (source.embedding as unknown as number[])
      : JSON.parse(String(source.embedding));

    const targets = await prismadb.crm_Embeddings_Accounts.findMany({
      where: { account_id: { not: recordId } },
      select: {
        account_id: true,
        embedding: true,
        account: { select: { id: true, name: true, email: true } },
      },
      take: limit * 5,
    });

    const calculated = targets
      .map((t) => {
        if (!t.embedding || !t.account) return null;
        const targetVec: number[] = Array.isArray(t.embedding)
          ? (t.embedding as unknown as number[])
          : JSON.parse(String(t.embedding));
        const sim = cosineSimilarity(sourceVec, targetVec);
        return {
          id: t.account.id,
          name: t.account.name,
          email: t.account.email,
          similarity: sim,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.similarity - a.similarity);

    const allowed = new Set(
      await filterAuthorizedAccountIds(user, calculated.map((r) => r.id)),
    );

    return {
      status: "ok",
      records: calculated
        .filter((r) => allowed.has(r.id))
        .slice(0, limit)
        .map((r) => ({
          id: r.id,
          name: r.name,
          subtitle: r.email ?? "",
          similarity: Number(r.similarity),
          href: `/crm/accounts/${r.id}`,
        })),
    };
  } catch (error) {
    console.error("[GET_SIMILAR_ACCOUNTS]", error);
    return { status: "error", message: "Failed to fetch similar accounts" };
  }
}
