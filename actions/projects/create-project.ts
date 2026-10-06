"use server";
import { prismadb } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { requireAuthenticated, AuthenticationError } from "@/lib/authz";

const truncate = (str?: string | null, max = 190) => {
  if (!str) return "";
  const trimmed = str.trim();
  return trimmed.length > max ? trimmed.substring(0, max) : trimmed;
};

export const createProject = async (data: {
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

  const { title, description, visibility } = data;
  if (!title) return { error: "Missing project name" };
  if (!description) return { error: "Missing project description" };

  try {
    const boardsCount = await prismadb.boards.count();

    const newBoard = await prismadb.boards.create({
      data: {
        v: 0,
        user: user.id,
        title: truncate(title, 190),
        description: truncate(description, 190),
        position: boardsCount > 0 ? BigInt(boardsCount) : BigInt(0),
        visibility: visibility || "public",
        sharedWith: [user.id],
        createdBy: user.id,
      },
    });

    await prismadb.sections.create({
      data: {
        v: 0,
        board: newBoard.id,
        title: "Backlog",
        position: BigInt(0),
      },
    });

    revalidatePath("/[locale]/(routes)/projects", "page");
    return {
      data: {
        ...newBoard,
        position: newBoard.position != null ? Number(newBoard.position) : 0,
        favouritePosition: newBoard.favouritePosition != null ? Number(newBoard.favouritePosition) : null,
      },
    };
  } catch (error: any) {
    console.error("[CREATE_PROJECT]", error);
    return { error: error?.message || "Failed to create project" };
  }
};
