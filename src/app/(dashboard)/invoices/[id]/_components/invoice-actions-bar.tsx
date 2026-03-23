"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { deleteInvoiceAction } from "@/lib/actions/invoices";
import type { InvoiceWithItems } from "@/types/invoices";

interface Props {
  invoice: InvoiceWithItems;
}

export function InvoiceActionsBar({ invoice }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // basePath-aware PDF URL — plain <a> tags don't get basePath auto-prefixed
  const pdfUrl = `/kalkulator2026/api/invoices/${invoice.id}/pdf`;

  const handleDelete = () => {
    if (!confirm(`Usunąć fakturę ${invoice.invoiceNumber}?`)) return;
    startTransition(async () => {
      const result = await deleteInvoiceAction(invoice.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Faktura usunięta");
        router.push("/invoices");
      }
    });
  };

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {/* Download PDF — plain <a> with full basePath prefix */}
      <a
        href={pdfUrl}
        download={`Faktura_${invoice.invoiceNumber}.pdf`}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-sm font-medium transition-colors"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3"
          />
        </svg>
        Pobierz PDF
      </a>

      {/* Delete */}
      <button
        onClick={handleDelete}
        disabled={isPending}
        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600/20 hover:bg-red-600/40 text-red-400 border border-red-500/30 text-sm font-medium transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0"
          />
        </svg>
        {isPending ? "Usuwanie..." : "Usuń fakturę"}
      </button>
    </div>
  );
}
