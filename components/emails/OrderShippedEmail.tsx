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

export interface OrderShippedEmailProps {
  orderId: string;
  trackingUrl?: string;
}

export default function OrderShippedEmail({
  orderId,
  trackingUrl,
}: OrderShippedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order is on its way · {siteConfig.name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>{siteConfig.name}</Text>
          </Section>
          <Heading style={h1}>Your order has shipped</Heading>
          <Text style={paragraph}>
            Good news! Your order{" "}
            <strong style={strong}>{orderId}</strong>{" "}
            is on its way. It&apos;s been packed and handed over to the courier.
          </Text>
          {trackingUrl ? (
            <Section style={buttonSection}>
              <Button href={trackingUrl} style={button}>
                Track your shipment
              </Button>
            </Section>
          ) : (
            <Text style={paragraph}>
              We&apos;ll share a tracking link here as soon as the courier scans
              your parcel.
            </Text>
          )}
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
const buttonSection = { textAlign: "center" as const, margin: "24px 0" };
const button = { backgroundColor: "#4f46e5", borderRadius: "8px", color: "#ffffff", fontSize: "16px", fontWeight: 600, padding: "12px 24px", textDecoration: "none" };
const hr = { borderColor: "#e5e7eb", margin: "24px 0" };
const footer = { color: "#6b7280", fontSize: "12px", textAlign: "center" as const };
const footerLink = { color: "#6b7280" };
