"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  CalendarIcon,
  EyeIcon,
  MousePointerClickIcon,
  PencilIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  Trash2Icon,
  DownloadIcon,
  CheckIcon,
  XIcon,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import type { DashboardTableConfig, DashboardTableField } from "@/lib/dashboard/tables";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type Props = {
  config: DashboardTableConfig;
  initialRows: Record<string, unknown>[];
};

type PanelMode = "create" | "view" | "edit";
type RenderFieldOptions = {
  squarePhotoBox?: boolean;
};
type ArticleRichCommand = "bold" | "italic" | "link" | "bullet-list" | "quote";
type PdfWithAutoTable = jsPDF & { lastAutoTable?: { finalY: number } };

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (value === "junior_foundation") return "Junior Program";
  if (value === "stage_english") return "Stage Program";
  if (value === "en_attente") return "Pending";
  if (value === "accepte") return "Accepted";
  if (value === "refuse") return "Refused";

  // Auto-format ISO dates
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
    return formatDashboardDate(value);
  }

  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function formatColumnLabel(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(" ");
}

const ARTICLE_FALLBACK_IMAGE = "/images/IMG_6281.JPG.jpeg";
const MAX_UPLOAD_IMAGE_BYTES = 8 * 1024 * 1024;
const MAX_UPLOAD_IMAGE_LONGEST_SIDE = 2400;
const MIN_UPLOAD_IMAGE_LONGEST_SIDE = 960;
const ARTICLE_LINK_PROTOCOL_PATTERN = /^(https?:\/\/|mailto:|tel:|\/)/i;
const ARTICLE_ALLOWED_HTML_TAGS = new Set([
  "p",
  "br",
  "strong",
  "b",
  "em",
  "i",
  "u",
  "a",
  "ul",
  "ol",
  "li",
  "blockquote",
]);

function formatDashboardDate(value: unknown): string {
  if (typeof value !== "string" || !value.trim()) {
    return "-";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return String(value);
  }

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(parsed);
}

// Helper to compute category from age if missing
function getCategoryFallback(age: unknown): string {
  const numAge = Number(age);
  if (!numAge) return "-";
  if (numAge <= 5) return "U5";
  if (numAge <= 7) return "U7";
  if (numAge <= 9) return "U9";
  if (numAge <= 11) return "U11";
  if (numAge <= 13) return "U13";
  if (numAge <= 15) return "U15";
  if (numAge <= 17) return "U17";
  if (numAge <= 19) return "U19";
  if (numAge <= 21) return "U21";
  return "U23";
}

// Helper to compute registration ID from row data if missing
function getRegistrationIdFallback(row: Record<string, unknown>): string {
  if (row.registration_id) return String(row.registration_id);
  const nameParts = String(row.nom_complet || "PLAYER").split(/\s+/);
  const initials = nameParts.map(part => part.substring(0, 2).toUpperCase()).join("");
  const id = String(row.id || "").substring(0, 4).toUpperCase();
  return `FBCA-${initials}-${id}`;
}

function getPositiveCount(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed) && parsed > 0) {
      return parsed;
    }
  }
  return 0;
}

function buildInitialForm(config: DashboardTableConfig): Record<string, unknown> {
  return Object.fromEntries(
    config.createFields.map((field) => [
      field.key,
      field.defaultValue ?? (field.type === "boolean" ? false : ""),
    ])
  );
}

function isPhotoField(field: DashboardTableField): boolean {
  return field.type === "text" && /(photo|logo|image)/i.test(field.key);
}

function getFieldSpanClass(field: DashboardTableField): string {
  if (field.type === "textarea" || field.type === "json") {
    return "space-y-2 md:col-span-2 xl:col-span-3";
  }
  if (field.type === "boolean") {
    return "space-y-2 md:col-span-2 xl:col-span-1";
  }
  if (isPhotoField(field)) {
    return "space-y-2 md:col-span-2";
  }
  return "space-y-2";
}

function getPhotoPreviewSource(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;

  if (
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:image/") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("/")
  ) {
    return trimmed;
  }

  return null;
}

function stripHtmlToText(value: string): string {
  return value
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeArticleLink(rawValue: string): string | null {
  const trimmed = rawValue.trim();
  if (!trimmed) return null;
  if (ARTICLE_LINK_PROTOCOL_PATTERN.test(trimmed)) {
    return trimmed;
  }
  return `https://${trimmed.replace(/^\/+/, "")}`;
}

function sanitizeArticleEditorHtml(value: string): string {
  if (typeof document === "undefined") {
    return value.trim();
  }

  const container = document.createElement("div");
  container.innerHTML = value;
  container.querySelectorAll("script,style,iframe,object,embed").forEach((node) => node.remove());

  const allElements = Array.from(container.querySelectorAll<HTMLElement>("*"));
  for (const element of allElements) {
    const tagName = element.tagName.toLowerCase();

    if (!ARTICLE_ALLOWED_HTML_TAGS.has(tagName)) {
      const fragment = document.createDocumentFragment();
      while (element.firstChild) {
        fragment.appendChild(element.firstChild);
      }
      element.replaceWith(fragment);
      continue;
    }

    for (const attribute of Array.from(element.attributes)) {
      const attributeName = attribute.name.toLowerCase();
      if (
        attributeName.startsWith("on") ||
        attributeName === "style" ||
        attributeName === "class" ||
        attributeName === "id"
      ) {
        element.removeAttribute(attribute.name);
      }
    }

    if (tagName === "a") {
      const href = (element.getAttribute("href") ?? "").trim();
      if (!href || !ARTICLE_LINK_PROTOCOL_PATTERN.test(href)) {
        const fragment = document.createDocumentFragment();
        while (element.firstChild) {
          fragment.appendChild(element.firstChild);
        }
        element.replaceWith(fragment);
        continue;
      }
      element.setAttribute("href", href);
      element.setAttribute("target", "_blank");
      element.setAttribute("rel", "noopener noreferrer");
    }
  }

  const normalized = container.innerHTML
    .replace(/<div>/gi, "<p>")
    .replace(/<\/div>/gi, "</p>")
    .trim();

  if (!normalized || normalized === "<br>") {
    return "";
  }
  return normalized;
}

function isArticleEditorEmpty(value: string): boolean {
  return stripHtmlToText(value).length === 0;
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new window.Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("Unable to decode image."));
    };

    image.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Unable to compress image."));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality
    );
  });
}

async function compressImageForUpload(file: File, maxBytes: number): Promise<File> {
  if (file.size <= maxBytes) {
    return file;
  }

  const image = await loadImageFromFile(file);
  const originalWidth = image.naturalWidth || image.width;
  const originalHeight = image.naturalHeight || image.height;
  if (!originalWidth || !originalHeight) {
    return file;
  }

  const normalizedType = file.type.toLowerCase();
  const outputType: "image/jpeg" | "image/webp" =
    normalizedType === "image/jpeg" || normalizedType === "image/webp"
      ? normalizedType
      : "image/jpeg";

  let width = originalWidth;
  let height = originalHeight;
  const initialLongestSide = Math.max(width, height);
  if (initialLongestSide > MAX_UPLOAD_IMAGE_LONGEST_SIDE) {
    const scale = MAX_UPLOAD_IMAGE_LONGEST_SIDE / initialLongestSide;
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  let quality = 0.9;
  let bestBlob: Blob | null = null;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.round(width));
    canvas.height = Math.max(1, Math.round(height));

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to process image.");
    }
    context.imageSmoothingEnabled = true;
    context.imageSmoothingQuality = "high";
    context.drawImage(image, 0, 0, canvas.width, canvas.height);

    const blob = await canvasToBlob(canvas, outputType, quality);
    if (!bestBlob || blob.size < bestBlob.size) {
      bestBlob = blob;
    }
    if (blob.size <= maxBytes) {
      return new File([blob], file.name, {
        type: outputType,
        lastModified: file.lastModified,
      });
    }

    if (typeof quality === "number" && quality > 0.58) {
      quality = Math.max(0.58, quality - 0.12);
      continue;
    }

    const longestSide = Math.max(width, height);
    if (longestSide <= MIN_UPLOAD_IMAGE_LONGEST_SIDE) {
      break;
    }

    width = Math.max(1, Math.round(width * 0.85));
    height = Math.max(1, Math.round(height * 0.85));
    if (typeof quality === "number") {
      quality = Math.min(0.82, quality + 0.06);
    }
  }

  if (!bestBlob || bestBlob.size >= file.size) {
    return file;
  }

  return new File([bestBlob], file.name, {
    type: outputType,
    lastModified: file.lastModified,
  });
}

function revokePreviewUrls(urlMap: Record<string, string>) {
  for (const value of Object.values(urlMap)) {
    if (value.startsWith("blob:")) {
      URL.revokeObjectURL(value);
    }
  }
}

function toDatetimeLocal(value: string): string {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return value.slice(0, 16);
  }
  const localDate = new Date(parsed.getTime() - parsed.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

function buildFormFromRow(
  config: DashboardTableConfig,
  row: Record<string, unknown>
): Record<string, unknown> {
  const mappedEntries = config.createFields.map((field) => {
    const raw = row[field.key];
    if (field.type === "boolean") {
      return [field.key, Boolean(raw)];
    }
    if (raw === undefined || raw === null) {
      return [field.key, ""];
    }
    if (field.type === "date") {
      return [field.key, String(raw).slice(0, 10)];
    }
    if (field.type === "datetime") {
      return [field.key, toDatetimeLocal(String(raw))];
    }
    if (field.type === "json") {
      return [field.key, typeof raw === "string" ? raw : JSON.stringify(raw, null, 2)];
    }
    return [field.key, String(raw)];
  });

  return Object.fromEntries(mappedEntries);
}

export function DashboardTableManager({ config, initialRows }: Props) {
  const [rows, setRows] = useState<Record<string, unknown>[]>(initialRows);
  const [searchTerm, setSearchTerm] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [tableError, setTableError] = useState<string | null>(null);

  const [panelOpen, setPanelOpen] = useState(false);
  const [panelMode, setPanelMode] = useState<PanelMode>("create");
  const [panelValues, setPanelValues] = useState<Record<string, unknown>>(() => buildInitialForm(config));
  const [panelError, setPanelError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [activeRowId, setActiveRowId] = useState<string | null>(null);
  const [draggingPhotoField, setDraggingPhotoField] = useState<string | null>(null);
  const [photoFileNames, setPhotoFileNames] = useState<Record<string, string>>({});
  const [photoFiles, setPhotoFiles] = useState<Record<string, File>>({});
  const [photoPreviewUrls, setPhotoPreviewUrls] = useState<Record<string, string>>({});
  const photoPreviewUrlsRef = useRef<Record<string, string>>({});
  const panelScrollRef = useRef<HTMLDivElement | null>(null);
  const articleEditorRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const listColumns = useMemo(
    () => Array.from(new Set(config.listColumns)).slice(0, 6),
    [config.listColumns]
  );
  const isPlayersTable = config.table === "joueurs";
  const isArticlesTable = config.table === "actualites";
  const visibleFields = useMemo(
    () => config.createFields.filter((field) => !(isPlayersTable && field.key === "bio")),
    [config.createFields, isPlayersTable]
  );
  const fieldByKey = useMemo(() => new Map(visibleFields.map((field) => [field.key, field])), [visibleFields]);
  const articlePhotoField = isArticlesTable ? fieldByKey.get("photo_url") ?? null : null;
  const articleBodyFields = isArticlesTable
    ? visibleFields.filter((field) => field.key !== "photo_url")
    : visibleFields;
  const playerPhotoField = isPlayersTable ? fieldByKey.get("photo_url") ?? null : null;
  const playerTopRightFieldKeys = ["nom", "prenom", "date_naissance", "age", "sexe", "categorie_id"];
  const playerTopRightFields = isPlayersTable
    ? playerTopRightFieldKeys
        .map((key) => fieldByKey.get(key))
        .filter((field): field is DashboardTableField => Boolean(field))
    : [];
  const playerBottomFields = isPlayersTable
    ? visibleFields.filter(
        (field) => field.key !== "photo_url" && !playerTopRightFieldKeys.includes(field.key)
      )
    : [];
  const fieldLabelByKey = useMemo(
    () => Object.fromEntries(visibleFields.map((field) => [field.key, field.label])),
    [visibleFields]
  );
  const articleDescriptionValue = isArticlesTable ? String(panelValues.description ?? "") : "";
  const normalizedSearchTerm = searchTerm.trim().toLowerCase();
  const filteredRows = useMemo(() => {
    if (!normalizedSearchTerm) {
      return rows;
    }

    return rows.filter((row) => {
      const haystack = Object.entries(row)
        .flatMap(([key, value]) => [key, fieldLabelByKey[key] ?? key, formatValue(value)])
        .join(" ")
        .toLowerCase();

      return haystack.includes(normalizedSearchTerm);
    });
  }, [fieldLabelByKey, normalizedSearchTerm, rows]);

  const updateValue = (key: string, value: unknown) => {
    setPanelValues((prev) => ({ ...prev, [key]: value }));
  };

  const syncArticleEditorValue = (fieldKey: string) => {
    const editor = articleEditorRefs.current[fieldKey];
    if (!editor) return;

    const nextValue = sanitizeArticleEditorHtml(editor.innerHTML);
    if (String(panelValues[fieldKey] ?? "") === nextValue) {
      return;
    }
    updateValue(fieldKey, nextValue);
  };

  const applyArticleEditorCommand = (fieldKey: string, command: ArticleRichCommand) => {
    if (panelReadonly) return;
    const editor = articleEditorRefs.current[fieldKey];
    if (!editor || typeof document === "undefined") return;
    editor.focus();

    if (command === "link") {
      const selection = window.getSelection();
      const hasSelectionInEditor =
        selection &&
        selection.rangeCount > 0 &&
        editor.contains(selection.anchorNode) &&
        editor.contains(selection.focusNode) &&
        selection.toString().trim().length > 0;

      if (!hasSelectionInEditor || !selection) {
        setPanelError("Selectionne le texte avant d'ajouter un lien.");
        return;
      }

      const preservedRange = selection.getRangeAt(0).cloneRange();
      const rawLink = window.prompt("Entrer l'URL du lien (ex: https://example.com)", "");
      if (rawLink === null) {
        return;
      }

      const link = normalizeArticleLink(rawLink);
      if (!link) {
        setPanelError("Lien invalide.");
        return;
      }

      selection.removeAllRanges();
      selection.addRange(preservedRange);
      document.execCommand("createLink", false, link);
    } else if (command === "bold") {
      document.execCommand("bold");
    } else if (command === "italic") {
      document.execCommand("italic");
    } else if (command === "bullet-list") {
      document.execCommand("insertUnorderedList");
    } else if (command === "quote") {
      document.execCommand("formatBlock", false, "blockquote");
    }

    setPanelError(null);
    syncArticleEditorValue(fieldKey);
  };

  useEffect(() => {
    if (!panelOpen) return;
    panelScrollRef.current?.scrollTo({ top: 0 });
  }, [panelOpen, panelMode, activeRowId]);

  useEffect(() => {
    if (!panelOpen || !isArticlesTable) {
      return;
    }

    const editor = articleEditorRefs.current.description;
    if (!editor) {
      return;
    }

    if (editor.innerHTML !== articleDescriptionValue) {
      editor.innerHTML = articleDescriptionValue;
    }
  }, [articleDescriptionValue, isArticlesTable, panelOpen]);

  useEffect(() => {
    photoPreviewUrlsRef.current = photoPreviewUrls;
  }, [photoPreviewUrls]);

  useEffect(() => {
    return () => {
      revokePreviewUrls(photoPreviewUrlsRef.current);
    };
  }, []);

  const resetPanelForm = () => {
    revokePreviewUrls(photoPreviewUrls);
    setPanelValues(buildInitialForm(config));
    setPanelError(null);
    setPhotoFileNames({});
    setPhotoFiles({});
    setPhotoPreviewUrls({});
    setDraggingPhotoField(null);
  };

  const openCreatePanel = () => {
    revokePreviewUrls(photoPreviewUrls);
    setPanelMode("create");
    setActiveRowId(null);
    setPanelValues(buildInitialForm(config));
    setPanelError(null);
    setPhotoFileNames({});
    setPhotoFiles({});
    setPhotoPreviewUrls({});
    setDraggingPhotoField(null);
    setPanelOpen(true);
  };

  const openViewPanel = (row: Record<string, unknown>) => {
    revokePreviewUrls(photoPreviewUrls);
    setPanelMode("view");
    setActiveRowId(String(row.id ?? ""));
    setPanelValues(buildFormFromRow(config, row));
    setPanelError(null);
    setPhotoFileNames({});
    setPhotoFiles({});
    setPhotoPreviewUrls({});
    setDraggingPhotoField(null);
    setPanelOpen(true);
  };

  const openEditPanel = (row: Record<string, unknown>) => {
    revokePreviewUrls(photoPreviewUrls);
    setPanelMode("edit");
    setActiveRowId(String(row.id ?? ""));
    setPanelValues(buildFormFromRow(config, row));
    setPanelError(null);
    setPhotoFileNames({});
    setPhotoFiles({});
    setPhotoPreviewUrls({});
    setDraggingPhotoField(null);
    setPanelOpen(true);
  };

  const clearPhotoField = (fieldKey: string) => {
    setPhotoPreviewUrls((prev) => {
      const current = prev[fieldKey];
      if (current?.startsWith("blob:")) {
        URL.revokeObjectURL(current);
      }
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    setPhotoFiles((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    setPhotoFileNames((prev) => {
      const next = { ...prev };
      delete next[fieldKey];
      return next;
    });
    updateValue(fieldKey, "");
  };

  const applyPhotoFile = async (field: DashboardTableField, file: File) => {
    if (!file.type.startsWith("image/")) {
      setPanelError("Le fichier doit etre une image.");
      return;
    }

    try {
      const processedFile = await compressImageForUpload(file, MAX_UPLOAD_IMAGE_BYTES);
      if (processedFile.size > MAX_UPLOAD_IMAGE_BYTES) {
        setPanelError("Image trop grande meme apres compression (max 8MB).");
        return;
      }

      const previewUrl = URL.createObjectURL(processedFile);
      setPhotoPreviewUrls((prev) => {
        const current = prev[field.key];
        if (current?.startsWith("blob:")) {
          URL.revokeObjectURL(current);
        }
        return { ...prev, [field.key]: previewUrl };
      });
      setPhotoFiles((prev) => ({ ...prev, [field.key]: processedFile }));
      setPhotoFileNames((prev) => ({ ...prev, [field.key]: file.name }));
      setPanelError(null);
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "Impossible de traiter l'image.");
    }
  };

  const uploadPhotoField = async (fieldKey: string, file: File): Promise<string> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("table", config.table);

    const response = await fetch("/api/dashboard/upload-image", {
      method: "POST",
      body: formData,
    });
    const json = (await response.json()) as { imageUrl?: string; error?: string };
    if (!response.ok || !json.imageUrl) {
      throw new Error(json.error ?? "Echec de l'upload de l'image.");
    }

    return json.imageUrl;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    setTableError(null);
    try {
      const response = await fetch(`/api/dashboard/tables/${config.table}?limit=120`, {
        cache: "no-store",
      });
      const json = (await response.json()) as { data?: Record<string, unknown>[]; error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Unable to load rows.");
      }
      setRows(json.data ?? []);
    } catch (err) {
      setTableError(err instanceof Error ? err.message : "Unable to load rows.");
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleDelete = async (id: string) => {
    setTableError(null);
    const confirmed = window.confirm("Delete this row?");
    if (!confirmed) return;

    try {
      const response = await fetch(`/api/dashboard/tables/${config.table}/${id}`, { method: "DELETE" });
      const json = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Delete failed.");
      }
      setRows((prev) => prev.filter((row) => String(row.id ?? "") !== id));
    } catch (err) {
      setTableError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  const updateRowStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/dashboard/tables/${config.table}/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ statut: newStatus }),
      });
      const json = (await response.json()) as { data?: Record<string, unknown>; error?: string };
      if (!response.ok) throw new Error(json.error ?? "Update failed");

      if (json.data) {
        setRows((prev) => prev.map((row) => (String(row.id ?? "") === id ? (json.data as Record<string, unknown>) : row)));
      }
    } catch (err) {
      setTableError(err instanceof Error ? err.message : "Update failed");
    }
  };

  const generateRegistrationPDF = async (row: Record<string, unknown>) => {
    const doc = new jsPDF();
    const tableDoc = doc as PdfWithAutoTable;
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 15;
    const contentWidth = pageWidth - margin * 2;

    const loadImageBase64 = (url: string): Promise<string> => {
      return new Promise((resolve, reject) => {
        const img = new window.Image();
        img.crossOrigin = "anonymous";
        img.onload = () => {
          const canvas = document.createElement("canvas");
          canvas.width = img.width;
          canvas.height = img.height;
          const ctx = canvas.getContext("2d");
          ctx?.drawImage(img, 0, 0);
          resolve(canvas.toDataURL("image/png"));
        };
        img.onerror = () => reject(new Error("Failed to load image"));
        img.src = url;
      });
    };

    // 1. Professional Side-by-Side Header
    try {
      const logoBase64 = await loadImageBase64("/images/Florida Badgers.png");
      doc.addImage(logoBase64, "PNG", margin, 10, 28, 28);
    } catch (e) {
      console.warn("Logo failed to load", e);
    }

    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.text("FLORIDA BADGERS", 48, 20);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(60, 60, 60);
    doc.text("1901 N. Seacrest Blvd, Boynton Beach FL 33435", 48, 26);
    doc.text("Phone: +1 914-426-1526 | +1 305-988-9700", 48, 30);
    doc.text("Email: info@floridabadgersfca.com | academy@floridabadgersfca.com", 48, 34);

    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.8);
    doc.line(margin, 42, pageWidth - margin, 42);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text("OFFICIAL REGISTRATION RECORD", pageWidth / 2, 52, { align: "center" });

    let currentY = 62;

    // 2. Summary Section with Logos and Photo
    try {
      const upslBase64 = await loadImageBase64("/images/UPSL.png");
      doc.addImage(upslBase64, "PNG", margin, currentY, 30, 30);
    } catch (e) {
      console.warn("UPSL logo failed to load", e);
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);
    
    const infoX = margin + 35;
    doc.setFont("helvetica", "bold");
    doc.text(`REGISTRATION ID: ${getRegistrationIdFallback(row)}`, infoX, currentY + 5);
    
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${formatValue(row.nom_complet)}`, infoX, currentY + 12);
    doc.text(`Program: ${formatValue(row.programme_inscription)}`, infoX, currentY + 19);
    doc.text(`Category: ${row.categorie_age || getCategoryFallback(row.age)}`, infoX, currentY + 26);
    doc.text(`Date Registered: ${formatDashboardDate(row.created_at)}`, infoX, currentY + 33);

    // Player Photo on the far right
    const photoUrl = row.photo_url as string;
    if (photoUrl) {
      try {
        const playerPhotoBase64 = await loadImageBase64(photoUrl);
        doc.addImage(playerPhotoBase64, "JPEG", pageWidth - margin - 30, currentY, 30, 38);
      } catch (e) {
        console.warn("Player photo failed to load", e);
      }
    }

    currentY += 45;

    // 3. Detailed Data Tables
    const section = (title: string, data: string[][]) => {
      doc.setFontSize(11);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0); // Black
      doc.text(title, margin, currentY);
      currentY += 4;
      autoTable(doc, {
        startY: currentY,
        body: data,
        theme: "grid",
        headStyles: { fillColor: [0, 0, 0] }, // Black header
        styles: { fontSize: 8.5, cellPadding: 2, textColor: [0, 0, 0] },
        columnStyles: { 0: { fontStyle: "bold", cellWidth: 50, fillColor: [245, 245, 245] } },
        margin: { left: margin, right: margin },
      });
      currentY = (tableDoc.lastAutoTable?.finalY ?? currentY) + 10;
    };

    section("PERSONAL DETAILS", [
      ["Birth Date", formatDashboardDate(row.date_naissance)],
      ["Age", formatValue(row.age)],
      ["Sex", formatValue(row.sexe)],
      ["Address", formatValue(row.adresse)],
      ["Phone", formatValue(row.telephone)],
      ["Email", formatValue(row.email)],
    ]);

    section("FOOTBALL PROFILE", [
      ["Position", formatValue(row.poste_jeu)],
      ["Level", formatValue(row.niveau_jeu)],
      ["Current Club", formatValue(row.club_actuel)],
      ["Experience", formatValue(row.experience_football)],
    ]);

    if (currentY > 230) { doc.addPage(); currentY = 20; }

    section("HEALTH & EMERGENCY", [
      ["Health Issues", formatValue(row.probleme_sante_details)],
      ["Allergies", formatValue(row.allergies_connues)],
      ["Emergency Contact", formatValue(row.contact_urgence_nom)],
      ["Emergency Phone", formatValue(row.contact_urgence_telephone)],
      ["Relation", formatValue(row.contact_urgence_relation)],
      ["Emergency Email", formatValue(row.contact_urgence_email)],
    ]);

    if (row.nom_parent_tuteur) {
      section("PARENT / GUARDIAN", [
        ["Parent Name", formatValue(row.nom_parent_tuteur)],
        ["Parent Phone", formatValue(row.telephone_parent_tuteur)],
        ["Registered By", formatValue(row.inscrit_par)],
        ["Relation to Player", formatValue(row.relation_avec_joueur)],
      ]);
    }

    // 4. Full Waiver Text
    if (currentY > 200) { doc.addPage(); currentY = 20; }
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("AMATEUR ATHLETIC WAIVER AND RELEASE OF LIABILITY", margin, currentY);
    currentY += 6;

    const waiverText = [
      "In consideration of being allowed to participate in any way in (Sharks FCA Of Florida and city of Boynton beach Florida) soccer league, related events and activities, the undersigned acknowledges, appreciates, and agrees that:",
      "1. The risks of injury and illness (ex: communicable diseases such as MRSA, influenza, and COVID-19) from the activities involved in this program are significant, including the potential for permanent paralysis and death, and while particular rules, equipment, and personal discipline may reduce these risks, the risks of serious injury and illness do exist; and,",
      "2. I KNOWINGLY AND FREELY ASSUME ALL SUCH RISKS, both known and unknown, EVEN IF ARISING FROM THE NEGLIGENCE OF THE RELEASEES or others, and assume full responsibility for my participation; and,",
      "3. I willingly agree to comply with the stated and customary terms and conditions for participation. If, however, I observe any unusual significant hazard during my presence or participation, I will remove myself from participation and bring such to the attention of the nearest official immediately; and,",
      "4. I, for myself and on behalf of my heirs, assigns, personal representatives and next of kin, HEREBY RELEASE AND HOLD HARMLESS (Sharks FCA Of Florida and city of Boynton beach Florida) their officers, officials, agents, and/or employees, other participants, sponsoring agencies, sponsors, advertisers, and if applicable, owners and lessors of premises used to conduct the event (\"RELEASEES\"), WITH RESPECT TO ANY AND ALL INJURY, ILLNESS, DISABILITY, DEATH, or loss or damage to person or property, WHETHER ARISING FROM THE NEGLIGENCE OF THE RELEASEES OR OTHERWISE, to the fullest extent permitted by law.",
      "I HAVE READ THIS RELEASE OF LIABILITY AND ASSUMPTION OF RISK AGREEMENT, FULLY UNDERSTAND ITS TERMS, UNDERSTAND THAT I HAVE GIVEN UP SUBSTANTIAL RIGHTS BY SIGNING IT, AND SIGN IT FREELY AND VOLUNTARILY WITHOUT ANY INDUCEMENT.",
      Number(row.age) < 18 ? "FOR PARTICIPANTS OF MINORITY AGE (UNDER AGE 18): This is to certify that I, as parent/guardian with legal responsibility for this participant, have read and explained the provisions in this waiver/release to my child/ward including the risks of the activity and his/her responsibilities for adhering to the rules and regulations. Furthermore, my child/ward understands and accepts these risks and responsibilities. I for myself, my spouse, and child/ward do consent and agree to his/her release provided above for all the Releasees and myself, my spouse, and child/ward do release and agree to indemnify and hold harmless the Releasees from any and all liabilities incident to my minor child's/ward's involvement or participation in these activities as provided above, EVEN IF ARISING FROM THEIR NEGLIGENCE, to the fullest extent permitted by law." : ""
    ].join("\n\n");

    doc.setFontSize(7.5);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    const splitWaiver = doc.splitTextToSize(waiverText, contentWidth);
    doc.text(splitWaiver, margin, currentY);
    currentY += splitWaiver.length * 3 + 10;

    // 5. Digital Signatures
    const sigY = currentY > 250 ? (doc.addPage(), 30) : currentY;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    doc.text("ATTESTATION & SIGNATURE", margin, sigY);
    
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.2);
    doc.rect(margin, sigY + 2, contentWidth, 35);

    const isMinor = Number(row.age) < 18;
    const sigName = isMinor 
      ? (row.signature_parent_nom as string || row.nom_parent_tuteur as string || "N/A")
      : (row.signature_nom as string || row.nom_complet as string || "N/A");
    
    const rawDate = isMinor ? row.signature_parent_date : row.signature_date;
    const sigDate = formatDashboardDate(rawDate || row.created_at);

    // Signature "Scribble" effect using a different font style if possible, or just bold/italic
    doc.setFont("times", "italic");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(sigName, margin + 10, sigY + 18);
    
    // Label and Date
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("________________________________________", margin + 10, sigY + 20);
    doc.text(isMinor ? "Parent / Guardian Signature" : "Participant Signature", margin + 10, sigY + 26);
    
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(11);
    doc.text(sigDate, pageWidth - margin - 10, sigY + 18, { align: "right" });
    doc.setFontSize(9);
    doc.setTextColor(100, 100, 100);
    doc.text("________________", pageWidth - margin - 10, sigY + 20, { align: "right" });
    doc.text("Date Signed", pageWidth - margin - 10, sigY + 26, { align: "right" });

    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.text("This document was electronically signed. The signature above is a legally binding electronic representation of the name typed by the user.", pageWidth / 2, sigY + 34, { align: "center" });

    doc.save(`Registration_${row.nom_complet || "Record"}.pdf`);
  };

  const handlePanelSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (panelMode === "view") return;

    setIsSaving(true);
    setPanelError(null);
    setTableError(null);
    try {
      const isCreate = panelMode === "create";
      const endpoint = isCreate
        ? `/api/dashboard/tables/${config.table}`
        : `/api/dashboard/tables/${config.table}/${activeRowId}`;
      const method = isCreate ? "POST" : "PATCH";
      const payload: Record<string, unknown> = { ...panelValues };

      const photoFieldEntries = Object.entries(photoFiles);
      if (photoFieldEntries.length > 0) {
        for (const [fieldKey, file] of photoFieldEntries) {
          const imageUrl = await uploadPhotoField(fieldKey, file);
          payload[fieldKey] = imageUrl;
        }
      }

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = (await response.json()) as { data?: Record<string, unknown>; error?: string };
      if (!response.ok) {
        throw new Error(json.error ?? "Save failed.");
      }

      if (json.data) {
        if (isCreate) {
          setRows((prev) => [json.data as Record<string, unknown>, ...prev]);
        } else if (activeRowId) {
          setRows((prev) =>
            prev.map((row) => (String(row.id ?? "") === activeRowId ? (json.data as Record<string, unknown>) : row))
          );
        }
      }

      setPanelOpen(false);
      setActiveRowId(null);
      resetPanelForm();
    } catch (err) {
      setPanelError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  const panelTitle =
    panelMode === "create"
      ? `Create ${config.label}`
      : panelMode === "edit"
      ? `Edit ${config.label}`
      : `View ${config.label}`;
  const panelReadonly = panelMode === "view";

  const handlePanelOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) {
      setActiveRowId(null);
      resetPanelForm();
    }
    setPanelOpen(nextOpen);
  };

  const renderField = (field: DashboardTableField, options?: RenderFieldOptions) => {
    const id = `${config.table}-${field.key}`;
    const value = panelValues[field.key];

    if (field.type === "textarea" || field.type === "json") {
      const isArticleDescriptionField =
        isArticlesTable && field.type === "textarea" && field.key === "description";

      if (isArticleDescriptionField) {
        const htmlValue = String(value ?? "");
        const emptyValue = isArticleEditorEmpty(htmlValue);
        const plainTextValue = stripHtmlToText(htmlValue);

        if (panelReadonly) {
          return (
            <div className="space-y-2">
              <div className="rounded-lg border bg-muted/20 p-2">
                <p className="text-[11px] text-muted-foreground">
                  Apercu en lecture seule de la description de l&apos;article.
                </p>
              </div>
              <div
                className={cn(
                  "min-h-[180px] rounded-md border bg-muted/10 px-3 py-2 text-sm leading-6",
                  "[&_a]:font-semibold [&_a]:text-primary [&_a]:underline",
                  "[&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
                  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
                )}
                dangerouslySetInnerHTML={{
                  __html: htmlValue || `<p>${plainTextValue || "Aucune description."}</p>`,
                }}
              />
            </div>
          );
        }

        return (
          <div className="space-y-2">
            <div className="rounded-lg border bg-muted/20 p-2">
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applyArticleEditorCommand(field.key, "bold");
                  }}
                  disabled={panelReadonly}
                >
                  Gras
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applyArticleEditorCommand(field.key, "italic");
                  }}
                  disabled={panelReadonly}
                >
                  Italique
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applyArticleEditorCommand(field.key, "link");
                  }}
                  disabled={panelReadonly}
                >
                  Lien
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applyArticleEditorCommand(field.key, "bullet-list");
                  }}
                  disabled={panelReadonly}
                >
                  Liste
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onMouseDown={(event) => {
                    event.preventDefault();
                    applyArticleEditorCommand(field.key, "quote");
                  }}
                  disabled={panelReadonly}
                >
                  Citation
                </Button>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Selectionne du texte, puis applique un style pour voir le resultat immediatement.
              </p>
            </div>

            <div className="relative">
              {emptyValue ? (
                <p className="pointer-events-none absolute left-3 top-2.5 text-sm text-muted-foreground">
                  {field.placeholder ?? "Ecris la description ici..."}
                </p>
              ) : null}
              <div
                id={id}
                ref={(element) => {
                  articleEditorRefs.current[field.key] = element;
                }}
                role="textbox"
                aria-multiline="true"
                contentEditable={!panelReadonly}
                suppressContentEditableWarning
                className={cn(
                  "min-h-[180px] rounded-md border px-3 py-2 text-sm leading-6 focus-visible:outline-none",
                  panelReadonly
                    ? "cursor-default bg-muted/10"
                    : "cursor-text bg-background focus-within:ring-2 focus-within:ring-ring/60",
                  "[&_a]:font-semibold [&_a]:text-primary [&_a]:underline",
                  "[&_blockquote]:my-2 [&_blockquote]:border-l-4 [&_blockquote]:pl-3 [&_blockquote]:text-muted-foreground",
                  "[&_ul]:my-2 [&_ul]:list-disc [&_ul]:pl-6"
                )}
                onInput={(event) => {
                  const nextValue = sanitizeArticleEditorHtml(event.currentTarget.innerHTML);
                  updateValue(field.key, nextValue);
                }}
                onBlur={() => syncArticleEditorValue(field.key)}
                onClick={(event) => {
                  if (panelReadonly) return;
                  const target = event.target as HTMLElement;
                  if (target.closest("a")) {
                    event.preventDefault();
                  }
                }}
              />
            </div>
          </div>
        );
      }

      return (
        <div className="space-y-2">
          <Textarea
            id={id}
            value={String(value ?? "")}
            placeholder={field.placeholder}
            onChange={(event) => updateValue(field.key, event.target.value)}
            disabled={panelReadonly}
          />
        </div>
      );
    }

    if (field.type === "boolean") {
      return (
        <div className="flex items-center gap-2 rounded-lg border p-3">
          <Checkbox
            id={id}
            checked={Boolean(value)}
            onCheckedChange={(checked) => updateValue(field.key, checked === true)}
            disabled={panelReadonly}
          />
          <Label htmlFor={id}>{field.label}</Label>
        </div>
      );
    }

    if (field.type === "select" && field.options?.length) {
      return (
        <Select
          value={String(value ?? "")}
          onValueChange={(nextValue) => updateValue(field.key, nextValue)}
          disabled={panelReadonly}
        >
          <SelectTrigger id={id}>
            <SelectValue placeholder={field.placeholder ?? `Select ${field.label}`} />
          </SelectTrigger>
          <SelectContent>
            {field.options.map((option) => (
              <SelectItem key={option} value={option}>
                {option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    }

    if (isPhotoField(field)) {
      const previewSource =
        photoPreviewUrls[field.key] ?? getPhotoPreviewSource(value);
      const fileInputId = `${id}-file`;
      const isDragging = draggingPhotoField === field.key;
      const squarePhotoBox = options?.squarePhotoBox === true;
      const showUploadArea = !previewSource;

      return (
        <div className="space-y-2">
          <input
            id={fileInputId}
            type="file"
            accept="image/*"
            className="hidden"
            disabled={panelReadonly}
            onChange={async (event) => {
              const input = event.currentTarget;
              const file = input.files?.[0];
              if (!file) return;
              input.value = "";
              await applyPhotoFile(field, file);
            }}
          />
          {showUploadArea ? (
            <div
              className={cn(
                "rounded-xl border-2 border-dashed p-4 transition",
                squarePhotoBox ? "aspect-square flex items-center justify-center" : "",
                isDragging ? "border-primary bg-primary/5" : "border-border bg-muted/20",
                panelReadonly ? "opacity-70" : "cursor-pointer"
              )}
              onDragOver={(event) => {
                if (panelReadonly) return;
                event.preventDefault();
                setDraggingPhotoField(field.key);
              }}
              onDragLeave={() => setDraggingPhotoField(null)}
              onDrop={async (event) => {
                if (panelReadonly) return;
                event.preventDefault();
                setDraggingPhotoField(null);
                const file = event.dataTransfer.files?.[0];
                if (!file) return;
                await applyPhotoFile(field, file);
              }}
            >
              <label
                htmlFor={fileInputId}
                className={cn("block text-center", panelReadonly ? "cursor-not-allowed" : "cursor-pointer")}
              >
                <p className="text-sm font-medium">Glissez et deposez votre photo ici</p>
                <p className="text-xs text-muted-foreground">ou cliquez pour choisir une image depuis votre PC</p>
                {photoFileNames[field.key] ? (
                  <p className="mt-1 text-xs font-medium text-primary">{photoFileNames[field.key]}</p>
                ) : null}
              </label>
            </div>
          ) : null}
          {previewSource ? (
            <div className={cn("overflow-hidden rounded-xl border bg-muted/10 p-1", squarePhotoBox ? "aspect-square" : "")}>
              <Image
                src={previewSource}
                alt={`${field.label} preview`}
                width={1600}
                height={900}
                unoptimized
                className={cn(
                  "w-full object-contain",
                  squarePhotoBox ? "h-full" : "h-auto max-h-[420px]"
                )}
              />
            </div>
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Photo de profil ou logo (image).</p>
            {!panelReadonly ? (
              <div className="flex items-center gap-2">
                {previewSource ? (
                  <Button type="button" size="sm" variant="outline" asChild>
                    <label htmlFor={fileInputId} className="cursor-pointer">
                      Changer
                    </label>
                  </Button>
                ) : null}
                {previewSource ? (
                  <Button type="button" size="sm" variant="outline" onClick={() => clearPhotoField(field.key)}>
                    Retirer
                  </Button>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      );
    }

    return (
      <Input
        id={id}
        type={
          field.type === "number"
            ? "number"
            : field.type === "email"
            ? "email"
            : field.type === "date"
            ? "date"
            : field.type === "datetime"
            ? "datetime-local"
            : "text"
        }
        value={String(value ?? "")}
        placeholder={field.placeholder}
        onChange={(event) => updateValue(field.key, event.target.value)}
        disabled={panelReadonly}
      />
    );
  };

  return (
    <div className="px-4 pb-6 pt-4 lg:px-6">
      <div className="mb-5 flex flex-col gap-2 pl-1 pt-1">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{config.label}</h1>
            <p className="text-sm text-muted-foreground">{config.description}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <Link
              href="/dashboard"
              className="font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Dashboard
            </Link>
            <span className="text-muted-foreground/50">/</span>
            <span className="font-semibold text-primary">{config.label}</span>
          </div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
            <div className="relative w-full max-w-xl">
              <SearchIcon className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder={`Search ${config.label.toLowerCase()}...`}
                aria-label={`Search ${config.label}`}
                className="h-10 pl-9"
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <div className="hidden text-sm text-muted-foreground md:block">
                {filteredRows.length} of {rows.length} rows
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleRefresh} disabled={isRefreshing}>
                <RefreshCwIcon className="mr-1 size-4" />
                {isRefreshing ? "Refreshing..." : "Refresh"}
              </Button>
              <Button type="button" size="sm" onClick={openCreatePanel}>
                <PlusIcon className="mr-1 size-4" />
                Create
              </Button>
            </div>
          </div>
          {tableError ? <p className="text-sm text-red-600">{tableError}</p> : null}
        </CardHeader>
        <CardContent>
          {isArticlesTable ? (
            rows.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No rows found.</div>
            ) : filteredRows.length === 0 ? (
              <div className="py-8 text-center text-muted-foreground">No matching rows found.</div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredRows.map((row) => {
                  const id = String(row.id ?? "");
                  const title =
                    typeof row.titre === "string" && row.titre.trim()
                      ? row.titre.trim()
                      : "Article sans titre";
                  const descriptionPreview =
                    typeof row.description === "string" ? stripHtmlToText(row.description) : "";
                  const subtitle =
                    typeof row.sous_titre === "string" && row.sous_titre.trim()
                      ? row.sous_titre.trim()
                      : descriptionPreview
                      ? descriptionPreview
                      : "Aucune description.";
                  const photoSource = getPhotoPreviewSource(row.photo_url) ?? ARTICLE_FALLBACK_IMAGE;
                  const clicksCount = getPositiveCount(row.clicks_count);
                  const isPublished = row.is_published === true;
                  const createdAt = formatDashboardDate(row.created_at);

                  return (
                    <article
                      key={id}
                      className="flex h-full flex-col overflow-hidden rounded-xl border bg-card shadow-sm"
                    >
                      <div className="relative h-48 w-full bg-muted">
                        <Image
                          src={photoSource}
                          alt={title}
                          fill
                          unoptimized
                          className="object-cover"
                        />
                      </div>

                      <div className="flex flex-1 flex-col p-4">
                        <h3 className="text-lg font-semibold leading-tight text-foreground">{title}</h3>
                        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{subtitle}</p>

                        <div className="mt-4 grid grid-cols-2 gap-2 text-xs">
                          <div className="rounded-md border bg-muted/20 px-3 py-2">
                            <div className="text-[11px] uppercase tracking-wide text-muted-foreground">Statut</div>
                            <div className="mt-1 font-semibold text-foreground">
                              {isPublished ? "Publie" : "Brouillon"}
                            </div>
                          </div>
                          <div className="rounded-md border bg-muted/20 px-3 py-2">
                            <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                              <MousePointerClickIcon className="size-3.5" />
                              Clics
                            </div>
                            <div className="mt-1 font-semibold text-foreground">{clicksCount}</div>
                          </div>
                          <div className="col-span-2 rounded-md border bg-muted/20 px-3 py-2">
                            <div className="flex items-center gap-1 text-[11px] uppercase tracking-wide text-muted-foreground">
                              <CalendarIcon className="size-3.5" />
                              Date
                            </div>
                            <div className="mt-1 font-semibold text-foreground">{createdAt}</div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-2 border-t pt-3">
                          <Button type="button" size="sm" variant="outline" onClick={() => openViewPanel(row)}>
                            <EyeIcon className="mr-1 size-4" />
                            View
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => openEditPanel(row)}>
                            <PencilIcon className="mr-1 size-4" />
                            Edit
                          </Button>
                          <Button type="button" size="sm" variant="outline" onClick={() => handleDelete(id)}>
                            <Trash2Icon className="mr-1 size-4" />
                            Delete
                          </Button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  {listColumns.map((column) => (
                    <TableHead key={column}>
                      {fieldLabelByKey[column] ?? formatColumnLabel(column)}
                    </TableHead>
                  ))}
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={listColumns.length + 1} className="py-8 text-center text-muted-foreground">
                      No rows found.
                    </TableCell>
                  </TableRow>
                ) : filteredRows.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={listColumns.length + 1} className="py-8 text-center text-muted-foreground">
                      No matching rows found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredRows.map((row) => {
                    const id = String(row.id ?? "");
                    return (
                      <TableRow key={id}>
                        {listColumns.map((column) => (
                          <TableCell key={`${id}-${column}`} className="max-w-[220px] truncate">
                            {column === "registration_id" && !row[column] 
                              ? getRegistrationIdFallback(row)
                              : column === "categorie_age" && !row[column]
                              ? getCategoryFallback(row.age)
                              : formatValue(row[column])}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            {config.table === "inscriptions_joueurs" && row.statut === "en_attente" && (
                              <>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="text-emerald-600 hover:bg-emerald-50 hover:text-emerald-700"
                                  onClick={() => updateRowStatus(id, "accepte")}
                                >
                                  <CheckIcon className="size-4" />
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                                  onClick={() => updateRowStatus(id, "refuse")}
                                >
                                  <XIcon className="size-4" />
                                </Button>
                              </>
                            )}
                            {config.table === "inscriptions_joueurs" && (
                              <Button
                                type="button"
                                size="sm"
                                variant="ghost"
                                title="Download PDF"
                                onClick={() => generateRegistrationPDF(row)}
                              >
                                <DownloadIcon className="size-4" />
                              </Button>
                            )}
                            <Button type="button" size="sm" variant="ghost" onClick={() => openViewPanel(row)}>
                              <EyeIcon className="mr-1 size-4" />
                              View
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => openEditPanel(row)}>
                              <PencilIcon className="mr-1 size-4" />
                              Edit
                            </Button>
                            <Button type="button" size="sm" variant="ghost" onClick={() => handleDelete(id)}>
                              <Trash2Icon className="mr-1 size-4" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Sheet open={panelOpen} onOpenChange={handlePanelOpenChange}>
        <SheetContent
          side="top"
          className="!inset-auto !top-1/2 !left-1/2 !h-[90vh] !w-[min(1200px,96vw)] !-translate-x-1/2 !-translate-y-1/2 overflow-hidden rounded-2xl border p-0 flex flex-col"
        >
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>{panelTitle}</SheetTitle>
            <SheetDescription>
              Table: `{config.table}` {activeRowId ? `| ID: ${activeRowId}` : ""}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handlePanelSubmit} className="flex min-h-0 flex-1 flex-col">
            <div ref={panelScrollRef} className="flex-1 overflow-y-auto px-6 py-4">
              <div className="mx-auto w-full max-w-6xl">
                {isPlayersTable ? (
                  <div className="space-y-6">
                    <div className="grid items-start gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
                      {playerPhotoField ? (
                        <div className="space-y-2">
                          <Label htmlFor={`${config.table}-${playerPhotoField.key}`}>
                            {playerPhotoField.label}
                            {playerPhotoField.required ? " *" : ""}
                          </Label>
                          {renderField(playerPhotoField, { squarePhotoBox: true })}
                        </div>
                      ) : null}

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {playerTopRightFields.map((field) => (
                          <div key={field.key} className="space-y-2">
                            {field.type !== "boolean" ? (
                              <Label htmlFor={`${config.table}-${field.key}`}>
                                {field.label}
                                {field.required ? " *" : ""}
                              </Label>
                            ) : null}
                            {renderField(field)}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {playerBottomFields.map((field) => (
                        <div key={field.key} className={getFieldSpanClass(field)}>
                          {field.type !== "boolean" ? (
                            <Label htmlFor={`${config.table}-${field.key}`}>
                              {field.label}
                              {field.required ? " *" : ""}
                            </Label>
                          ) : null}
                          {renderField(field)}
                        </div>
                      ))}
                    </div>
                  </div>
                ) : isArticlesTable ? (
                  <div className="space-y-6">
                    {articlePhotoField ? (
                      <div className="rounded-2xl border bg-muted/15 p-4 shadow-sm">
                        <Label htmlFor={`${config.table}-${articlePhotoField.key}`}>
                          {articlePhotoField.label}
                          {articlePhotoField.required ? " *" : ""}
                        </Label>
                        <div className="mt-3">{renderField(articlePhotoField)}</div>
                      </div>
                    ) : null}

                    <div className="rounded-2xl border bg-background/80 p-4">
                      <p className="mb-4 text-xs text-muted-foreground">
                        L&apos;ID auteur est attribue automatiquement au compte connecte au moment de la publication.
                      </p>
                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {articleBodyFields.map((field) => (
                          <div key={field.key} className={getFieldSpanClass(field)}>
                            {field.type !== "boolean" ? (
                              <Label htmlFor={`${config.table}-${field.key}`}>
                                {field.label}
                                {field.required ? " *" : ""}
                              </Label>
                            ) : null}
                            {renderField(field)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
                    {visibleFields.map((field) => (
                      <div key={field.key} className={getFieldSpanClass(field)}>
                        {field.type !== "boolean" ? (
                          <Label htmlFor={`${config.table}-${field.key}`}>
                            {field.label}
                            {field.required ? " *" : ""}
                          </Label>
                        ) : null}
                        {renderField(field)}
                      </div>
                    ))}
                  </div>
                )}

                {panelError ? (
                  <p className="mt-4 text-sm text-red-600">{panelError}</p>
                ) : null}
              </div>
            </div>
            <SheetFooter className="sticky bottom-0 z-10 border-t bg-background px-6 py-4">
              <div className="flex w-full flex-wrap items-center justify-end gap-2">
                {panelMode !== "view" ? (
                  <Button type="submit" disabled={isSaving}>
                    {isSaving ? "Saving..." : panelMode === "create" ? "Create" : "Save changes"}
                  </Button>
                ) : null}
                <Button type="button" variant="outline" onClick={() => handlePanelOpenChange(false)}>
                  Close
                </Button>
              </div>
            </SheetFooter>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  );
}
