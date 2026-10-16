export const siteConfig = {
  name: "Kartiva",
  description: "Modern e-commerce platform",
  url: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
  ogImage: "/og.png",
} as const;
