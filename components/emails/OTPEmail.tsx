import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import { siteConfig } from "@/config/site";

export interface OTPEmailProps {
  otp: string;
}

export default function OTPEmail({ otp }: OTPEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>Your {siteConfig.name} verification code</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={logoSection}>
            <Text style={logoText}>{siteConfig.name}</Text>
          </Section>
          <Heading style={h1}>Your verification code</Heading>
          <Text style={paragraph}>
            Use the code below to complete verification. It expires shortly, so
            enter it soon.
          </Text>
          <Section style={codeSection}>
            <Text style={code}>{otp}</Text>
          </Section>
          <Text style={paragraph}>
            If you didn&apos;t request this code, you can safely ignore this
            email.
          </Text>
          <Hr style={hr} />
          <Text style={footer}>
            © {new Date().getFullYear()} {siteConfig.name}
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
const codeSection = { textAlign: "center" as const, margin: "24px 0", padding: "24px", backgroundColor: "#f9fafb", borderRadius: "8px" };
const code = { fontSize: "32px", fontWeight: 700, letterSpacing: "8px", color: "#4f46e5", margin: "0" };
const hr = { borderColor: "#e5e7eb", margin: "24px 0" };
const footer = { color: "#6b7280", fontSize: "12px", textAlign: "center" as const };
