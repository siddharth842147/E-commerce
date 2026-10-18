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

export interface OrderDeliveredEmailProps {
  orderId: string;
}

export default function OrderDeliveredEmail({
  orderId,
}: OrderDeliveredEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your order has been delivered · {siteConfig.name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>{siteConfig.name}</Text>
          </Section>
          <Heading style={h1}>Order delivered</Heading>
          <Text style={paragraph}>
            Your order{" "}
            <strong style={strong}>{orderId}</strong>{" "}
            has been delivered. We hope you love what you ordered.
          </Text>
          <Text style={paragraph}>
            If anything isn&apos;t right, reach out to our support team and
            we&apos;ll make it right.
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
