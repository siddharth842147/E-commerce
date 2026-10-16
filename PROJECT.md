# Kartiva

Modern e-commerce platform built with Next.js 14 (App Router), TypeScript, Tailwind CSS, and a fully-typed stack.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v3 + shadcn/ui (New York / Zinc) |
| Auth & Database | Supabase (Auth + Postgres) |
| ORM | Drizzle ORM + drizzle-kit |
| Validation | Zod |
| Payments | Razorpay |
| Email | Resend + React Email |
| SMS / OTP | MSG91 |
| WhatsApp | Meta Cloud API |
| Media | Cloudinary |
| Background Jobs | Inngest |

## Folder Structure

```
c:\E-Commerce/
├── app/                    # Next.js App Router pages & layouts
│   ├── (auth)/             # Auth route group
│   ├── (dashboard)/        # Dashboard route group
│   └── api/                # API route handlers
├── components/
│   ├── ui/                 # shadcn/ui primitives
│   ├── shared/             # Shared layout components (Navbar, Footer, etc.)
│   ├── forms/              # Form components
│   └── emails/             # Email template components
├── lib/
│   ├── supabase/           # Supabase client (browser, server, middleware)
│   ├── utils.ts            # cn() and other utilities
│   └── validations.ts      # Shared Zod schemas
├── db/
│   ├── index.ts            # Drizzle client
│   ├── schema/             # Drizzle table definitions
│   └── migrations/         # Generated SQL migrations
├── services/               # External API integrations (Razorpay, MSG91, etc.)
├── actions/                # Next.js Server Actions
├── hooks/                  # Custom React hooks
├── types/                  # Shared TypeScript types
├── config/                 # App-wide config (site, navigation, etc.)
└── emails/                 # React Email templates
```

## Environment Setup

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase project URL, anon key, and service role key
3. Set `DATABASE_URL` to your Supabase Postgres connection string
4. Add API keys for Razorpay, Resend, MSG91, WhatsApp, Cloudinary, and Inngest

## Development

```bash
npm run dev        # Start dev server (http://localhost:3000)
npm run build      # Production build
npm run lint       # ESLint
npx drizzle-kit generate   # Generate migrations from schema
npx drizzle-kit migrate    # Run migrations
npx drizzle-kit studio     # Open Drizzle Studio
```

## Status

🚧 Project scaffolded — no features implemented yet.
