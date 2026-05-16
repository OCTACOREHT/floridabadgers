"use client";

import { useState, useMemo, useEffect } from "react";
import { 
  CheckIcon, 
  ChevronsUpDownIcon, 
  BanknoteIcon, 
  CalendarIcon, 
  UserIcon, 
  Loader2Icon,
  ZapIcon,
  WalletIcon,
  SmartphoneIcon,
  CoinsIcon,
  ReceiptIcon,
  HistoryIcon,
  SearchIcon,
  CreditCardIcon
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Card, CardContent } from "@/components/ui/card";
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

export default function QuickPaymentForm({ players }: QuickPaymentFormProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [selectedPlayerId, setSelectedPlayerId] = useState("");
  const [amount, setAmount] = useState("50");
  const [feeType, setFeeType] = useState("monthly");
  const [method, setMethod] = useState("zelle");
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPlayer = useMemo(
    () => players.find((p) => p.id === selectedPlayerId),
    [players, selectedPlayerId]
  );

  const quickAmounts = [
    { label: "Monthly", value: "50", type: "monthly" },
    { label: "Registration", value: "150", type: "registration" },
    { label: "Equipment", value: "100", type: "equipment" },
    { label: "Other", value: "", type: "other" },
  ];

  const paymentMethods = [
    { id: "zelle", label: "Zelle", icon: <ZapIcon className="h-4 w-4" /> },
    { id: "cash", label: "Cash", icon: <CoinsIcon className="h-4 w-4" /> },
    { id: "transfer", label: "Bank", icon: <WalletIcon className="h-4 w-4" /> },
    { id: "card", label: "Card", icon: <CreditCardIcon className="h-4 w-4" /> },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) {
      setError("Select player first");
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch("/api/dashboard/tables/paiements", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          joueur_id: selectedPlayerId,
          montant: Number(amount),
          type_frais: feeType,
          methode_paiement: method,
          date_paiement: date,
          statut: "paid",
          notes: notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed");
      }

      router.push("/dashboard/finance?success=1");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-100px)] bg-[#F5F5F5] text-[#050505] rounded-xl overflow-hidden shadow-xl border border-[#D9D9D9]">
      {/* POS Header Compact */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#050505] text-white">
        <div className="flex items-center gap-2">
          <ReceiptIcon className="h-5 w-5 text-[#D9D9D9]" />
          <h2 className="text-sm font-bold tracking-tighter">FINANCE TERMINAL</h2>
        </div>
        <div className="text-[10px] font-mono text-[#BFC0C2] flex gap-3">
          <span>{new Date().toLocaleDateString()}</span>
          <span className="text-emerald-400">● ONLINE</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Transaction Details */}
        <div className="flex-1 p-4 flex flex-col gap-4 border-r border-[#D9D9D9]">
          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-[#3A3537]">Player</Label>
            <Popover open={open} onOpenChange={setOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full h-12 justify-between bg-white border-[#D9D9D9] hover:bg-[#F5F5F5] text-sm px-4"
                >
                  <div className="flex items-center gap-2">
                    <UserIcon className="h-4 w-4 text-[#3A3537]" />
                    {selectedPlayer ? (
                      <span className="font-bold">{selectedPlayer.prenom} {selectedPlayer.nom}</span>
                    ) : (
                      <span className="text-muted-foreground italic">Select player...</span>
                    )}
                  </div>
                  <ChevronsUpDownIcon className="h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                <Command>
                  <CommandInput placeholder="Search name..." />
                  <CommandList className="max-h-[300px]">
                    <CommandEmpty>No results.</CommandEmpty>
                    <CommandGroup>
                      {players.map((p) => (
                        <CommandItem
                          key={p.id}
                          className="py-2 cursor-pointer"
                          onSelect={() => { setSelectedPlayerId(p.id); setOpen(false); }}
                        >
                          <div className="flex justify-between w-full text-sm">
                            <span className="font-semibold">{p.prenom} {p.nom}</span>
                            <span className="text-[10px] opacity-50">{p.categorie?.nom}</span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Compact Receipt Area */}
          <div className="mt-auto bg-white rounded-lg p-5 border border-[#D9D9D9] space-y-3 shadow-inner">
            <div className="flex justify-between text-xs border-b border-dashed pb-2">
              <span className="text-[#3A3537]">FEE TYPE</span>
              <span className="font-bold uppercase">{feeType}</span>
            </div>
            <div className="flex justify-between text-xs border-b border-dashed pb-2">
              <span className="text-[#3A3537]">PAYMENT METHOD</span>
              <span className="font-bold uppercase flex items-center gap-1">
                {paymentMethods.find(m => m.id === method)?.icon} {method}
              </span>
            </div>
            <div className="flex justify-between items-end pt-2">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-[#3A3537]">TOTAL AMOUNT</span>
                <span className="text-4xl font-black font-mono leading-none">${amount}</span>
              </div>
              <div className="text-[10px] text-muted-foreground italic">Ready to process</div>
            </div>
          </div>
        </div>

        {/* Right: Keypad Area - Strictly no scroll */}
        <div className="w-[380px] bg-white p-4 flex flex-col gap-4 border-l border-[#D9D9D9]">
          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-[#3A3537]">Select Amount</Label>
            <div className="grid grid-cols-2 gap-2">
              {quickAmounts.map((q) => (
                <Button
                  key={q.label}
                  type="button"
                  size="sm"
                  onClick={() => { if (q.value) setAmount(q.value); setFeeType(q.type); }}
                  className={cn(
                    "h-12 text-xs font-bold border",
                    feeType === q.type 
                      ? "bg-[#050505] text-white border-[#050505]" 
                      : "bg-[#F5F5F5] border-[#D9D9D9] hover:bg-[#D9D9D9] text-[#3A3537]"
                  )}
                >
                  {q.label} {q.value && `($${q.value})`}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-[10px] font-bold uppercase text-[#3A3537]">Method</Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((m) => (
                <Button
                  key={m.id}
                  type="button"
                  size="sm"
                  onClick={() => setMethod(m.id)}
                  className={cn(
                    "h-12 flex items-center justify-center gap-2 border transition-all text-xs",
                    method === m.id 
                      ? "bg-[#3A3537] text-white border-[#3A3537]" 
                      : "bg-[#F5F5F5] border-[#D9D9D9] hover:bg-[#D9D9D9] text-[#3A3537]"
                  )}
                >
                  {m.icon} {m.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-[10px] font-bold uppercase text-[#3A3537]">Ref / Notes</Label>
            <Input 
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Transaction notes..."
              className="h-9 text-xs bg-[#F5F5F5] border-[#D9D9D9]"
            />
          </div>

          <div className="mt-auto">
            {error && <p className="text-[10px] text-red-600 mb-2 font-bold text-center italic">{error}</p>}
            <Button 
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="w-full h-16 text-lg font-black uppercase tracking-tighter bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg active:scale-[0.98] transition-transform"
            >
              {isSubmitting ? (
                <Loader2Icon className="h-6 w-6 animate-spin" />
              ) : (
                <div className="flex items-center gap-2">
                  <CheckIcon className="h-6 w-6 stroke-[3px]" />
                  SUBMIT PAYMENT
                </div>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
