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
} from "lucide-react";

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

function formatValue(value: unknown): string {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "true" : "false";
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

  return new Intl.DateTimeFormat("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(parsed);
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
  return field.type === "text" && /(photo|logo)/i.test(field.key);
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
  });
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

  const resetPanelForm = () => {
    setPanelValues(buildInitialForm(config));
    setPanelError(null);
    setPhotoFileNames({});
    setDraggingPhotoField(null);
  };

  const openCreatePanel = () => {
    setPanelMode("create");
    setActiveRowId(null);
    setPanelValues(buildInitialForm(config));
    setPanelError(null);
    setPhotoFileNames({});
    setDraggingPhotoField(null);
    setPanelOpen(true);
  };

  const openViewPanel = (row: Record<string, unknown>) => {
    setPanelMode("view");
    setActiveRowId(String(row.id ?? ""));
    setPanelValues(buildFormFromRow(config, row));
    setPanelError(null);
    setPhotoFileNames({});
    setDraggingPhotoField(null);
    setPanelOpen(true);
  };

  const openEditPanel = (row: Record<string, unknown>) => {
    setPanelMode("edit");
    setActiveRowId(String(row.id ?? ""));
    setPanelValues(buildFormFromRow(config, row));
    setPanelError(null);
    setPhotoFileNames({});
    setDraggingPhotoField(null);
    setPanelOpen(true);
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

      const encoded = await readFileAsDataUrl(processedFile);
      updateValue(field.key, encoded);
      setPhotoFileNames((prev) => ({ ...prev, [field.key]: file.name }));
      setPanelError(null);
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "Impossible de traiter l'image.");
    }
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

      const response = await fetch(endpoint, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(panelValues),
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
      const previewSource = getPhotoPreviewSource(value);
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
                  <Button type="button" size="sm" variant="outline" onClick={() => updateValue(field.key, "")}>
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
                          unoptimized={photoSource.startsWith("data:")}
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
                            {formatValue(row[column])}
                          </TableCell>
                        ))}
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
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

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
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
                <Button type="button" variant="outline" onClick={() => setPanelOpen(false)}>
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
