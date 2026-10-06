"use server";
import { prismadb } from "@/lib/prisma";
import {
  requireAuthenticated,
  assertCanWriteTemplate,
  AuthenticationError,
  AuthorizationError,
} from "@/lib/authz";

const truncate = (str?: string | null, max = 190) => {
  if (!str) return undefined;
  const trimmed = str.trim();
  return trimmed.length > max ? trimmed.substring(0, max) : trimmed;
};

export const updateTemplate = async (
  id: string,
  data: Partial<{
    name: string;
    description: string;
    subject_default: string;
    content_html: string;
    content_json: object;
  }>
) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    throw e;
  }

  try {
    await assertCanWriteTemplate(user, id);
  } catch (e) {
    if (e instanceof AuthorizationError) return { error: "Not found" };
    throw e;
  }

  const sanitizedData = {
    ...data,
    ...(data.name !== undefined ? { name: truncate(data.name, 190) || "Template" } : {}),
    ...(data.description !== undefined ? { description: truncate(data.description, 500) } : {}),
    ...(data.subject_default !== undefined ? { subject_default: truncate(data.subject_default, 190) } : {}),
  };

  return prismadb.crm_campaign_templates.update({ where: { id }, data: sanitizedData });
};
