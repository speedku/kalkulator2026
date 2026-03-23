// @ts-nocheck
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { InvoiceWithItems } from "@/types/invoices";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a2e" },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#666" },
  twoCol: { flexDirection: "row", gap: 24, marginBottom: 16 },
  halfCol: { flex: 1 },
  section: { marginBottom: 16 },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingBottom: 4,
  },
  row: { flexDirection: "row", marginBottom: 3 },
  label: { width: 120, color: "#666" },
  value: { flex: 1 },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f3f4f6",
    padding: "6 8",
    marginBottom: 2,
  },
  tableRow: {
    flexDirection: "row",
    padding: "5 8",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  col1: { flex: 3 },
  col2: { width: 50, textAlign: "right" },
  col3: { width: 80, textAlign: "right" },
  col4: { width: 80, textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },
  totalSection: { marginTop: 8, alignItems: "flex-end" },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 3,
    gap: 16,
  },
  totalLabel: { width: 100, textAlign: "right", color: "#666" },
  totalValue: { width: 80, textAlign: "right" },
  grandTotal: { fontFamily: "Helvetica-Bold", fontSize: 12 },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: "center",
    fontSize: 9,
    color: "#999",
  },
});

const STATUS_LABELS: Record<string, string> = {
  draft: "Szkic",
  issued: "Wystawiona",
  paid: "Zapłacona",
  cancelled: "Anulowana",
};

interface Props {
  invoice: InvoiceWithItems;
}

export function InvoicePdfTemplate({ invoice }: Props) {
  const fmt = (v: number) =>
    new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(v);
  const fmtDate = (d: Date | null) =>
    d ? new Intl.DateTimeFormat("pl-PL").format(new Date(d)) : "—";

  return (
    <Document title={`Faktura ${invoice.invoiceNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Faktura VAT {invoice.invoiceNumber}</Text>
          <Text style={styles.subtitle}>
            Status: {STATUS_LABELS[invoice.status] ?? invoice.status}
          </Text>
        </View>

        {/* Dates + buyer */}
        <View style={styles.twoCol}>
          {/* Dates */}
          <View style={styles.halfCol}>
            <Text style={styles.sectionTitle}>Daty</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Data wystawienia:</Text>
              <Text style={styles.value}>{fmtDate(invoice.issuedAt)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.label}>Termin płatności:</Text>
              <Text style={styles.value}>{fmtDate(invoice.dueAt)}</Text>
            </View>
          </View>
          {/* Buyer */}
          <View style={styles.halfCol}>
            <Text style={styles.sectionTitle}>Nabywca</Text>
            <View style={styles.row}>
              <Text style={styles.label}>Nazwa:</Text>
              <Text style={styles.value}>{invoice.customerName}</Text>
            </View>
            {invoice.customerNip && (
              <View style={styles.row}>
                <Text style={styles.label}>NIP:</Text>
                <Text style={styles.value}>{invoice.customerNip}</Text>
              </View>
            )}
            {invoice.customerAddress && (
              <View style={styles.row}>
                <Text style={styles.label}>Adres:</Text>
                <Text style={styles.value}>{invoice.customerAddress}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Items table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pozycje faktury</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.bold]}>Produkt</Text>
            <Text style={[styles.col2, styles.bold]}>Ilość</Text>
            <Text style={[styles.col3, styles.bold]}>Cena netto</Text>
            <Text style={[styles.col4, styles.bold]}>Wartość netto</Text>
          </View>
          {invoice.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text>{item.productName}</Text>
                {item.sku && (
                  <Text style={{ fontSize: 9, color: "#888" }}>{item.sku}</Text>
                )}
              </View>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{fmt(item.unitNet)}</Text>
              <Text style={styles.col4}>{fmt(item.totalNet)}</Text>
            </View>
          ))}
        </View>

        {/* VAT summary */}
        <View style={styles.totalSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Wartość netto:</Text>
            <Text style={styles.totalValue}>{fmt(invoice.totalNet)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>VAT ({invoice.vatRate}%):</Text>
            <Text style={styles.totalValue}>{fmt(invoice.totalVat)}</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.grandTotal]}>Do zapłaty:</Text>
            <Text style={[styles.totalValue, styles.grandTotal]}>
              {fmt(invoice.totalGross)}
            </Text>
          </View>
        </View>

        {invoice.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uwagi</Text>
            <Text>{invoice.notes}</Text>
          </View>
        )}

        <Text style={styles.footer} fixed>
          ALLBAG — Faktura {invoice.invoiceNumber} | Wygenerowano:{" "}
          {fmtDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
}
