"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateCaseStatusAction } from "@/lib/actions/windykacja";

const STATUS_OPTIONS = [
  { value: "open", label: "Otwarta" },
  { value: "reminded", label: "Przypomniana" },
  { value: "in_dispute", label: "W sporze" },
  { value: "settled", label: "Rozliczona" },
  { value: "written_off", label: "Odpisana" },
];

interface CaseDetailActionsProps {
  caseId: number;
  currentStatus: string;
}

export function CaseDetailActions({
  caseId,
  currentStatus,
}: CaseDetailActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState(currentStatus);
  const [isPending, startTransition] = useTransition();

  function handleStatusUpdate() {
    if (status === currentStatus) return;
    startTransition(async () => {
      const result = await updateCaseStatusAction(caseId, status);
      if (result.success) {
        toast.success(result.success);
        router.refresh();
      } else if (result.error) {
        toast.error(result.error);
        setStatus(currentStatus);
      }
    });
  }

  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label
          htmlFor="caseStatus"
          className="mb-1 block text-xs font-medium text-gray-400"
        >
          Zmień status sprawy
        </label>
        <select
          id="caseStatus"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white focus:border-indigo-500/60 focus:outline-none"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-gray-900">
              {opt.label}
            </option>
          ))}
        </select>
      </div>
      <button
        type="button"
        disabled={isPending || status === currentStatus}
        onClick={handleStatusUpdate}
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-500 disabled:opacity-50 transition-colors"
      >
        {isPending ? "Zapisywanie..." : "Zaktualizuj status"}
      </button>
    </div>
  );
}
