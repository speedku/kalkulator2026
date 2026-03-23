import React from "react";
import {
  Document,
  Page,
  Text,
  View,
  StyleSheet,
} from "@react-pdf/renderer";
import type { QuotationWithItems } from "@/types/quotations";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: "Helvetica", color: "#1a1a2e" },
  header: { marginBottom: 24 },
  title: { fontSize: 20, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 11, color: "#666" },
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
  col2: { width: 60, textAlign: "right" },
  col3: { width: 80, textAlign: "right" },
  col4: { width: 80, textAlign: "right" },
  bold: { fontFamily: "Helvetica-Bold" },
  totalRow: {
    flexDirection: "row",
    padding: "6 8",
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
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
  sent: "Wysłana",
  accepted: "Zaakceptowana",
  rejected: "Odrzucona",
};

interface Props {
  quotation: QuotationWithItems;
}

export function QuotationPdfTemplate({ quotation }: Props) {
  const formatCurrency = (val: number) =>
    new Intl.NumberFormat("pl-PL", { style: "currency", currency: "PLN" }).format(val);
  const formatDate = (d: Date | string) =>
    new Intl.DateTimeFormat("pl-PL").format(new Date(d));

  return (
    <Document title={`Wycena ${quotation.quotationNumber}`}>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Wycena {quotation.quotationNumber}</Text>
          <Text style={styles.subtitle}>
            Status: {STATUS_LABELS[quotation.status] ?? quotation.status} | Data:{" "}
            {formatDate(quotation.createdAt)}
          </Text>
        </View>

        {/* Customer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dane klienta</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nazwa:</Text>
            <Text style={styles.value}>{quotation.customerName}</Text>
          </View>
          {quotation.customerEmail && (
            <View style={styles.row}>
              <Text style={styles.label}>Email:</Text>
              <Text style={styles.value}>{quotation.customerEmail}</Text>
            </View>
          )}
          {quotation.priceListName && (
            <View style={styles.row}>
              <Text style={styles.label}>Cennik:</Text>
              <Text style={styles.value}>{quotation.priceListName}</Text>
            </View>
          )}
        </View>

        {/* Items table */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pozycje wyceny</Text>
          <View style={styles.tableHeader}>
            <Text style={[styles.col1, styles.bold]}>Produkt</Text>
            <Text style={[styles.col2, styles.bold]}>Ilość</Text>
            <Text style={[styles.col3, styles.bold]}>Cena jedn.</Text>
            <Text style={[styles.col4, styles.bold]}>Wartość</Text>
          </View>
          {quotation.items.map((item) => (
            <View key={item.id} style={styles.tableRow}>
              <View style={styles.col1}>
                <Text>{item.productName}</Text>
                {item.sku && (
                  <Text style={{ fontSize: 9, color: "#888" }}>{item.sku}</Text>
                )}
              </View>
              <Text style={styles.col2}>{item.quantity}</Text>
              <Text style={styles.col3}>{formatCurrency(item.unitPrice)}</Text>
              <Text style={styles.col4}>{formatCurrency(item.totalPrice)}</Text>
            </View>
          ))}
          <View style={styles.totalRow}>
            <Text style={[styles.col1, styles.bold]}>RAZEM</Text>
            <Text style={styles.col2}></Text>
            <Text style={styles.col3}></Text>
            <Text style={[styles.col4, styles.bold]}>
              {formatCurrency(quotation.totalAmount)}
            </Text>
          </View>
        </View>

        {/* Notes */}
        {quotation.notes && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Uwagi</Text>
            <Text>{quotation.notes}</Text>
          </View>
        )}

        {/* Footer */}
        <Text style={styles.footer} fixed>
          ALLBAG — Wycena {quotation.quotationNumber} | Wygenerowano:{" "}
          {formatDate(new Date())}
        </Text>
      </Page>
    </Document>
  );
}
