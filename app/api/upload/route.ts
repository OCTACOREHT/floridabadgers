import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const MAX_IMAGE_SIZE_BYTES = 8 * 1024 * 1024;
const DEFAULT_BUCKET = "registration-photos";

const EXT_BY_MIME: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

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

  const { error: createError } = await supabase.storage.createBucket(bucketName, {
    public: true,
    allowedMimeTypes: ["image/*"],
    fileSizeLimit: MAX_IMAGE_SIZE_BYTES,
  });

  if (createError && !createError.message.toLowerCase().includes("already exists")) {
    throw createError;
  }
}

/**
 * POST /api/upload
 * Accepts multipart/form-data with a single "file" field and returns a public URL.
 * Uses Supabase Storage so uploads work in serverless production.
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const maybeFile = formData.get("file");
    if (!(maybeFile instanceof File)) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!maybeFile.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are allowed." }, { status: 400 });
    }

    if (maybeFile.size <= 0) {
      return NextResponse.json({ error: "Image file is empty." }, { status: 400 });
    }

    if (maybeFile.size > MAX_IMAGE_SIZE_BYTES) {
      return NextResponse.json({ error: "Image is too large (max 8MB)." }, { status: 400 });
    }

    const bucket = (process.env.SUPABASE_REGISTRATION_PHOTOS_BUCKET ?? DEFAULT_BUCKET).trim() || DEFAULT_BUCKET;
    const extension = extensionFromFile(maybeFile);
    const filePath = `join/${Date.now()}-${randomUUID()}.${extension}`;

    await ensurePublicBucket(bucket);

    const bytes = await maybeFile.arrayBuffer();
    const supabase = createSupabaseServiceClient();
    const { error: uploadError } = await supabase.storage.from(bucket).upload(filePath, bytes, {
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
        url: data.publicUrl,
        bucket,
        path: filePath,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Upload error:", error);
    const message = error instanceof Error ? error.message : "Upload failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
