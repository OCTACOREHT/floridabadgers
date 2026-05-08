import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { createSupabaseServiceClient } from "@/lib/supabase/server";
import { requireApiUser } from "@/lib/auth/api-guard";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const DEFAULT_BUCKET = "news-images";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

function toSafeFolder(value: string | null): string {
  const normalized = (value ?? "general")
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  return normalized || "general";
}

function extensionFromFile(file: File): string {
  const byMime = EXT_BY_MIME[file.type.toLowerCase()];
  if (byMime) return byMime;

  const fromName = file.name.split(".").pop()?.toLowerCase().trim();
  if (fromName && /^[a-z0-9]{2,8}$/.test(fromName)) {
    return fromName;
  }

  return "bin";
}

async function ensurePublicBucket(bucketName: string) {
  const supabase = createSupabaseServiceClient();
  const { data, error } = await supabase.storage.getBucket(bucketName);
  if (!error && data) {
    if (data.public) return;
    await supabase.storage.updateBucket(bucketName, { public: true });
    return;
  }

  await supabase.storage.createBucket(bucketName, {
    public: true,
    allowedMimeTypes: ["image/*"],
    fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
  });
}

export async function POST(request: NextRequest) {
  const guardResponse = await requireApiUser(request);
  if (guardResponse) return guardResponse;

  try {
    const formData = await request.formData();
    const maybeFile = formData.get("file");
    if (!(maybeFile instanceof File)) {
      return NextResponse.json({ error: "Image file is required." }, { status: 400 });
    }

    if (!maybeFile.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    }

    if (maybeFile.size <= 0) {
      return NextResponse.json({ error: "Image file is empty." }, { status: 400 });
    }

    if (maybeFile.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json(
        { error: "Image is too large (max 8MB)." },
        { status: 400 }
      );
    }

    const folder = toSafeFolder(String(formData.get("table") ?? "general"));
    const bucket = (process.env.SUPABASE_NEWS_IMAGES_BUCKET ?? DEFAULT_BUCKET).trim() || DEFAULT_BUCKET;
    const extension = extensionFromFile(maybeFile);
    const filePath = `${folder}/${Date.now()}-${randomUUID()}.${extension}`;

    await ensurePublicBucket(bucket);

    const bytes = await maybeFile.arrayBuffer();
    const supabase = createSupabaseServiceClient();
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, bytes, {
        contentType: maybeFile.type || "application/octet-stream",
        upsert: false,
        cacheControl: "31536000",
      });

    if (uploadError) {
      return NextResponse.json({ error: uploadError.message }, { status: 400 });
    }

    const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
    return NextResponse.json(
      {
        imageUrl: data.publicUrl,
        bucket,
        path: filePath,
      },
      { status: 201 }
    );
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unexpected server error" },
      { status: 500 }
    );
  }
}
