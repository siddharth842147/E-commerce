# Kartiva — Modern E-Commerce Platform

A production-ready, full-stack e-commerce platform built with Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS v4, Drizzle ORM, PostgreSQL (Supabase), Razorpay payments, Inngest background workflows, and Resend transactional notifications.

---

## Architecture & Stack

- **Framework**: Next.js 16.4.2 (App Router, Server Actions, Partial Prerendering)
- **Frontend**: React 19, Tailwind CSS v4, Framer Motion, Lucide Icons
- **Database**: PostgreSQL with Drizzle ORM (Supabase Connection Pooler)
- **Authentication & Storage**: Supabase Auth (SSR) & Supabase Storage
- **Payments**: Razorpay with server-side HMAC-SHA256 signature verification & idempotent webhooks
- **Background Jobs**: Inngest (abandoned carts, order confirmations, inventory management)
- **Communications**: Resend (Email), MSG91 (SMS), WhatsApp Cloud API
- **Fulfillment**: Shiprocket API integration (with mock/stub fallback)
- **Hosting Target**: Netlify (via `@netlify/plugin-nextjs`) or Cloudflare Pages

---

## 1. Local Development Setup

### Prerequisites

- **Node.js**: v20.x or v22.x LTS
- **npm** (or pnpm/yarn)
- **PostgreSQL Database** (Supabase or local Postgres instance)

### Installation

1. **Clone the repository**:
   ```bash
   git clone <repository-url>
   cd E-Commerce
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Copy the example environment file and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```
   *(See the Environment Variables table below for details)*

4. **Sync Database Schema & Seed Data**:
   ```bash
   npm run db:push
   npm run db:seed
   ```

5. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

6. **Run Test Suite & Linter**:
   ```bash
   npm test
   npm run lint
   ```

---

## 2. Environment Variables Reference

| Variable | Scope | Required | Description |
| :--- | :--- | :---: | :--- |
| `NEXT_PUBLIC_APP_URL` | Client & Server | Yes | Base canonical URL (e.g., `https://kartiva.com` or `http://localhost:3000`). |
| `NEXT_PUBLIC_SUPABASE_URL` | Client & Server | Yes | Supabase project API URL (`https://<ref>.supabase.co`). |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client & Server | Yes | Supabase public anonymous API key for client-side queries. |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server Only** | Yes | Secret service-role key for backend storage uploads & admin operations. **Never expose to browser.** |
| `DATABASE_URL` | **Server Only** | Yes | PostgreSQL connection string. Use port `5432` / pooler for serverless deployments. |
| `RAZORPAY_KEY_ID` | **Server Only** | Yes | Razorpay API Key ID for order creation and verification. |
| `NEXT_PUBLIC_RAZORPAY_KEY_ID` | Client & Server | Yes | Matches `RAZORPAY_KEY_ID` for initializing the client checkout modal. |
| `RAZORPAY_KEY_SECRET` | **Server Only** | Yes | Razorpay Key Secret for cryptographic payment capture verification. |
| `RAZORPAY_WEBHOOK_SECRET` | **Server Only** | Yes | Secret for validating `x-razorpay-signature` on `/api/payments/webhook`. |
| `SESSION_SECRET` | **Server Only** | Yes | Minimum 32-character encryption key for guest cart cookies (`openssl rand -base64 32`). |
| `RESEND_API_KEY` | **Server Only** | Optional | Resend API key for transactional emails. |
| `RESEND_FROM_EMAIL` | **Server Only** | Optional | Verified sender address (e.g. `Kartiva <orders@kartiva.com>`). |
| `MSG91_AUTH_KEY` | **Server Only** | Optional | MSG91 REST API Auth Key for SMS / OTP. |
| `MSG91_SENDER_ID` | **Server Only** | Optional | Approved 6-character sender ID (e.g. `KARTIV`). |
| `MSG91_TEMPLATE_ID` | **Server Only** | Optional | DLT-approved transactional SMS template ID. |
| `WHATSAPP_ACCESS_TOKEN` | **Server Only** | Optional | Meta Graph API access token for WhatsApp notifications. |
| `WHATSAPP_PHONE_NUMBER_ID` | **Server Only** | Optional | Meta WhatsApp Business Phone Number ID. |
| `INNGEST_EVENT_KEY` | **Server Only** | Optional | Inngest event emission key. |
| `INNGEST_SIGNING_KEY` | **Server Only** | Optional | Inngest webhook signature verification key for `/api/inngest`. |
| `SHIPROCKET_EMAIL` | **Server Only** | Optional | Shiprocket account email for logistics dispatch (falls back to stub). |
| `SHIPROCKET_PASSWORD` | **Server Only** | Optional | Shiprocket account password. |

---

## 3. Production Deployment Guide

### Option A: Deploying on Netlify (Recommended)

This repository includes a pre-configured `netlify.toml` file with security headers, build commands, and `@netlify/plugin-nextjs`.

1. **Push your code to GitHub / GitLab**.
2. **Log into Netlify** and click **"Add new site" > "Import an existing project"**.
3. **Select your repository**. Netlify will automatically detect:
   - **Build command**: `npm run build`
   - **Publish directory**: `.next`
   - **Plugin**: `@netlify/plugin-nextjs`
4. **Add Environment Variables**:
   - Go to **Site Configuration > Environment Variables**.
   - Copy all variables from `.env.example` with your production keys.
   - Set `NEXT_PUBLIC_APP_URL` to your production domain (e.g., `https://kartiva.com` or `https://<site-name>.netlify.app`).
5. **Deploy Site**:
   - Click **Deploy Site**. Netlify will run the build and publish your Next.js application.

### Option B: Deploying on Cloudflare Pages

For Cloudflare Pages, run the build using `@cloudflare/next-on-pages` or deploy as a Node server via Cloudflare Workers:
- **Build command**: `npm run build`
- **Output directory**: `.next`
- **Environment variables**: Add all production variables in Cloudflare Pages settings under **Settings > Environment variables**.

---

## 4. Webhook Configuration

### Razorpay Webhook Setup
1. Log in to the [Razorpay Dashboard](https://dashboard.razorpay.com).
2. Navigate to **Settings > Webhooks > Add New Webhook**.
3. Enter the Webhook URL: `https://your-domain.com/api/payments/webhook`.
4. Enter a strong secret and set it as `RAZORPAY_WEBHOOK_SECRET` in your host's environment variables.
5. Select active events:
   - `payment.captured`
   - `payment.failed`
   - `refund.processed`
6. Save the webhook. All incoming requests will be validated via constant-time HMAC-SHA256 signature checking.

### Inngest Setup
1. Create a workspace at [app.inngest.com](https://app.inngest.com).
2. Connect your production app:
   - **App URL**: `https://your-domain.com/api/inngest`
3. Copy your `INNGEST_EVENT_KEY` and `INNGEST_SIGNING_KEY` into your host's environment variables.

---

## 5. Security & Performance Features

- **Security Headers**: HSTS, X-Frame-Options (`SAMEORIGIN`), X-Content-Type-Options (`nosniff`), Referrer-Policy, and Content-Security-Policy (CSP) configured in both `next.config.ts` and `netlify.toml`.
- **Rate Limiting**: Built-in sliding-window IP rate limiter (`lib/rate-limit.ts`) protecting `/api/payments/create-order` and `/api/payments/verify`.
- **Zero Client Secret Leakage**: Strict separation ensures server keys (`SUPABASE_SERVICE_ROLE_KEY`, `RAZORPAY_KEY_SECRET`, `SESSION_SECRET`, etc.) are never bundled into client JavaScript.
- **Image Optimization**: Next.js Image component with AVIF and WebP support, responsive `sizes`, and Supabase/Cloudinary remote pattern whitelisting.
- **3D & Animation Fallbacks**: Three.js 3D intro canvas is code-split with `next/dynamic` (`ssr: false`) and automatically switches to `CSS3DFallback` when WebGL is unavailable or when `prefers-reduced-motion` is detected.
- **SEO Ready**: Full OpenGraph / Twitter metadata, dynamic `/sitemap.xml`, `/robots.txt`, and custom branded 404 page.

---

## 6. Pre-Launch Checklist

Before flipping your domain live to public traffic:

- [ ] **Database**: Run all migrations on production PostgreSQL (`npm run db:migrate` or `npm run db:push`).
- [ ] **Admin Profile**: Ensure your admin user in Supabase has `role = 'admin'` in the `profiles` table.
- [ ] **Storage Bucket**: Ensure the `product-images` bucket exists in Supabase Storage with public read access.
- [ ] **Razorpay Live Mode**: Replace `rzp_test_...` with your live Razorpay Key ID and Secret.
- [ ] **Webhook Active**: Verify that the Razorpay webhook is firing and returning HTTP 200 on test events.
- [ ] **Custom Domain & SSL**: Add your custom domain in Netlify / Cloudflare and verify HTTPS certificate provisioning.
- [ ] **Email DNS**: Verify SPF, DKIM, and DMARC records in Resend for your sending domain (`@kartiva.com`).
- [ ] **Smoke Test Checkout**: Perform a complete ₹1 test transaction end-to-end (Cart → Checkout → Razorpay → Order Confirmation → Invoice generation).
