"use client";

import { useMemo, useState } from "react";
import {
  CheckIcon,
  ChevronsUpDownIcon,
  CoinsIcon,
  CreditCardIcon,
  Loader2Icon,
  ReceiptIcon,
  UserIcon,
  WalletIcon,
  ZapIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useRouter } from "next/navigation";

interface Player {
  id: string;
  prenom: string;
  nom: string;
  categorie?: { nom: string };
}

interface QuickPaymentFormProps {
  players: Player[];
}

type FeeType = "monthly" | "registration" | "equipment" | "other";
type AmountPresetId =
  | "monthly"
  | "registration"
  | "registration_monthly_bundle"
  | "equipment"
  | "other";

type AmountPreset = {
  id: AmountPresetId;
  label: string;
  subtitle: string;
  fixedAmount: number | null;
};

type PaymentMethod = {
  id: "zelle" | "cash" | "transfer" | "card";
  label: string;
  icon: React.ReactNode;
};

type PaymentLine = {
  type: FeeType;
  amount: number;
  label: string;
};

const AMOUNT_PRESETS: AmountPreset[] = [
  { id: "monthly", label: "Monthly", subtitle: "$50", fixedAmount: 50 },
  { id: "registration", label: "Registration", subtitle: "$150", fixedAmount: 150 },
  { id: "registration_monthly_bundle", label: "Reg + Monthly", subtitle: "$200", fixedAmount: 200 },
  { id: "equipment", label: "Equipment", subtitle: "$100", fixedAmount: 100 },
  { id: "other", label: "Other Amount", subtitle: "Custom", fixedAmount: null },
];

const PAYMENT_METHODS: PaymentMethod[] = [
  { id: "zelle", label: "Zelle", icon: <ZapIcon className="h-4 w-4" /> },
  { id: "cash", label: "Cash", icon: <CoinsIcon className="h-4 w-4" /> },
  { id: "transfer", label: "Bank", icon: <WalletIcon className="h-4 w-4" /> },
  { id: "card", label: "Card", icon: <CreditCardIcon className="h-4 w-4" /> },
];

function formatMoney(value: number): string {
  return `$${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export default function QuickPaymentForm({ players }: QuickPaymentFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [selectedPresetId, setSelectedPresetId] = useState<AmountPresetId>("monthly");
  const [customAmount, setCustomAmount] = useState("50");
  const [method, setMethod] = useState<PaymentMethod["id"]>("zelle");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId),
    [players, selectedPlayerId]
  );

  const selectedPreset = useMemo(
    () => AMOUNT_PRESETS.find((preset) => preset.id === selectedPresetId) ?? AMOUNT_PRESETS[0],
    [selectedPresetId]
  );

  const paymentLines = useMemo<PaymentLine[]>(() => {
    if (selectedPresetId === "registration_monthly_bundle") {
      return [
        { type: "registration", amount: 150, label: "Registration Fee" },
        { type: "monthly", amount: 50, label: "Monthly Fee" },
      ];
    }

    if (selectedPresetId === "registration") {
      return [{ type: "registration", amount: 150, label: "Registration Fee" }];
    }

    if (selectedPresetId === "equipment") {
      return [{ type: "equipment", amount: 100, label: "Equipment Fee" }];
    }

    if (selectedPresetId === "other") {
      const parsed = Number(customAmount);
      const safeAmount = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
      return [{ type: "other", amount: safeAmount, label: "Custom Payment" }];
    }

    return [{ type: "monthly", amount: 50, label: "Monthly Fee" }];
  }, [customAmount, selectedPresetId]);

  const totalAmount = useMemo(
    () => paymentLines.reduce((sum, line) => sum + line.amount, 0),
    [paymentLines]
  );

  const isBundlePayment = selectedPresetId === "registration_monthly_bundle";
  const isCustomPreset = selectedPresetId === "other";
  const selectedMethod = PAYMENT_METHODS.find((entry) => entry.id === method);

  const handleSelectPreset = (presetId: AmountPresetId) => {
    setSelectedPresetId(presetId);
    const preset = AMOUNT_PRESETS.find((entry) => entry.id === presetId);
    if (preset?.fixedAmount !== null && preset?.fixedAmount !== undefined) {
      setCustomAmount(String(preset.fixedAmount));
    }
  };

  const buildLineNotes = (line: PaymentLine, index: number, totalLines: number) => {
    if (totalLines <= 1) return "";
    return `Bundle payment (${index + 1}/${totalLines}) - ${line.label}`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPlayerId) {
      setError("Please select a player first.");
      return;
    }

    if (totalAmount <= 0) {
      setError("Amount must be greater than $0.");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      for (let index = 0; index < paymentLines.length; index += 1) {
        const line = paymentLines[index];
        const response = await fetch("/api/dashboard/tables/paiements", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          // Keep a lightweight auto-note only for combined (bundle) payments.
          body: JSON.stringify({
            joueur_id: selectedPlayerId,
            montant: Number(line.amount),
            type_frais: line.type,
            methode_paiement: method,
            date_paiement: date,
            statut: "paid",
            notes: buildLineNotes(line, index, paymentLines.length) || null,
          }),
        });

        if (!response.ok) {
          const data = (await response.json()) as { error?: string };
          throw new Error(data.error ?? `Failed to save ${line.label}.`);
        }
      }

      router.push(`/dashboard/finance?success=1&entries=${paymentLines.length}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="flex min-h-[680px] w-full max-w-none flex-col overflow-y-auto border border-[#D9D9D9] bg-transparent text-[#050505]"
    >
      <div className="flex items-center justify-between border-b border-[#2E2424] bg-[#000000] px-4 py-2 text-white">
        <div className="flex items-center gap-2.5">
          <div className="rounded-md border border-[#D9D9D9]/40 bg-[#2E2424] p-1">
            <ReceiptIcon className="h-4 w-4 text-[#F0F0F0]" />
          </div>
          <div>
            <h2 className="text-[13px] font-bold uppercase tracking-wide">Finance Terminal</h2>
            <p className="text-[10px] text-[#D9D9D9]">Professional payment intake</p>
          </div>
        </div>
        <div className="text-right text-[10px] text-[#D9D9D9]">
          <div>{new Date().toLocaleDateString()}</div>
          <div className="font-semibold text-emerald-400">ONLINE</div>
        </div>
      </div>

      <div className="grid flex-1 grid-cols-1 overflow-hidden lg:grid-cols-[1.35fr_1fr]">
        <div className="flex min-h-0 flex-col gap-3 overflow-hidden border-r border-[#D9D9D9] p-4">
          <div className="border border-[#D9D9D9] bg-transparent p-3">
            <Label className="mb-1.5 block text-[10px] font-semibold uppercase text-[#2E2424]">Player</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  type="button"
                  className="h-10 w-full justify-between border-[#D9D9D9] bg-transparent px-3 text-sm hover:bg-transparent"
                >
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-[#2E2424]" />
                    {selectedPlayer ? (
                      <span className="font-semibold text-[#000000]">
                        {selectedPlayer.prenom} {selectedPlayer.nom}
                      </span>
                    ) : (
                      <span className="italic text-[#6B7280]">Select player...</span>
                    )}
                  </div>
                  <ChevronsUpDownIcon className="h-4 w-4 text-[#6B7280]" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search player..." />
                  <CommandList className="max-h-[220px]">
                    <CommandEmpty>No player found.</CommandEmpty>
                    <CommandGroup>
                      {players.map((player) => (
                        <CommandItem
                          key={player.id}
                          className="cursor-pointer py-2"
                          onSelect={() => {
                            setSelectedPlayerId(player.id);
                            setOpen(false);
                          }}
                        >
                          <div className="flex w-full items-center justify-between gap-2 text-sm">
                            <span className="font-medium">
                              {player.prenom} {player.nom}
                            </span>
                            <span className="text-[11px] text-[#6B7280]">{player.categorie?.nom}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="flex flex-1 flex-col border border-[#D9D9D9] bg-transparent p-4">
            <div className="mb-2.5 flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wide text-[#2E2424]">Payment Summary</h3>
            </div>

            <div className="space-y-1.5 border-y border-dashed border-[#D9D9D9] py-2.5 text-xs">
              {paymentLines.map((line) => (
                <div key={`${line.type}-${line.label}`} className="flex items-center justify-between">
                  <span className="font-medium text-[#2E2424]">{line.label}</span>
                  <span className="font-bold text-[#000000]">{formatMoney(line.amount)}</span>
                </div>
              ))}
            </div>

            <div className="mt-auto flex items-end justify-between pt-4">
              <div>
                <p className="text-[10px] font-semibold uppercase text-[#6B7280]">Total Amount</p>
                <p className="text-3xl font-black tracking-tight text-[#000000]">
                  {formatMoney(totalAmount)}
                </p>
              </div>
              <div className="text-right text-[10px] text-[#6B7280]" />
            </div>
          </div>
        </div>

        <div className="flex min-h-0 flex-col gap-3 overflow-hidden bg-transparent p-4">
          <div className="border border-[#D9D9D9] bg-transparent p-3">
            <Label className="mb-1.5 block text-[10px] font-semibold uppercase text-[#2E2424]">Select Amount</Label>
            <div className="grid grid-cols-2 gap-2">
              {AMOUNT_PRESETS.map((preset) => (
                <Button
                  key={preset.id}
                  type="button"
                  size="sm"
                  onClick={() => handleSelectPreset(preset.id)}
                  className={cn(
                    "h-10 justify-between border px-2.5 text-[13px] font-semibold",
                    selectedPresetId === preset.id
                      ? "border-[#000000] bg-transparent text-[#000000] ring-1 ring-[#000000]"
                      : "border-[#D9D9D9] bg-transparent text-[#2E2424] hover:bg-transparent"
                  )}
                >
                  <span>{preset.label}</span>
                  <span className="opacity-90">{preset.subtitle}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="border border-[#D9D9D9] bg-transparent p-3">
            <Label className="mb-1.5 block text-[10px] font-semibold uppercase text-[#2E2424]">Method</Label>
            <div className="grid grid-cols-2 gap-2">
              {PAYMENT_METHODS.map((paymentMethod) => (
                <Button
                  key={paymentMethod.id}
                  type="button"
                  size="sm"
                  onClick={() => setMethod(paymentMethod.id)}
                  className={cn(
                    "h-10 gap-2 border text-[13px] font-semibold",
                    method === paymentMethod.id
                      ? "border-[#2E2424] bg-transparent text-[#2E2424] ring-1 ring-[#2E2424]"
                      : "border-[#D9D9D9] bg-transparent text-[#2E2424] hover:bg-transparent"
                  )}
                >
                  {paymentMethod.icon}
                  {paymentMethod.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-2.5 border border-[#D9D9D9] bg-transparent p-3">
            <div>
              <Label className="mb-1 block text-[10px] font-semibold uppercase text-[#2E2424]">
                Payment Date
              </Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 border-[#D9D9D9] bg-transparent text-sm"
              />
            </div>

            <div>
              <Label className="mb-1 block text-[10px] font-semibold uppercase text-[#2E2424]">
                Amount
              </Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={isCustomPreset ? customAmount : String(selectedPreset.fixedAmount ?? totalAmount)}
                onChange={(e) => setCustomAmount(e.target.value)}
                disabled={!isCustomPreset}
                className={cn(
                  "h-9 border-[#D9D9D9] bg-transparent text-sm",
                  !isCustomPreset && "cursor-not-allowed opacity-70"
                )}
              />
            </div>
          </div>

          <div className="mt-auto border border-[#D9D9D9] bg-transparent p-3">
            <div className="mb-3 flex items-center justify-between text-xs text-[#6B7280]">
              <span>Method</span>
              <span className="flex items-center gap-1 font-semibold uppercase text-[#2E2424]">
                {selectedMethod?.icon}
                {selectedMethod?.label}
              </span>
            </div>

            {error && (
              <p className="mb-3 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-xs font-medium text-red-700">
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-12 w-full bg-emerald-600 text-sm font-black uppercase tracking-wide text-white hover:bg-emerald-500"
            >
              {isSubmitting ? (
                <Loader2Icon className="h-5 w-5 animate-spin" />
              ) : (
                <span className="flex items-center gap-2">
                  <CheckIcon className="h-5 w-5 stroke-[3px]" />
                  {isBundlePayment ? "Submit Bundle Payment" : "Submit Payment"}
                </span>
              )}
            </Button>
          </div>
        </div>
      </div>
    </form>
  );
}
