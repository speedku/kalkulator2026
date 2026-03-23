import React from "react";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { pl } from "date-fns/locale";

interface WindykacjaPdfProps {
  invoice: {
    invoiceNumber: string;
    customerName: string;
    customerNip?: string | null;
    totalGross: number;
    dueAt: Date | null;
    daysOverdue: number;
  };
}

const styles = StyleSheet.create({
  page: {
    padding: 48,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a2e",
    lineHeight: 1.5,
  },
  header: {
    marginBottom: 32,
    borderBottomWidth: 2,
    borderBottomColor: "#1a1a2e",
    paddingBottom: 12,
  },
  companyName: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    marginBottom: 2,
  },
  companyAddress: {
    fontSize: 9,
    color: "#555",
  },
  docDate: {
    marginBottom: 24,
    fontSize: 9,
    color: "#555",
    textAlign: "right",
  },
  titleSection: {
    marginBottom: 24,
    textAlign: "center",
  },
  title: {
    fontSize: 16,
    fontFamily: "Helvetica-Bold",
    letterSpacing: 2,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 10,
    color: "#555",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ddd",
    paddingBottom: 4,
  },
  row: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    width: 140,
    color: "#666",
  },
  value: {
    flex: 1,
    fontFamily: "Helvetica-Bold",
  },
  overdueMessage: {
    marginBottom: 20,
    padding: 12,
    backgroundColor: "#fff3cd",
    borderWidth: 1,
    borderColor: "#ffc107",
    borderRadius: 4,
    fontSize: 10,
  },
  paymentInstruction: {
    marginBottom: 24,
    fontSize: 10,
  },
  signature: {
    marginTop: 48,
    flexDirection: "row",
    justifyContent: "flex-end",
  },
  signatureBox: {
    width: 200,
    textAlign: "center",
  },
  signatureLine: {
    borderTopWidth: 1,
    borderTopColor: "#1a1a2e",
    paddingTop: 6,
    marginTop: 48,
    fontSize: 9,
    color: "#555",
  },
  bold: {
    fontFamily: "Helvetica-Bold",
  },
});

function formatPLN(value: number) {
  return `${value.toFixed(2).replace(".", ",")} PLN`;
}

export function WindykacjaPdfTemplate({ invoice }: WindykacjaPdfProps) {
  const today = new Date();
  const docDateStr = format(today, "dd MMMM yyyy", { locale: pl });
  const dueDateStr = invoice.dueAt
    ? format(invoice.dueAt, "dd.MM.yyyy", { locale: pl })
    : "—";

  return (
    <Document
      title={`Wezwanie do zapłaty — ${invoice.invoiceNumber}`}
      author="ALLBAG"
    >
      <Page size="A4" style={styles.page}>
        {/* Company header */}
        <View style={styles.header}>
          <Text style={styles.companyName}>ALLBAG</Text>
          <Text style={styles.companyAddress}>
            ul. Przykładowa 1, 00-001 Warszawa{"\n"}
            NIP: 000-000-00-00 | REGON: 000000000{"\n"}
            biuro@allbag.pl | tel. +48 000 000 000
          </Text>
        </View>

        {/* Document date (right-aligned) */}
        <Text style={styles.docDate}>Warszawa, dnia {docDateStr}</Text>

        {/* Title */}
        <View style={styles.titleSection}>
          <Text style={styles.title}>WEZWANIE DO ZAPŁATY</Text>
          <Text style={styles.subtitle}>
            nr ref. {invoice.invoiceNumber}
          </Text>
        </View>

        {/* Customer block */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dane dłużnika</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Nazwa firmy / Imię i nazwisko:</Text>
            <Text style={styles.value}>{invoice.customerName}</Text>
          </View>
          {invoice.customerNip && (
            <View style={styles.row}>
              <Text style={styles.label}>NIP:</Text>
              <Text style={styles.value}>{invoice.customerNip}</Text>
            </View>
          )}
        </View>

        {/* Invoice details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Szczegóły zobowiązania</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Numer faktury:</Text>
            <Text style={styles.value}>{invoice.invoiceNumber}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Kwota do zapłaty:</Text>
            <Text style={[styles.value, styles.bold]}>
              {formatPLN(invoice.totalGross)}
            </Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Termin płatności:</Text>
            <Text style={styles.value}>{dueDateStr}</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Dni po terminie:</Text>
            <Text style={[styles.value, styles.bold]}>
              {invoice.daysOverdue} dni
            </Text>
          </View>
        </View>

        {/* Overdue message */}
        <View style={styles.overdueMessage}>
          <Text>
            Uprzejmie informujemy, że wyżej wymieniona faktura jest
            przeterminowana o {invoice.daysOverdue}{" "}
            {invoice.daysOverdue === 1 ? "dzień" : "dni"}. Do chwili obecnej
            nie odnotowaliśmy wpłaty należnej kwoty{" "}
            {formatPLN(invoice.totalGross)}.
          </Text>
        </View>

        {/* Payment instruction */}
        <View style={styles.paymentInstruction}>
          <Text style={styles.sectionTitle}>Wezwanie do zapłaty</Text>
          <Text>
            Wzywamy Państwa do niezwłocznego uregulowania zaległej należności w
            kwocie{" "}
            <Text style={styles.bold}>{formatPLN(invoice.totalGross)}</Text> w
            terminie 7 dni od daty otrzymania niniejszego wezwania. W przypadku
            braku wpłaty zastrzegamy sobie prawo do dochodzenia należności na
            drodze sądowej, a wszelkie koszty postępowania obciążą dłużnika.
          </Text>
          <Text style={{ marginTop: 8 }}>
            W przypadku pytań lub wątpliwości prosimy o kontakt pod adresem
            biuro@allbag.pl lub telefonicznie pod numerem +48 000 000 000.
          </Text>
        </View>

        {/* Signature */}
        <View style={styles.signature}>
          <View style={styles.signatureBox}>
            <Text style={styles.signatureLine}>
              Podpis i pieczęć upoważnionego{"\n"}przedstawiciela ALLBAG
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
}
