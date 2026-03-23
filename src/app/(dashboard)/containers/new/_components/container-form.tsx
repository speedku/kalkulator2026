"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { createContainerAction } from "@/lib/actions/containers";
import { ContainerSchema } from "@/lib/validations/containers";

type FormValues = z.input<typeof ContainerSchema>;

const STATUS_OPTIONS = [
  { value: "in_transit", label: "W drodze" },
  { value: "at_port", label: "W porcie" },
  { value: "unloaded", label: "Rozładowany" },
  { value: "completed", label: "Gotowy" },
];

export function ContainerForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(ContainerSchema),
    defaultValues: {
      status: "in_transit",
    },
  });

  const onSubmit = handleSubmit((data) => {
    const formData = new FormData();
    formData.set("containerNumber", data.containerNumber);
    formData.set("carrier", data.carrier);
    formData.set("portOfOrigin", data.portOfOrigin);
    formData.set("portOfDestination", data.portOfDestination);
    formData.set("shipmentDate", String(data.shipmentDate));
    formData.set("etaDate", String(data.etaDate));
    if (data.status) formData.set("status", data.status);
    if (data.totalValue != null) formData.set("totalValue", String(data.totalValue));
    if (data.notes) formData.set("notes", data.notes);

    startTransition(async () => {
      const result = await createContainerAction(formData);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Kontener utworzony");
        if (result.id) {
          router.push(`/containers/${result.id}`);
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
      {/* Container identification */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Identyfikacja kontenera
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelClass}>Numer kontenera *</label>
            <input
              {...register("containerNumber")}
              type="text"
              placeholder="np. MSCU1234567"
              className={inputClass}
            />
            {errors.containerNumber && (
              <p className={errorClass}>{errors.containerNumber.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Przewoźnik *</label>
            <input
              {...register("carrier")}
              type="text"
              placeholder="np. MSC, Maersk, COSCO"
              className={inputClass}
            />
            {errors.carrier && (
              <p className={errorClass}>{errors.carrier.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Ports */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Trasa
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelClass}>Port załadunku *</label>
            <input
              {...register("portOfOrigin")}
              type="text"
              placeholder="np. Szanghaj, Guangzhou"
              className={inputClass}
            />
            {errors.portOfOrigin && (
              <p className={errorClass}>{errors.portOfOrigin.message}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className={labelClass}>Port docelowy *</label>
            <input
              {...register("portOfDestination")}
              type="text"
              placeholder="np. Hamburg, Gdańsk"
              className={inputClass}
            />
            {errors.portOfDestination && (
              <p className={errorClass}>{errors.portOfDestination.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Dates and status */}
      <div>
        <h3 className="text-sm font-semibold text-white/70 uppercase tracking-wide mb-3">
          Daty i status
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1">
            <label className={labelClass}>Data załadunku *</label>
            <input
              {...register("shipmentDate")}
              type="date"
              className={inputClass}
            />
            {errors.shipmentDate && (
              <p className={errorClass}>{errors.shipmentDate.message as string}</p>
            )}
          </div>
          <div className="space-y-1">
            <label className={labelClass}>ETA *</label>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className={labelClass}>Wartość całkowita (USD)</label>
            <input
              {...register("totalValue")}
              type="number"
              step="0.01"
              min="0"
              placeholder="np. 25000.00"
              className={inputClass}
            />
            {errors.totalValue && (
              <p className={errorClass}>{errors.totalValue.message as string}</p>
            )}
          </div>
        </div>
        <div className="space-y-1 mt-4">
          <label className={labelClass}>Uwagi</label>
          <textarea
            {...register("notes")}
            rows={3}
            placeholder="Opcjonalne uwagi do kontenera..."
            className={`${inputClass} resize-none`}
          />
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-all duration-200 h-10 px-6 text-sm bg-aether-blue text-white hover:bg-aether-blue/90 hover:shadow-glow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-aether-blue disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isPending ? "Tworzenie..." : "Utwórz kontener"}
        </button>
        <Link
          href="/containers"
          className="text-sm text-gray-400 hover:text-white transition-colors"
        >
          Anuluj
        </Link>
      </div>
    </form>
  );
}
