import {
  Body,
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

export interface OrderCancelledEmailProps {
  orderId: string;
  stockRestored: boolean;
}

export default function OrderCancelledEmail({
  orderId,
  stockRestored,
}: OrderCancelledEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order has been cancelled · {siteConfig.name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>{siteConfig.name}</Text>
          </Section>
          <Heading style={h1}>Order cancelled</Heading>
          <Text style={paragraph}>
            Your order{" "}
            <strong style={strong}>{orderId}</strong>{" "}
            has been cancelled.
          </Text>
          {stockRestored ? (
            <Text style={paragraph}>
              The items from this order have been returned to stock, so they may
              be available to order again.
            </Text>
          ) : (
            <Text style={paragraph}>
              No stock changes were needed for this cancellation.
            </Text>
          )}
          <Text style={paragraph}>
            If you have any questions, our support team is here to help.
          </Text>
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
const hr = { borderColor: "#e5e7eb", margin: "24px 0" };
const footer = { color: "#6b7280", fontSize: "12px", textAlign: "center" as const };
const footerLink = { color: "#6b7280" };
