import { NextResponse } from "next/server";

import { createSupabaseServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const FALLBACK_IMAGE_PATH = "/images/IMG_6281.JPG.jpeg";

type NewsImageRow = {
  photo_url: string | null;
};

function fallbackRedirectUrl(requestUrl: string): URL {
  return new URL(FALLBACK_IMAGE_PATH, requestUrl);
}

function parseDataImageUrl(dataUrl: string): { mimeType: string; base64: string } | null {
  const match = dataUrl.match(/^data:(image\/[a-z0-9.+-]+);base64,([\s\S]+)$/i);
  if (!match) {
    return null;
  }

  return {
    mimeType: match[1].toLowerCase(),
    base64: match[2],
  };
}

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const normalizedId = id.trim();
  if (!normalizedId) {
    return NextResponse.redirect(fallbackRedirectUrl(request.url));
  }

  try {
    const supabase = createSupabaseServiceClient();
    const { data, error } = await supabase
      .from("actualites")
      .select("photo_url")
      .eq("id", normalizedId)
      .eq("is_published", true)
      .maybeSingle();

    if (error || !data) {
      return NextResponse.redirect(fallbackRedirectUrl(request.url));
    }

    const row = data as NewsImageRow;
    const photoUrl = row.photo_url?.trim() ?? "";
    if (!photoUrl) {
      return NextResponse.redirect(fallbackRedirectUrl(request.url));
    }

    if (photoUrl.startsWith("data:image/")) {
      const parsed = parseDataImageUrl(photoUrl);
      if (!parsed) {
        return NextResponse.redirect(fallbackRedirectUrl(request.url));
      }

      const bytes = Buffer.from(parsed.base64, "base64");
      if (!bytes.length) {
        return NextResponse.redirect(fallbackRedirectUrl(request.url));
      }
      const arrayBuffer = bytes.buffer.slice(
        bytes.byteOffset,
        bytes.byteOffset + bytes.byteLength
      ) as ArrayBuffer;
      const imageBlob = new Blob([arrayBuffer], { type: parsed.mimeType });

      return new NextResponse(imageBlob, {
        status: 200,
        headers: {
          "Content-Type": parsed.mimeType,
          "Cache-Control": "public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800",
        },
      });
    }

    if (photoUrl.startsWith("/")) {
      return NextResponse.redirect(new URL(photoUrl, request.url));
    }

    if (photoUrl.startsWith("http://") || photoUrl.startsWith("https://")) {
      return NextResponse.redirect(new URL(photoUrl));
    }

    return NextResponse.redirect(fallbackRedirectUrl(request.url));
  } catch {
    return NextResponse.redirect(fallbackRedirectUrl(request.url));
  }
}
