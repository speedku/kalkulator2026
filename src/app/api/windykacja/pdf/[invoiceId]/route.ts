import { renderToBuffer } from "@react-pdf/renderer";
import { NextResponse } from "next/server";
import { differenceInDays } from "date-fns";
import { requireAdmin } from "@/lib/dal/auth";
import { getInvoiceById } from "@/lib/dal/invoices";
import { WindykacjaPdfTemplate } from "@/lib/pdf/windykacja-template";
import React from "react";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ invoiceId: string }> }
) {
  await requireAdmin();

  const { invoiceId } = await params;
  const invoice = await getInvoiceById(Number(invoiceId));

  if (!invoice) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const daysOverdue = invoice.dueAt
    ? differenceInDays(new Date(), invoice.dueAt)
    : 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const element = React.createElement(WindykacjaPdfTemplate as any, {
    invoice: {
      invoiceNumber: invoice.invoiceNumber,
      customerName: invoice.customerName,
      customerNip: invoice.customerNip,
      totalGross: invoice.totalGross,
      dueAt: invoice.dueAt,
      daysOverdue,
    },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const buffer = await renderToBuffer(element as any);

  const headers = new Headers();
  headers.set("Content-Type", "application/pdf");
  headers.set(
    "Content-Disposition",
    `attachment; filename="wezwanie-${invoice.invoiceNumber}.pdf"`
  );

  return new NextResponse(Buffer.from(buffer), { headers });
}
