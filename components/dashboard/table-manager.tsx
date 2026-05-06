"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { EyeIcon, PencilIcon, PlusIcon, RefreshCwIcon, Trash2Icon } from "lucide-react";

import type { DashboardTableConfig, DashboardTableField } from "@/lib/dashboard/tables";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

function buildInitialForm(config: DashboardTableConfig): Record<string, unknown> {
  return Object.fromEntries(
    config.createFields.map((field) => [field.key, field.type === "boolean" ? false : ""])
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

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("Unable to read image file."));
    reader.readAsDataURL(file);
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

  const listColumns = useMemo(
    () => Array.from(new Set(config.listColumns)).slice(0, 6),
    [config.listColumns]
  );
  const isPlayersTable = config.table === "joueurs";
  const visibleFields = useMemo(
    () => config.createFields.filter((field) => !(isPlayersTable && field.key === "bio")),
    [config.createFields, isPlayersTable]
  );
  const fieldByKey = useMemo(() => new Map(visibleFields.map((field) => [field.key, field])), [visibleFields]);
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

  const updateValue = (key: string, value: unknown) => {
    setPanelValues((prev) => ({ ...prev, [key]: value }));
  };

  useEffect(() => {
    if (!panelOpen) return;
    panelScrollRef.current?.scrollTo({ top: 0 });
  }, [panelOpen, panelMode, activeRowId]);

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
    if (file.size > 8 * 1024 * 1024) {
      setPanelError("Image trop grande (max 8MB).");
      return;
    }

    try {
      const encoded = await readFileAsDataUrl(file);
      updateValue(field.key, encoded);
      setPhotoFileNames((prev) => ({ ...prev, [field.key]: file.name }));
      setPanelError(null);
    } catch (error) {
      setPanelError(error instanceof Error ? error.message : "Unable to load image.");
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
      return (
        <Textarea
          id={id}
          value={String(value ?? "")}
          placeholder={field.placeholder}
          onChange={(event) => updateValue(field.key, event.target.value)}
          disabled={panelReadonly}
        />
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

      return (
        <div className="space-y-2">
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
            <input
              id={fileInputId}
              type="file"
              accept="image/*"
              className="hidden"
              disabled={panelReadonly}
              onChange={async (event) => {
                const file = event.target.files?.[0];
                if (!file) return;
                await applyPhotoFile(field, file);
                event.currentTarget.value = "";
              }}
            />
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
          {previewSource ? (
            <div
              className={cn(
                "rounded-xl border bg-cover bg-center",
                squarePhotoBox ? "aspect-square w-full" : "h-40"
              )}
              style={{ backgroundImage: `url(${previewSource})` }}
            />
          ) : null}
          <div className="flex items-center justify-between gap-2">
            <p className="text-xs text-muted-foreground">Photo de profil ou logo (image).</p>
            {!panelReadonly && previewSource ? (
              <Button type="button" size="sm" variant="outline" onClick={() => updateValue(field.key, "")}>
                Retirer
              </Button>
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
    <div className="px-4 pb-6 lg:px-6">
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <CardTitle>{config.label}</CardTitle>
              <CardDescription>{config.description}</CardDescription>
            </div>
            <div className="flex items-center gap-2">
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
              ) : (
                rows.map((row) => {
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
        </CardContent>
      </Card>

      <Sheet open={panelOpen} onOpenChange={setPanelOpen}>
        <SheetContent
          side="top"
          className="!inset-auto !top-1/2 !left-1/2 !h-[90vh] !w-[min(1200px,96vw)] !-translate-x-1/2 !-translate-y-1/2 overflow-hidden rounded-2xl border p-0"
        >
          <SheetHeader className="border-b px-6 py-4">
            <SheetTitle>{panelTitle}</SheetTitle>
            <SheetDescription>
              Table: `{config.table}` {activeRowId ? `| ID: ${activeRowId}` : ""}
            </SheetDescription>
          </SheetHeader>
          <form onSubmit={handlePanelSubmit} className="flex h-full flex-col">
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
            <SheetFooter className="border-t px-6 py-4">
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
