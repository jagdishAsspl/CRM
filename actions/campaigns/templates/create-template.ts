"use server";
import { prismadb } from "@/lib/prisma";
import { requireAuthenticated, AuthenticationError } from "@/lib/authz";

const truncate = (str?: string | null, max = 190) => {
  if (!str) return undefined;
  const trimmed = str.trim();
  return trimmed.length > max ? trimmed.substring(0, max) : trimmed;
};

export const createTemplate = async (data: {
  name: string;
  description?: string;
  subject_default?: string;
  content_html: string;
  content_json: object;
}) => {
  let user;
  try {
    user = await requireAuthenticated();
  } catch (e) {
    if (e instanceof AuthenticationError) return { error: "Unauthorized" };
    throw e;
  }

  return prismadb.crm_campaign_templates.create({
    data: {
      ...data,
      name: truncate(data.name, 190) || "Template",
      description: truncate(data.description, 500),
      subject_default: truncate(data.subject_default, 190),
      created_by: user.id,
    },
  });
};
