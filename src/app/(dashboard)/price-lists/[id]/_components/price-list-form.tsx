"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  createPriceListSchema,
  type CreatePriceListFormInput,
} from "@/lib/validations/price-lists";
import {
  createPriceListAction,
  updatePriceListAction,
} from "@/lib/actions/price-lists";
import { GlassCard } from "@/components/aether/glass-card";
import { GlowButton, SubmitButton } from "@/components/aether/glow-button";
import type { PriceListRow } from "@/types/price-lists";
import { cn } from "@/lib/utils";

interface PriceListFormProps {
  mode: "create" | "edit";
  priceList?: PriceListRow;
}

const inputClass = cn(
  "w-full h-9 px-3 text-sm rounded-lg",
  "bg-aether-elevated border border-aether-border",
  "text-aether-text placeholder:text-aether-text-muted",
  "focus:outline-none focus:border-aether-border-glow focus:shadow-glow-sm",
  "transition-all duration-200"
);

const labelClass = "block text-sm font-medium text-aether-text-secondary mb-1";
const errorClass = "mt-1 text-xs text-red-400";

export function PriceListForm({ mode, priceList }: PriceListFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CreatePriceListFormInput>({
    resolver: zodResolver(createPriceListSchema),
    defaultValues: {
      code: priceList?.code ?? "",
      name: priceList?.name ?? "",
      description: priceList?.description ?? "",
      displayOrder: priceList?.displayOrder ?? 0,
    },
  });

  async function onSubmit(data: CreatePriceListFormInput) {
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("code", data.code.toUpperCase());
    formData.set("name", data.name);
    if (data.description) formData.set("description", data.description);
    formData.set("displayOrder", String(data.displayOrder ?? 0));

    let result;
    if (mode === "create") {
      result = await createPriceListAction({}, formData);
    } else {
      if (!priceList) {
        setIsSubmitting(false);
        return;
      }
      // bind the id for updatePriceListAction
      const boundAction = updatePriceListAction.bind(null, priceList.id);
      result = await boundAction({}, formData);
    }

    setIsSubmitting(false);

    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success(result.success ?? (mode === "create" ? "Cennik utworzony" : "Cennik zaktualizowany"));
      if (mode === "create") {
        router.push("/price-lists");
      }
    }
  }

  return (
    <GlassCard title="Dane cennika">
      <div className="px-6 py-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
          <div>
            <label className={labelClass}>Kod *</label>
            <input
              {...register("code")}
              type="text"
              placeholder="np. STANDARD"
              className={inputClass}
              style={{ textTransform: "uppercase" }}
              onChange={(e) => {
                e.target.value = e.target.value.toUpperCase();
                register("code").onChange(e);
              }}
            />
            {errors.code && <p className={errorClass}>{errors.code.message}</p>}
            <p className="mt-1 text-xs text-aether-text-muted">
              Tylko wielkie litery, cyfry i podkreślnik (np. BASIC, SPECIAL_2026)
            </p>
          </div>

          <div>
            <label className={labelClass}>Nazwa *</label>
            <input
              {...register("name")}
              type="text"
              placeholder="Nazwa cennika"
              className={inputClass}
            />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Opis</label>
            <textarea
              {...register("description")}
              placeholder="Opcjonalny opis cennika"
              rows={3}
              className={cn(inputClass, "h-auto resize-none py-2")}
            />
            {errors.description && (
              <p className={errorClass}>{errors.description.message}</p>
            )}
          </div>

          <div>
            <label className={labelClass}>Kolejność wyświetlania</label>
            <input
              {...register("displayOrder", { valueAsNumber: true })}
              type="number"
              min="0"
              className={inputClass}
            />
            {errors.displayOrder && (
              <p className={errorClass}>{errors.displayOrder.message}</p>
            )}
          </div>

          <div className="flex items-center gap-3 pt-2">
            <GlowButton
              type="button"
              variant="secondary"
              onClick={() => router.back()}
            >
              Anuluj
            </GlowButton>
            <SubmitButton loading={isSubmitting}>
              {mode === "create" ? "Utwórz cennik" : "Zapisz zmiany"}
            </SubmitButton>
          </div>
        </form>
      </div>
    </GlassCard>
  );
}
