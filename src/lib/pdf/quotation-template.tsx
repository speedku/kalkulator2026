// Placeholder PDF template — full implementation in Phase 4 Plan 02 (PDF generation)
// This file provides the type signature for Server Action imports.
import React from "react";
import { Document, Page, Text } from "@react-pdf/renderer";
import type { QuotationWithItems } from "@/types/quotations";

interface QuotationPdfTemplateProps {
  quotation: QuotationWithItems;
}

export function QuotationPdfTemplate({ quotation }: QuotationPdfTemplateProps): React.ReactElement {
  return (
    <Document>
      <Page>
        <Text>{quotation.quotationNumber}</Text>
      </Page>
    </Document>
  );
}
