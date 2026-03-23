"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import type { QuotationWithItems } from "@/types/quotations";
import { duplicateQuotationAction } from "@/lib/actions/quotations";
import { SendEmailDialog } from "./send-email-dialog";

interface Props {
  quotation: QuotationWithItems;
}

export function QuotationActionsBar({ quotation }: Props) {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [isDuplicating, startDuplicate] = useTransition();
  const router = useRouter();

  // basePath-aware PDF URL — plain <a> tags don't get basePath auto-prefixed
  const pdfUrl = `/kalkulator2026/api/quotations/${quotation.id}/pdf`;

  const handleDuplicate = () => {
    startDuplicate(async () => {
      const result = await duplicateQuotationAction(quotation.id);
      if (result.error) {
        toast.error(result.error);
      } else {
        toast.success(result.success ?? "Wycena zduplikowana");
        if (result.newId) {
          router.push(`/quotations/${result.newId}`);
        }
      }
    });
  };

  return (
    <>
      <div className="flex flex-wrap gap-3">
        {/* Download PDF — plain <a> with full basePath */}
        <a
          href={pdfUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 0 0 5.25 21h13.5A2.25 2.25 0 0 0 21 18.75V16.5M16.5 12 12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Pobierz PDF
        </a>

        {/* Send email */}
        <button
          onClick={() => setShowEmailDialog(true)}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-sm font-medium transition-colors"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 0 1-2.25 2.25h-15a2.25 2.25 0 0 1-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0 0 19.5 4.5h-15a2.25 2.25 0 0 0-2.25 2.25m19.5 0v.243a2.25 2.25 0 0 1-1.07 1.916l-7.5 4.615a2.25 2.25 0 0 1-2.36 0L3.32 8.91a2.25 2.25 0 0 1-1.07-1.916V6.75" />
          </svg>
          Wyślij email
        </button>

        {/* Duplicate */}
        <button
          onClick={handleDuplicate}
          disabled={isDuplicating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/80 hover:text-white border border-white/10 text-sm font-medium transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 17.25v3.375c0 .621-.504 1.125-1.125 1.125h-9.75a1.125 1.125 0 0 1-1.125-1.125V7.875c0-.621.504-1.125 1.125-1.125H6.75a9.06 9.06 0 0 1 1.5.124m7.5 10.376h3.375c.621 0 1.125-.504 1.125-1.125V11.25c0-4.46-3.243-8.161-7.5-8.876a9.06 9.06 0 0 0-1.5-.124H9.375c-.621 0-1.125.504-1.125 1.125v3.5m7.5 10.375H9.375a1.125 1.125 0 0 1-1.125-1.125v-9.25m12 6.625v-1.875a3.375 3.375 0 0 0-3.375-3.375h-1.5a1.125 1.125 0 0 1-1.125-1.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H9.75" />
          </svg>
          {isDuplicating ? "Duplikowanie..." : "Duplikuj wycenę"}
        </button>
      </div>

      {/* Send email dialog */}
      {showEmailDialog && (
        <SendEmailDialog
          quotationId={quotation.id}
          defaultEmail={quotation.customerEmail}
          onClose={() => setShowEmailDialog(false)}
        />
      )}
    </>
  );
}
