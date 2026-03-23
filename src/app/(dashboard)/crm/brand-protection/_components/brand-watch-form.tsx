"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState } from "react";
import { toast } from "sonner";
import { BrandWatchItemSchema } from "@/lib/validations/crm";
import { createBrandWatchItemAction, updateBrandWatchItemAction } from "@/lib/actions/crm";
import { GlassCard } from "@/components/aether/glass-card";
import { GlowButton } from "@/components/aether/glow-button";
import { cn } from "@/lib/utils";
import type { z } from "zod";
import type { BrandWatchRow } from "@/lib/dal/crm";

type BrandWatchFormInput = z.input<typeof BrandWatchItemSchema>;

interface BrandWatchFormProps {
  mode: "create" | "edit";
  item?: BrandWatchRow;
  onClose: () => void;
  onSuccess: () => void;
}

const inputClass = cn(
  "w-full h-9 px-3 text-sm rounded-lg",
  "bg-aether-elevated border border-aether-border",
  "text-aether-text placeholder:text-aether-text-muted",
  "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
  "transition-all duration-200"
);

const textareaClass = cn(
  "w-full px-3 py-2 text-sm rounded-lg min-h-[60px]",
  "bg-aether-elevated border border-aether-border",
  "text-aether-text placeholder:text-aether-text-muted",
  "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
  "transition-all duration-200 resize-y"
);

const labelClass = "block text-sm font-medium text-aether-text-secondary mb-1";
const errorClass = "mt-1 text-xs text-red-400";

export function BrandWatchForm({ mode, item, onClose, onSuccess }: BrandWatchFormProps) {
  const boundUpdateAction = React.useCallback(
    (prevState: { error?: string; success?: string }, formData: FormData) =>
      updateBrandWatchItemAction(item?.id ?? 0, prevState, formData),
    [item?.id]
  );

  const action = mode === "create" ? createBrandWatchItemAction : boundUpdateAction;
  const [state, formAction] = useActionState(action, {});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<BrandWatchFormInput>({
    resolver: zodResolver(BrandWatchItemSchema),
    defaultValues: {
      url: item?.url ?? "",
      marketplace: item?.marketplace ?? "",
      productSku: item?.productSku ?? "",
      notes: item?.notes ?? "",
      status: (item?.status ?? "active") as "active" | "resolved" | "flagged",
    },
  });

  React.useEffect(() => {
    if (state.success) {
      toast.success(state.success);
      onSuccess();
    } else if (state.error) {
      toast.error(state.error);
    }
  }, [state, onSuccess]);

  async function onSubmit(data: BrandWatchFormInput) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== "") {
        formData.set(key, String(value));
      }
    });
    // url and marketplace are required
    formData.set("url", data.url);
    formData.set("marketplace", data.marketplace);
    formData.set("status", data.status ?? "active");
    formAction(formData);
  }

  return (
    <GlassCard className="px-6 py-6">
      <h3 className="text-lg font-semibold text-aether-text mb-4">
        {mode === "create" ? "Dodaj do monitoringu" : "Edytuj pozycję"}
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className={labelClass}>
            URL <span className="text-red-400">*</span>
          </label>
          <input
            {...register("url")}
            className={inputClass}
            placeholder="https://allegro.pl/oferta/..."
          />
          {errors.url && <p className={errorClass}>{errors.url.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Marketplace <span className="text-red-400">*</span>
            </label>
            <input
              {...register("marketplace")}
              className={inputClass}
              placeholder="np. allegro, amazon, ebay"
            />
            {errors.marketplace && <p className={errorClass}>{errors.marketplace.message}</p>}
          </div>

          <div>
            <label className={labelClass}>SKU produktu</label>
            <input
              {...register("productSku")}
              className={inputClass}
              placeholder="np. ALLBAG-001"
            />
            {errors.productSku && <p className={errorClass}>{errors.productSku.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select {...register("status")} className={cn(inputClass, "h-9")}>
              <option value="active">Aktywny</option>
              <option value="flagged">Oflagowany</option>
              <option value="resolved">Rozwiązany</option>
            </select>
            {errors.status && <p className={errorClass}>{errors.status.message}</p>}
          </div>
        </div>

        <div>
          <label className={labelClass}>Notatki</label>
          <textarea
            {...register("notes")}
            className={textareaClass}
            placeholder="Dodatkowe informacje..."
          />
          {errors.notes && <p className={errorClass}>{errors.notes.message}</p>}
        </div>

        {state.error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <GlowButton type="submit" variant="primary">
            {mode === "create" ? "Dodaj pozycję" : "Zapisz zmiany"}
          </GlowButton>
          <GlowButton type="button" variant="secondary" onClick={onClose}>
            Anuluj
          </GlowButton>
        </div>
      </form>
    </GlassCard>
  );
}
