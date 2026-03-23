import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { getQuotationById } from "@/lib/dal/quotations";
import { QuotationPdfTemplate } from "@/lib/pdf/quotation-template";
import React from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const quotation = await getQuotationById(Number(id));
  if (!quotation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Use React.createElement (not JSX) to keep this file free of JSX pragma,
  // and to satisfy @react-pdf/renderer's ReactElement<DocumentProps> expectation.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(QuotationPdfTemplate as any, { quotation });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set(
    "Content-Disposition",
    `attachment; filename="Wycena_${quotation.quotationNumber}.pdf"`
  );
  return new NextResponse(Buffer.from(buffer), { headers });
}
