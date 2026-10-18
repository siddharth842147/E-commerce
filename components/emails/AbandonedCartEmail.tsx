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

export interface AbandonedCartEmailProps {
  name?: string;
  itemsCount?: number;
  subtotal?: string;
  checkoutUrl?: string;
  couponCode?: string;
}

export default function AbandonedCartEmail({
  name,
  itemsCount = 1,
  subtotal,
  checkoutUrl = `${siteConfig.url}/cart`,
  couponCode = "WELCOME10",
}: AbandonedCartEmailProps) {
  const greeting = name ? `Hi ${name},` : "Hi there,";

  return (
    <Html>
      <Head />
      <Preview>You left something special behind in your cart!</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>{siteConfig.name}</Text>
          </Section>

          <Heading style={h1}>Did you forget something?</Heading>

          <Text style={paragraph}>{greeting}</Text>
          <Text style={paragraph}>
            We noticed you left {itemsCount} item{itemsCount > 1 ? "s" : ""} waiting in your shopping cart.
            {subtotal ? ` Your bag total is ₹${subtotal}.` : ""} Good news: your selected items are still reserved for you!
          </Text>

          {couponCode && (
            <Section style={couponBanner}>
              <Text style={couponText}>
                Here is a special incentive: Use code <strong style={{ letterSpacing: "1px" }}>{couponCode}</strong> at checkout for 10% off your order!
              </Text>
            </Section>
          )}

          <Section style={buttonSection}>
            <Button href={checkoutUrl} style={button}>
              Complete My Order
            </Button>
          </Section>

          <Text style={subtext}>
            Need assistance or have questions about a product? Simply reply to this email or visit our{" "}
            <Link href={`${siteConfig.url}/contact`} style={inlineLink}>
              help center
            </Link>.
          </Text>

          <Hr style={hr} />
          <Text style={footer}>
            © {new Date().getFullYear()} {siteConfig.name} · Quality Products Delivered Across India ·{" "}
            <Link href={siteConfig.url} style={footerLink}>
              {siteConfig.url}
            </Link>
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

const main = { backgroundColor: "#f6f9fc", margin: 0, fontFamily: "sans-serif" };
const container = { backgroundColor: "#ffffff", margin: "0 auto", padding: "28px", maxWidth: "560px", borderRadius: "12px" };
const logoSection = { textAlign: "center" as const, paddingBottom: "12px" };
const logoText = { fontSize: "22px", fontWeight: 700, color: "#111827", margin: "0 0 8px", letterSpacing: "-0.5px" };
const h1 = { color: "#111827", fontSize: "22px", fontWeight: 700, margin: "0 0 16px", textAlign: "center" as const };
const paragraph = { color: "#374151", fontSize: "15px", lineHeight: "24px", margin: "0 0 16px" };
const couponBanner = { backgroundColor: "#ecfdf5", border: "1px dashed #10b981", borderRadius: "8px", padding: "12px 16px", margin: "20px 0" };
const couponText = { color: "#065f46", fontSize: "14px", fontWeight: 500, margin: 0, textAlign: "center" as const };
const buttonSection = { textAlign: "center" as const, margin: "24px 0" };
const button = { backgroundColor: "#0f172a", borderRadius: "8px", color: "#ffffff", fontSize: "15px", fontWeight: 600, padding: "12px 28px", textDecoration: "none", display: "inline-block" };
const subtext = { color: "#6b7280", fontSize: "13px", lineHeight: "20px", margin: "20px 0 0" };
const inlineLink = { color: "#2563eb", textDecoration: "underline" };
const hr = { borderColor: "#e5e7eb", margin: "24px 0" };
const footer = { color: "#9ca3af", fontSize: "11px", textAlign: "center" as const };
const footerLink = { color: "#9ca3af" };
