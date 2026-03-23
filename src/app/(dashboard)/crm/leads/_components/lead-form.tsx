"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useActionState } from "react";
import { toast } from "sonner";
import { LeadSchema } from "@/lib/validations/crm";
import { createLeadAction, updateLeadAction } from "@/lib/actions/crm";
import { GlassCard } from "@/components/aether/glass-card";
import { GlowButton } from "@/components/aether/glow-button";
import { cn } from "@/lib/utils";
import type { z } from "zod";
import type { LeadRow } from "@/lib/dal/crm";

type LeadFormInput = z.input<typeof LeadSchema>;

interface LeadFormProps {
  mode: "create" | "edit";
  lead?: LeadRow;
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

const labelClass = "block text-sm font-medium text-aether-text-secondary mb-1";
const errorClass = "mt-1 text-xs text-red-400";

export function LeadForm({ mode, lead, onClose, onSuccess }: LeadFormProps) {
  const boundUpdateAction = React.useCallback(
    (prevState: { error?: string; success?: string }, formData: FormData) =>
      updateLeadAction(lead?.id ?? 0, prevState, formData),
    [lead?.id]
  );

  const action = mode === "create" ? createLeadAction : boundUpdateAction;
  const [state, formAction] = useActionState(action, {});

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LeadFormInput>({
    resolver: zodResolver(LeadSchema),
    defaultValues: {
      name: lead?.name ?? "",
      company: lead?.company ?? "",
      email: lead?.email ?? "",
      phone: lead?.phone ?? "",
      source: lead?.source ?? "",
      status: (lead?.status ?? "new") as "new" | "contacted" | "qualified" | "converted" | "lost",
      notes: lead?.notes ?? "",
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

  async function onSubmit(data: LeadFormInput) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.set(key, String(value));
      }
    });
    formAction(formData);
  }

  return (
    <GlassCard className="px-6 py-6">
      <h3 className="text-lg font-semibold text-aether-text mb-4">
        {mode === "create" ? "Nowy lead" : "Edytuj lead"}
      </h3>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>
              Imię i nazwisko <span className="text-red-400">*</span>
            </label>
            <input
              {...register("name")}
              className={inputClass}
              placeholder="Jan Kowalski"
            />
            {errors.name && <p className={errorClass}>{errors.name.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Firma</label>
            <input
              {...register("company")}
              className={inputClass}
              placeholder="Nazwa firmy"
            />
            {errors.company && <p className={errorClass}>{errors.company.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Email</label>
            <input
              {...register("email")}
              type="email"
              className={inputClass}
              placeholder="jan@firma.pl"
            />
            {errors.email && <p className={errorClass}>{errors.email.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Telefon</label>
            <input
              {...register("phone")}
              className={inputClass}
              placeholder="+48 000 000 000"
            />
            {errors.phone && <p className={errorClass}>{errors.phone.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Źródło</label>
            <input
              {...register("source")}
              className={inputClass}
              placeholder="np. strona www, targi, polecenie"
            />
            {errors.source && <p className={errorClass}>{errors.source.message}</p>}
          </div>

          <div>
            <label className={labelClass}>Status</label>
            <select {...register("status")} className={cn(inputClass, "h-9")}>
              <option value="new">Nowy</option>
              <option value="contacted">Skontaktowany</option>
              <option value="qualified">Zakwalifikowany</option>
              <option value="converted">Przekonwertowany</option>
              <option value="lost">Utracony</option>
            </select>
            {errors.status && <p className={errorClass}>{errors.status.message}</p>}
          </div>
        </div>

        {state.error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-2">
            {state.error}
          </p>
        )}

        <div className="flex items-center gap-3 pt-2">
          <GlowButton type="submit" variant="primary">
            {mode === "create" ? "Dodaj lead" : "Zapisz zmiany"}
          </GlowButton>
          <GlowButton type="button" variant="secondary" onClick={onClose}>
            Anuluj
          </GlowButton>
        </div>
      </form>
    </GlassCard>
  );
}
