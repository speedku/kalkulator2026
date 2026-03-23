"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CustomerSchema } from "@/lib/validations/crm";
import { createCustomerAction, updateCustomerAction } from "@/lib/actions/crm";
import { GlassCard } from "@/components/aether/glass-card";
import { GlowButton } from "@/components/aether/glow-button";
import { cn } from "@/lib/utils";
import type { z } from "zod";
import type { PriceListRow } from "@/types/price-lists";
import type { CustomerDetailRow } from "@/lib/dal/crm";

type CustomerFormInput = z.input<typeof CustomerSchema>;

interface CustomerFormProps {
  mode: "create" | "edit";
  priceLists: PriceListRow[];
  customer?: CustomerDetailRow;
}

const inputClass = cn(
  "w-full h-9 px-3 text-sm rounded-lg",
  "bg-aether-elevated border border-aether-border",
  "text-aether-text placeholder:text-aether-text-muted",
  "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
  "transition-all duration-200"
);

const textareaClass = cn(
  "w-full px-3 py-2 text-sm rounded-lg min-h-[80px]",
  "bg-aether-elevated border border-aether-border",
  "text-aether-text placeholder:text-aether-text-muted",
  "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
  "transition-all duration-200 resize-y"
);

const labelClass = "block text-sm font-medium text-aether-text-secondary mb-1";
const errorClass = "mt-1 text-xs text-red-400";

export function CustomerForm({ mode, priceLists, customer }: CustomerFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const boundUpdateAction = React.useCallback(
    (prevState: { error?: string; success?: string }, formData: FormData) =>
      updateCustomerAction(customer?.id ?? 0, prevState, formData),
    [customer?.id]
  );

  const action = mode === "create" ? createCustomerAction : boundUpdateAction;

  const [state, formAction] = useActionState(action, {});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CustomerFormInput>({
    resolver: zodResolver(CustomerSchema),
    defaultValues: {
      name: customer?.name ?? "",
      symbol: customer?.symbol ?? "",
      email: customer?.email ?? "",
      phone: customer?.phone ?? "",
      nip: customer?.nip ?? "",
      address: customer?.address ?? "",
      accountManager: customer?.accountManager ?? "",
      priceListId: customer?.priceListId ?? null,
      isActive: customer?.isActive ?? true,
      notes: customer?.notes ?? "",
    },
  });

  // Handle server action result via state
  React.useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      router.push("/crm");
    } else if (state.error) {
      toast.error(state.error);
      setIsSubmitting(false);
    }
  }, [state, router]);

  async function onSubmit(data: CustomerFormInput) {
    setIsSubmitting(true);
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.set(key, String(value));
      }
    });
    // isActive checkbox handling
    formData.set("isActive", data.isActive ? "on" : "false");
    formAction(formData);
  }

  return (
    <GlassCard className="px-6 py-6">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Name */}
          <div className="md:col-span-2">
            <label className={labelClass}>
              Nazwa klienta <span className="text-red-400">*</span>
            </label>
            <input
              {...register("name")}
              className={inputClass}
              placeholder="Nazwa firmy lub klienta"
            />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>

          {/* Symbol */}
          <div>
            <label className={labelClass}>Symbol</label>
            <input
              {...register("symbol")}
              className={inputClass}
              placeholder="np. ALLBAG001"
            />
            {errors.symbol && <p className={errorClass}>{errors.symbol.message}</p>}
          </div>

          {/* NIP */}
          <div>
            <label className={labelClass}>NIP</label>
            <input
              {...register("nip")}
              className={inputClass}
              placeholder="0000000000"
            />
            {errors.nip && <p className={errorClass}>{errors.nip.message}</p>}
          </div>

          {/* Email */}
          <div>
            <label className={labelClass}>Email</label>
            <input
              {...register("email")}
              type="email"
              className={inputClass}
              placeholder="kontakt@firma.pl"
            />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>

          {/* Phone */}
          <div>
            <label className={labelClass}>Telefon</label>
            <input
              {...register("phone")}
              className={inputClass}
              placeholder="+48 000 000 000"
            />
            {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
          </div>

          {/* Address */}
          <div className="md:col-span-2">
            <label className={labelClass}>Adres</label>
            <textarea
              {...register("address")}
              className={textareaClass}
              placeholder="Ulica, nr, kod pocztowy, miasto"
            />
            {errors.address && <p className={errorClass}>{errors.address.message}</p>}
          </div>

          {/* Account Manager */}
          <div>
            <label className={labelClass}>Opiekun klienta</label>
            <input
              {...register("accountManager")}
              className={inputClass}
              placeholder="Imię i nazwisko"
            />
            {errors.accountManager && <p className={errorClass}>{errors.accountManager.message}</p>}
          </div>

          {/* Price List */}
          <div>
            <label className={labelClass}>Cennik</label>
            <select
              {...register("priceListId", {
                setValueAs: (v) => (v === "" || v === null ? null : Number(v)),
              })}
              className={cn(inputClass, "h-9")}
            >
              <option value="">Brak cennika</option>
              {priceLists.map((pl) => (
                <option key={pl.id} value={pl.id}>
                  {pl.name}
                </option>
              ))}
            </select>
            {errors.priceListId && <p className={errorClass}>{errors.priceListId.message}</p>}
          </div>

          {/* Notes */}
          <div className="md:col-span-2">
            <label className={labelClass}>Notatki</label>
            <textarea
              {...register("notes")}
              className={textareaClass}
              placeholder="Dodatkowe informacje..."
            />
            {errors.notes && <p className={errorClass}>{errors.notes.message}</p>}
          </div>

          {/* isActive */}
          <div className="md:col-span-2 flex items-center gap-3">
            <input
              {...register("isActive")}
              type="checkbox"
              id="isActive"
              className="h-4 w-4 rounded border-aether-border bg-aether-elevated accent-aether-blue"
            />
            <label htmlFor="isActive" className="text-sm text-aether-text-secondary cursor-pointer">
              Klient aktywny (odznacz aby dezaktywować; zaznacz ponownie aby reaktywować)
            </label>
          </div>
        </div>

        {/* Error message */}
        {state.error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <GlowButton type="submit" variant="primary" disabled={isSubmitting} loading={isSubmitting}>
            {mode === "create" ? "Utwórz klienta" : "Zapisz zmiany"}
          </GlowButton>
          <GlowButton
            type="button"
            variant="secondary"
            onClick={() => router.push("/crm")}
            disabled={isSubmitting}
          >
            Anuluj
          </GlowButton>
        </div>
      </form>
    </GlassCard>
  );
}
