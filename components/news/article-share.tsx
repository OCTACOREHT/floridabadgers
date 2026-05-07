"use client";

import { useState, type ComponentType } from "react";
import {
  RiCheckLine,
  RiFacebookFill,
  RiLinksLine,
  RiMailFill,
  RiShareForwardLine,
  RiTwitterXFill,
  RiWhatsappFill,
} from "@remixicon/react";

import { Button } from "@/components/ui/button";

type Props = {
  title: string;
  path: string;
};

type ShareProvider = "whatsapp" | "facebook" | "x" | "email";

type ShareLink = {
  label: string;
  provider: ShareProvider;
  iconClassName: string;
  Icon: ComponentType<{ className?: string }>;
};

function buildAbsoluteUrl(path: string): string {
  if (typeof window === "undefined") {
    return path;
  }
  if (/^https?:\/\//i.test(path)) {
    return path;
  }
  return `${window.location.origin}${path.startsWith("/") ? path : `/${path}`}`;
}

export function ArticleShare({ title, path }: Props) {
  const [copied, setCopied] = useState(false);

  const shareLinks: ShareLink[] = [
    {
      label: "WhatsApp",
      provider: "whatsapp",
      Icon: RiWhatsappFill,
      iconClassName: "text-emerald-600",
    },
    {
      label: "Facebook",
      provider: "facebook",
      Icon: RiFacebookFill,
      iconClassName: "text-blue-600",
    },
    {
      label: "X",
      provider: "x",
      Icon: RiTwitterXFill,
      iconClassName: "text-slate-900",
    },
    {
      label: "Email",
      provider: "email",
      Icon: RiMailFill,
      iconClassName: "text-rose-600",
    },
  ];

  const openShareLink = (provider: ShareProvider) => {
    const absoluteUrl = buildAbsoluteUrl(path);
    const encodedUrl = encodeURIComponent(absoluteUrl);
    const encodedTitle = encodeURIComponent(title);

    let targetUrl = "";
    if (provider === "whatsapp") {
      targetUrl = `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`;
    }
    if (provider === "facebook") {
      targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
    }
    if (provider === "x") {
      targetUrl = `https://x.com/intent/post?text=${encodedTitle}&url=${encodedUrl}`;
    }
    if (provider === "email") {
      targetUrl = `mailto:?subject=${encodedTitle}&body=${encodedUrl}`;
    }

    if (!targetUrl) return;

    if (provider === "email") {
      window.open(targetUrl, "_self");
      return;
    }

    window.open(targetUrl, "_blank", "noopener,noreferrer");
  };

  const handleCopy = async () => {
    const absoluteUrl = buildAbsoluteUrl(path);

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(absoluteUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = absoluteUrl;
        textarea.setAttribute("readonly", "true");
        textarea.style.position = "absolute";
        textarea.style.left = "-9999px";
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setCopied(false);
    }
  };

  const handleNativeShare = async () => {
    const absoluteUrl = buildAbsoluteUrl(path);

    if (typeof navigator === "undefined" || typeof navigator.share !== "function") {
      await handleCopy();
      return;
    }

    try {
      await navigator.share({
        title,
        url: absoluteUrl,
      });
    } catch {
      // User canceled or browser blocked share.
    }
  };

  return (
    <section className="mt-10 border-t border-slate-200 pt-6">
      <h2 className="text-xs font-black uppercase tracking-[0.2em] text-slate-600">Partager cet article</h2>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button type="button" size="sm" variant="default" onClick={handleNativeShare} className="rounded-full">
          <RiShareForwardLine className="mr-1 size-4" />
          Partager
        </Button>
        <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="rounded-full">
          {copied ? <RiCheckLine className="mr-1 size-4" /> : <RiLinksLine className="mr-1 size-4" />}
          {copied ? "Lien copie" : "Copier le lien"}
        </Button>
        {shareLinks.map((link) => (
          <button
            key={link.label}
            type="button"
            onClick={() => openShareLink(link.provider)}
            className="inline-flex items-center gap-1 rounded-full border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-500 hover:text-slate-900"
          >
            <link.Icon className={`size-4 ${link.iconClassName}`} />
            {link.label}
          </button>
        ))}
      </div>
    </section>
  );
}
