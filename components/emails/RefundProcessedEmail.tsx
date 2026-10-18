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

export interface RefundProcessedEmailProps {
  orderId: string;
  amount: string;
  /** Refund settlement timeline. Defaults to "5-7 business days". */
  timeline?: string;
}

export default function RefundProcessedEmail({
  orderId,
  amount,
  timeline = "5-7 business days",
}: RefundProcessedEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your refund has been processed · {siteConfig.name}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>{siteConfig.name}</Text>
          </Section>
          <Heading style={h1}>Refund processed</Heading>
          <Text style={paragraph}>
            We&apos;ve processed a refund of{" "}
            <strong style={strong}>{amount}</strong>{" "}
            for your order{" "}
            <strong style={strong}>{orderId}</strong>
            .
          </Text>
          <Text style={paragraph}>
            The refund should appear in your original payment method within{" "}
            {timeline}. The exact timing depends on your bank or card issuer.
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
