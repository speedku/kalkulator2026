"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createDomesticDeliveryAction } from "@/lib/actions/domestic-deliveries";
import { DomesticDeliverySchema } from "@/lib/validations/domestic-deliveries";

type FormValues = z.input<typeof DomesticDeliverySchema>;

const STATUS_OPTIONS = [
  { value: "pending", label: "Oczekuje" },
  { value: "in_transit", label: "W drodze" },
  { value: "delivered", label: "Dostarczona" },
  { value: "cancelled", label: "Anulowana" },
];

export function DeliveryForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(DomesticDeliverySchema),
    defaultValues: {
      status: "pending",
    },
  });

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    formData.set("name", data.name);
    formData.set("supplier", data.supplier);
    formData.set("etaDate", String(data.etaDate));
    formData.set("status", data.status ?? "pending");
    if (data.description) formData.set("description", data.description);
    if (data.notes) formData.set("notes", data.notes);

    startTransition(async () => {
      const result = await createDomesticDeliveryAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Dostawa utworzona");
        if (result.id) {
          router.push(`/deliveries/${result.id}`);
        }
      }
    });
  });

  const inputClass =
    "w-full px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder-gray-500 text-sm focus:border-aether-blue/50 focus:outline-none";
  const errorClass = "text-xs text-red-400 mt-0.5";
  const labelClass = "text-xs text-gray-400";

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic info */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Informacje podstawowe
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelClass}>Nazwa dostawy *</label>
            <input
              {...register("name")}
              type="text"
              placeholder="np. Dostawa tkanin — marzec 2026"
              className={inputClass}
            />
            {errors.name && (
              <p className={errorClass}>{errors.name.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Dostawca *</label>
            <input
              {...register("supplier")}
              type="text"
              placeholder="np. ABC Textiles Sp. z o.o."
              className={inputClass}
            />
            {errors.supplier && (
              <p className={errorClass}>{errors.supplier.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Date and status */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Daty i status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelClass}>Planowana data dostawy (ETA) *</label>
            <input
              {...register("etaDate")}
              type="date"
              className={inputClass}
            />
            {errors.etaDate && (
              <p className={errorClass}>{errors.etaDate.message as string}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Status</label>
            <select {...register("status")} className={inputClass}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Optional fields */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Dodatkowe informacje
        </h3>
        <div className="space-y-4">
          <div className="space-y-1">
            <label className={labelClass}>Opis</label>
            <textarea
              {...register("description")}
              rows={2}
              placeholder="Krótki opis dostawy (opcjonalne)..."
              className={`${inputClass} resize-none`}
            />
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Uwagi</label>
            <textarea
              {...register("notes")}
              rows={3}
              placeholder="Dodatkowe uwagi (opcjonalne)..."
              className={`${inputClass} resize-none`}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-6 text-sm bg-aether-blue text-white hover:bg-aether-blue/90 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Tworzenie..." : "Utwórz dostawę"}
        </button>
        <Link
          href="/deliveries"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Anuluj
        </Link>
      </div>
    </form>
  );
}
