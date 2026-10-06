"use server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  requireAuthenticated,
  assertCanWriteBoard,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

const truncate = (str?: string | null, max = 190) => {
  if (!str) return "";
  const trimmed = str.trim();
  return trimmed.length > max ? trimmed.substring(0, max) : trimmed;
};

export const updateProject = async (data: {
  id: string;
  title: string;
  description: string;
  visibility: string;
}) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    throw e;
  }

  const { id, title, description, visibility } = data;
  if (!title) return { error: "Missing project name" };
  if (!description) return { error: "Missing project description" };

  try {
    await assertCanWriteBoard(user, id);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: "Forbidden" };
    throw e;
  }

  try {
    await prismadb.boards.update({
      where: { id },
      data: {
        title: truncate(title, 190),
        description: truncate(description, 190),
        visibility: visibility || "public",
        updatedBy: user.id,
        updatedAt: new Date(),
      },
    });

    revalidatePath("/[locale]/(routes)/projects", "page");
    return { success: true };
  } catch (error) {
    console.log("[UPDATE_PROJECT]", error);
    return { error: "Failed to update project" };
  }
};
