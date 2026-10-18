import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { siteConfig } from "@/config/site";

export interface OrderConfirmedEmailItem {
  name: string;
  quantity: number;
  price: string;
}

export interface OrderConfirmedEmailProps {
  orderId: string;
  customerName?: string;
  total: string;
  items: OrderConfirmedEmailItem[];
  trackingUrl: string;
}

export default function OrderConfirmedEmail({
  orderId,
  customerName,
  total,
  items,
  trackingUrl,
}: OrderConfirmedEmailProps) {
  const greeting = customerName ? `Hi ${customerName},` : "Hi,";

  return (
    <Html>
      <Head />
      <Preview>Order confirmed · {siteConfig.name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>{siteConfig.name}</Text>
          </Section>
          <Heading style={h1}>Order confirmed</Heading>
          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            Thanks for your order. We&apos;ve received it and are getting it
            ready. Your order number is{" "}
            <strong style={strong}>{orderId}</strong>.
          </Text>
          <Text style={note}>
            A PDF copy of your invoice is attached to this email for your
            records.
          </Text>
          <Section style={summarySection}>
            <Text style={summaryHeader}>Order summary</Text>
            {items.map((item, index) => (
              <Text key={index} style={itemLine}>
                {item.name} — {item.quantity} × {item.price}
              </Text>
            ))}
            <Hr style={summaryHr} />
            <Text style={totalLine}>
              Total: <strong style={strong}>{total}</strong>
            </Text>
          </Section>
          <Section style={buttonSection}>
            <Button href={trackingUrl} style={button}>
              Track your order
            </Button>
          </Section>
          <Hr style={hr} />
          <Text style={footer}>
            © {new Date().getFullYear()} {siteConfig.name} ·{" "}
            <Link href={siteConfig.url} style={footerLink}>
              {siteConfig.url}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", margin: 0 };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "24px", maxWidth: "560px" };
const logoSection = { textAlign: "center" as const };
const logoText = { fontSize: "20px", fontWeight: 700, color: "#111827", margin: "0 0 8px" };
const h1 = { color: "#111827", fontSize: "24px", fontWeight: 700, margin: "0 0 16px" };
const paragraph = { color: "#374151", fontSize: "16px", lineHeight: "24px", margin: "0 0 16px" };
const strong = { fontWeight: 700, color: "#111827" };
const note = { color: "#4f46e5", fontSize: "14px", margin: "0 0 16px" };
const summarySection = { margin: "16px 0", padding: "16px", backgroundColor: "#f9fafb", borderRadius: "8px" };
const summaryHeader = { fontSize: "14px", fontWeight: 700, color: "#374151", margin: "0 0 8px" };
const itemLine = { fontSize: "14px", color: "#374151", margin: "0 0 4px" };
const summaryHr = { borderColor: "#e5e7eb", margin: "8px 0" };
const totalLine = { fontSize: "15px", color: "#111827", margin: "0" };
const buttonSection = { textAlign: "center" as const, margin: "24px 0" };
const button = { backgroundColor: "#4f46e5", borderRadius: "8px", color: "#ffffff", fontSize: "16px", fontWeight: 600, padding: "12px 24px", textDecoration: "none" };
const hr = { borderColor: "#e5e7eb", margin: "24px 0" };
const footer = { color: "#6b7280", fontSize: "12px", textAlign: "center" as const };
const footerLink = { color: "#6b7280" };
