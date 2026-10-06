import path from "path";
import fs from "fs/promises";
import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth-server";
import { randomUUID } from "crypto";

const ALLOWED_FOLDERS = ["avatars", "images", "documents", "uploads"] as const;
type AllowedFolder = (typeof ALLOWED_FOLDERS)[number];

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/x-png",
  "image/pjpeg",
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "application/octet-stream",
]);

const ALLOWED_EXTENSIONS = new Set([
  "jpg", "jpeg", "png", "gif", "webp", "pdf", "doc", "docx", "txt"
]);

export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const rawFolder = (formData.get("folder") as string) || "uploads";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const originalName = path.basename(file.name || "file");
    const ext = originalName.includes(".") ? originalName.split(".").pop()?.trim().toLowerCase() || "bin" : "bin";

    if (!ALLOWED_CONTENT_TYPES.has(file.type) && !ALLOWED_EXTENSIONS.has(ext)) {
      return NextResponse.json({ error: "Content type or extension not allowed" }, { status: 400 });
    }

    const folder: AllowedFolder = ALLOWED_FOLDERS.includes(rawFolder as AllowedFolder)
      ? (rawFolder as AllowedFolder)
      : "uploads";

    const filename = `${randomUUID()}.${ext}`;
    const key = `${folder}/${filename}`;

    const targetDir = path.join(process.cwd(), "public", "uploads", folder);
    await fs.mkdir(targetDir, { recursive: true });

    const filePath = path.join(targetDir, filename);
    const bytes = await file.arrayBuffer();
    await fs.writeFile(filePath, Buffer.from(bytes));

    const fileUrl = `/uploads/${folder}/${filename}`;

    return NextResponse.json({ fileUrl, key });
  } catch (err) {
    console.error("Direct file upload error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
