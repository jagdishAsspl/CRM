"use server";
import { prismadb } from "@/lib/prisma";
import {
  requireAuthenticated,
  assertCanReadOpportunity,
  filterAuthorizedOpportunityIds,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";
import type { SimilarityResult } from "./get-similar-accounts";

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

export async function getSimilarOpportunities(
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
    await assertCanReadOpportunity(user, recordId);
  } catch (e) {
    if (e instanceof AuthorizationError)
      return { status: "ok", records: [] };
    throw e;
  }

  try {
    const source = await prismadb.crm_Embeddings_Opportunities.findUnique({
      where: { opportunity_id: recordId },
      select: { embedding: true },
    });
    if (!source || !source.embedding) return { status: "no_embedding" };

    const sourceVec: number[] = Array.isArray(source.embedding)
      ? (source.embedding as unknown as number[])
      : JSON.parse(String(source.embedding));

    const targets = await prismadb.crm_Embeddings_Opportunities.findMany({
      where: { opportunity_id: { not: recordId } },
      select: {
        opportunity_id: true,
        embedding: true,
        opportunity: {
          select: {
            id: true,
            name: true,
            assigned_sales_stage: { select: { name: true } },
          },
        },
      },
      take: limit * 5,
    });

    const calculated = targets
      .map((t) => {
        if (!t.embedding || !t.opportunity) return null;
        const targetVec: number[] = Array.isArray(t.embedding)
          ? (t.embedding as unknown as number[])
          : JSON.parse(String(t.embedding));
        const sim = cosineSimilarity(sourceVec, targetVec);
        return {
          id: t.opportunity.id,
          name: t.opportunity.name,
          stage_name: t.opportunity.assigned_sales_stage?.name ?? null,
          similarity: sim,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.similarity - a.similarity);

    const allowed = new Set(
      await filterAuthorizedOpportunityIds(user, calculated.map((r) => r.id)),
    );

    return {
      status: "ok",
      records: calculated
        .filter((r) => allowed.has(r.id))
        .slice(0, limit)
        .map((r) => ({
          id: r.id,
          name: r.name ?? "",
          subtitle: r.stage_name ?? "",
          similarity: Number(r.similarity),
          href: `/crm/opportunities/${r.id}`,
        })),
    };
  } catch (error) {
    console.error("[GET_SIMILAR_OPPORTUNITIES]", error);
    return { status: "error", message: "Failed to fetch similar opportunities" };
  }
}
