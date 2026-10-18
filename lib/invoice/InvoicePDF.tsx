import {
  Document,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import { siteConfig } from "@/config/site";

export interface InvoicePDFShippingAddress {
  recipientName: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  phone: string;
}

export interface InvoicePDFItem {
  productName: string;
  variantTitle: string;
  sku: string;
  quantity: number;
  unitPrice: string;
  total: string;
}

export interface InvoicePDFProps {
  /** Order id, used as the invoice number. */
  invoiceNumber: string;
  orderDate: string | Date;
  customerName: string;
  shippingAddress: InvoicePDFShippingAddress;
  items: InvoicePDFItem[];
  subtotal: string;
  discount: string;
  tax: string;
  shipping: string;
  total: string;
  paymentMethod: string;
  orderStatus: string;
}

const styles = StyleSheet.create({
  page: { paddingTop: 40, paddingBottom: 40, paddingHorizontal: 48, fontSize: 11, fontFamily: "Helvetica", color: "#111827" },
  brandRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  brand: { fontSize: 22, fontWeight: "bold", color: "#4f46e5" },
  brandSub: { fontSize: 9, color: "#6b7280" },
  title: { fontSize: 18, fontWeight: "bold", marginTop: 24, marginBottom: 4 },
  titleSub: { fontSize: 10, color: "#6b7280", marginBottom: 16 },
  columns: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  col: { width: "48%" },
  sectionTitle: { fontSize: 9, fontWeight: "bold", color: "#6b7280", marginBottom: 4, textTransform: "uppercase" },
  line: { fontSize: 11, marginBottom: 2 },
  tableHeader: { flexDirection: "row", backgroundColor: "#f9fafb", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingTop: 6, paddingBottom: 6 },
  tableRow: { flexDirection: "row", borderBottomWidth: 1, borderBottomColor: "#e5e7eb", paddingTop: 6, paddingBottom: 6 },
  colProduct: { width: "38%" },
  colVariant: { width: "20%" },
  colSku: { width: "14%" },
  colQty: { width: "8%" },
  colUnit: { width: "10%" },
  colTotal: { width: "10%" },
  cellHeader: { fontSize: 9, fontWeight: "bold", color: "#374151" },
  cell: { fontSize: 9 },
  totalsWrap: { flexDirection: "row", justifyContent: "flex-end", marginTop: 16 },
  totalsCol: { width: "45%" },
  totalsRow: { flexDirection: "row", justifyContent: "space-between", paddingTop: 4, paddingBottom: 4 },
  totalsLabel: { fontSize: 10, color: "#374151" },
  totalsValue: { fontSize: 10 },
  totalsGrand: { flexDirection: "row", justifyContent: "space-between", borderTopWidth: 1, borderTopColor: "#e5e7eb", marginTop: 6, paddingTop: 8, paddingBottom: 8 },
  totalsGrandLabel: { fontSize: 12, fontWeight: "bold" },
  totalsGrandValue: { fontSize: 12, fontWeight: "bold" },
  footerMeta: { flexDirection: "row", justifyContent: "space-between", marginTop: 24 },
  metaLabel: { fontSize: 9, color: "#6b7280" },
  metaValue: { fontSize: 11 },
  pageFooter: { position: "absolute", bottom: 24, left: 48, right: 48, paddingTop: 8, borderTopWidth: 1, borderTopColor: "#e5e7eb", fontSize: 8, color: "#9ca3af", textAlign: "center" },
});

export default function InvoicePDF(props: InvoicePDFProps) {
  const orderDateStr =
    props.orderDate instanceof Date
      ? props.orderDate.toLocaleDateString()
      : props.orderDate;

  const addr = props.shippingAddress;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header / branding */}
        <View style={styles.brandRow}>
          <View>
            <Text style={styles.brand}>{siteConfig.name}</Text>
            <Text style={styles.brandSub}>{siteConfig.url}</Text>
          </View>
          <View>
            <Text style={styles.sectionTitle}>Invoice</Text>
            <Text style={styles.metaValue}>#{props.invoiceNumber}</Text>
          </View>
        </View>

        <Text style={styles.title}>Invoice</Text>
        <Text style={styles.titleSub}>Thank you for your purchase from {siteConfig.name}.</Text>

        {/* Customer + shipping address */}
        <View style={styles.columns}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Billed to</Text>
            <Text style={styles.line}>{props.customerName}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Shipped to</Text>
            <Text style={styles.line}>{addr.recipientName}</Text>
            <Text style={styles.line}>{addr.addressLine1}</Text>
            {addr.addressLine2 ? <Text style={styles.line}>{addr.addressLine2}</Text> : null}
            <Text style={styles.line}>
              {addr.city}, {addr.state} {addr.postalCode}
            </Text>
            <Text style={styles.line}>{addr.phone}</Text>
          </View>
        </View>

        {/* Order meta */}
        <View style={styles.columns}>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Order date</Text>
            <Text style={styles.metaValue}>{orderDateStr}</Text>
          </View>
          <View style={styles.col}>
            <Text style={styles.sectionTitle}>Payment method</Text>
            <Text style={styles.metaValue}>{props.paymentMethod}</Text>
          </View>
        </View>

        {/* Line items */}
        <View style={styles.tableHeader}>
          <Text style={[styles.colProduct, styles.cellHeader]}>Product</Text>
          <Text style={[styles.colVariant, styles.cellHeader]}>Variant</Text>
          <Text style={[styles.colSku, styles.cellHeader]}>SKU</Text>
          <Text style={[styles.colQty, styles.cellHeader]}>Qty</Text>
          <Text style={[styles.colUnit, styles.cellHeader]}>Unit Price</Text>
          <Text style={[styles.colTotal, styles.cellHeader]}>Total</Text>
        </View>
        {props.items.map((item, index) => (
          <View key={index} style={styles.tableRow}>
            <Text style={[styles.colProduct, styles.cell]}>{item.productName}</Text>
            <Text style={[styles.colVariant, styles.cell]}>{item.variantTitle}</Text>
            <Text style={[styles.colSku, styles.cell]}>{item.sku}</Text>
            <Text style={[styles.colQty, styles.cell]}>{item.quantity}</Text>
            <Text style={[styles.colUnit, styles.cell]}>{item.unitPrice}</Text>
            <Text style={[styles.colTotal, styles.cell]}>{item.total}</Text>
          </View>
        ))}

        {/* Totals */}
        <View style={styles.totalsWrap}>
          <View style={styles.totalsCol}>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Subtotal</Text>
              <Text style={styles.totalsValue}>{props.subtotal}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Discount</Text>
              <Text style={styles.totalsValue}>{props.discount}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Tax (GST)</Text>
              <Text style={styles.totalsValue}>{props.tax}</Text>
            </View>
            <View style={styles.totalsRow}>
              <Text style={styles.totalsLabel}>Shipping</Text>
              <Text style={styles.totalsValue}>{props.shipping}</Text>
            </View>
            <View style={styles.totalsGrand}>
              <Text style={styles.totalsGrandLabel}>Total</Text>
              <Text style={styles.totalsGrandValue}>{props.total}</Text>
            </View>
          </View>
        </View>

        {/* Order status */}
        <View style={styles.footerMeta}>
          <View>
            <Text style={styles.sectionTitle}>Order status</Text>
            <Text style={styles.metaValue}>{props.orderStatus}</Text>
          </View>
        </View>

        <Text style={styles.pageFooter} fixed>
          {siteConfig.name} · {siteConfig.url} · Invoice #{props.invoiceNumber}
        </Text>
      </Page>
    </Document>
  );
}
