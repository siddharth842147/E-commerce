import { config } from "dotenv";
config({ path: ".env.local" });
import { createClient } from "@supabase/supabase-js";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "../db/schema";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

const client = postgres(process.env.DATABASE_URL!, { prepare: false });
const db = drizzle(client, { schema });

// ── Categories ────────────────────────────────────────────────────────────────
const CATEGORIES = [
  { name: "Electronics",    slug: "electronics",    description: "Gadgets and devices" },
  { name: "Clothing",       slug: "clothing",       description: "Apparel and accessories" },
  { name: "Home & Kitchen", slug: "home-kitchen",   description: "Household essentials" },
  { name: "Sports",         slug: "sports",         description: "Sports and fitness gear" },
  { name: "Books",          slug: "books",          description: "Books and stationery" },
] as const;

// ── Products ──────────────────────────────────────────────────────────────────
const PRODUCTS_DATA = [
  // Electronics (4)
  { name: "Wireless Noise-Cancelling Headphones", slug: "wireless-nc-headphones", category: "electronics", price: "4999.00", compareAt: "7999.00", featured: true,
    images: [
      "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "WNC-BLK", title: "Black", options: { color: "Black" }, price: "4999.00", stock: 50 }, { sku: "WNC-WHT", title: "White", options: { color: "White" }, price: "4999.00", stock: 30 }] },
  { name: "Smart LED Desk Lamp", slug: "smart-led-desk-lamp", category: "electronics", price: "1299.00", compareAt: "1999.00", featured: false,
    images: [
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "SLED-WHT", title: "White", options: { color: "White" }, price: "1299.00", stock: 80 }, { sku: "SLED-BLK", title: "Black", options: { color: "Black" }, price: "1299.00", stock: 60 }] },
  { name: "Mechanical Keyboard", slug: "mechanical-keyboard", category: "electronics", price: "3499.00", compareAt: "4999.00", featured: false,
    images: [
      "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "MKEY-TKL-BLU", title: "TKL / Blue Switch", options: { size: "TKL", switch: "Blue" }, price: "3499.00", stock: 40 }, { sku: "MKEY-FULL-RED", title: "Full / Red Switch", options: { size: "Full", switch: "Red" }, price: "3799.00", stock: 25 }] },
  { name: "USB-C Fast Charger 65W", slug: "usbc-fast-charger-65w", category: "electronics", price: "899.00", compareAt: "1499.00", featured: false,
    images: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "USBC-65W", title: "65W", options: { wattage: "65W" }, price: "899.00", stock: 150 }, { sku: "USBC-100W", title: "100W", options: { wattage: "100W" }, price: "1299.00", stock: 80 }] },

  // Clothing (5)
  { name: "Classic Cotton T-Shirt", slug: "classic-cotton-tshirt", category: "clothing", price: "499.00", compareAt: "799.00", featured: true,
    images: [
      "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "CT-S-BLK", title: "S / Black", options: { size: "S", color: "Black" }, price: "499.00", stock: 100 }, { sku: "CT-M-BLK", title: "M / Black", options: { size: "M", color: "Black" }, price: "499.00", stock: 120 }, { sku: "CT-L-WHT", title: "L / White", options: { size: "L", color: "White" }, price: "499.00", stock: 90 }] },
  { name: "Slim Fit Chinos", slug: "slim-fit-chinos", category: "clothing", price: "1299.00", compareAt: "1999.00", featured: false,
    images: [
      "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "CHN-30-KHK", title: "30 / Khaki", options: { waist: "30", color: "Khaki" }, price: "1299.00", stock: 45 }, { sku: "CHN-32-NVY", title: "32 / Navy", options: { waist: "32", color: "Navy" }, price: "1299.00", stock: 55 }] },
  { name: "Hooded Sweatshirt", slug: "hooded-sweatshirt", category: "clothing", price: "999.00", compareAt: "1499.00", featured: false,
    images: [
      "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "HOD-M-GRY", title: "M / Grey", options: { size: "M", color: "Grey" }, price: "999.00", stock: 70 }, { sku: "HOD-L-NVY", title: "L / Navy", options: { size: "L", color: "Navy" }, price: "999.00", stock: 60 }] },
  { name: "Running Shorts", slug: "running-shorts", category: "clothing", price: "699.00", compareAt: "999.00", featured: false,
    images: [
      "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "RS-S-BLK", title: "S / Black", options: { size: "S", color: "Black" }, price: "699.00", stock: 80 }, { sku: "RS-M-RED", title: "M / Red", options: { size: "M", color: "Red" }, price: "699.00", stock: 65 }] },
  { name: "Formal Oxford Shirt", slug: "formal-oxford-shirt", category: "clothing", price: "1499.00", compareAt: "2199.00", featured: true,
    images: [
      "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "OXF-M-BLU", title: "M / Blue", options: { size: "M", color: "Blue" }, price: "1499.00", stock: 40 }, { sku: "OXF-L-WHT", title: "L / White", options: { size: "L", color: "White" }, price: "1499.00", stock: 35 }] },

  // Home & Kitchen (4)
  { name: "Stainless Steel Water Bottle 1L", slug: "steel-water-bottle-1l", category: "home-kitchen", price: "599.00", compareAt: "999.00", featured: false,
    images: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "SWB-SLV", title: "Silver", options: { color: "Silver" }, price: "599.00", stock: 200 }, { sku: "SWB-BLK", title: "Black", options: { color: "Black" }, price: "599.00", stock: 150 }] },
  { name: "Non-Stick Cookware Set 5pc", slug: "nonstick-cookware-5pc", category: "home-kitchen", price: "2499.00", compareAt: "3999.00", featured: true,
    images: [
      "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "CKW-5PC-BLK", title: "5 Piece Set", options: { pieces: "5" }, price: "2499.00", stock: 30 }] },
  { name: "Bamboo Cutting Board", slug: "bamboo-cutting-board", category: "home-kitchen", price: "349.00", compareAt: "599.00", featured: false,
    images: [
      "https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "BCB-SM", title: "Small", options: { size: "Small" }, price: "349.00", stock: 100 }, { sku: "BCB-LG", title: "Large", options: { size: "Large" }, price: "499.00", stock: 80 }] },
  { name: "Electric Kettle 1.5L", slug: "electric-kettle-1-5l", category: "home-kitchen", price: "1199.00", compareAt: "1799.00", featured: false,
    images: [
      "https://images.unsplash.com/photo-1594213114663-d94db9b17125?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "EK-WHT", title: "White", options: { color: "White" }, price: "1199.00", stock: 60 }, { sku: "EK-BLK", title: "Black", options: { color: "Black" }, price: "1199.00", stock: 55 }] },

  // Sports (4)
  { name: "Yoga Mat 6mm", slug: "yoga-mat-6mm", category: "sports", price: "799.00", compareAt: "1299.00", featured: false,
    images: [
      "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "YM-PPL", title: "Purple", options: { color: "Purple" }, price: "799.00", stock: 90 }, { sku: "YM-BLU", title: "Blue", options: { color: "Blue" }, price: "799.00", stock: 85 }] },
  { name: "Adjustable Dumbbell Set 10kg", slug: "adjustable-dumbbell-10kg", category: "sports", price: "3499.00", compareAt: "4999.00", featured: true,
    images: [
      "https://images.unsplash.com/photo-1586401100295-7a8096fd231a?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1638803040283-7a5ffd48dad5?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "DB-10KG", title: "10 kg pair", options: { weight: "10kg" }, price: "3499.00", stock: 20 }, { sku: "DB-20KG", title: "20 kg pair", options: { weight: "20kg" }, price: "5999.00", stock: 15 }] },
  { name: "Resistance Bands Set", slug: "resistance-bands-set", category: "sports", price: "499.00", compareAt: "799.00", featured: false,
    images: [
      "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "RBS-5PC", title: "5 Band Set", options: { pieces: "5" }, price: "499.00", stock: 120 }] },
  { name: "Running Shoes", slug: "running-shoes", category: "sports", price: "2999.00", compareAt: "4499.00", featured: true,
    images: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "RS-UK8-BLK", title: "UK 8 / Black", options: { size: "UK 8", color: "Black" }, price: "2999.00", stock: 30 }, { sku: "RS-UK9-WHT", title: "UK 9 / White", options: { size: "UK 9", color: "White" }, price: "2999.00", stock: 25 }] },

  // Books (3)
  { name: "Atomic Habits – James Clear", slug: "atomic-habits", category: "books", price: "399.00", compareAt: "599.00", featured: true,
    images: [
      "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "BK-AH-PB", title: "Paperback", options: { format: "Paperback" }, price: "399.00", stock: 200 }, { sku: "BK-AH-HB", title: "Hardback", options: { format: "Hardback" }, price: "699.00", stock: 50 }] },
  { name: "Deep Work – Cal Newport", slug: "deep-work", category: "books", price: "349.00", compareAt: "499.00", featured: false,
    images: [
      "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "BK-DW-PB", title: "Paperback", options: { format: "Paperback" }, price: "349.00", stock: 180 }] },
  { name: "The Pragmatic Programmer", slug: "pragmatic-programmer", category: "books", price: "799.00", compareAt: "1199.00", featured: false,
    images: [
      "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&auto=format&fit=crop&q=80",
      "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
    ],
    variants: [{ sku: "BK-PP-PB", title: "Paperback", options: { format: "Paperback" }, price: "799.00", stock: 75 }, { sku: "BK-PP-HB", title: "Hardback", options: { format: "Hardback" }, price: "1199.00", stock: 30 }] },
] as const;

async function seed() {
  console.log("🌱 Seeding Kartiva database...\n");

  // 1. Admin user
  console.log("👤 Creating admin user...");
  const { data: adminAuthData, error: adminAuthError } = await supabaseAdmin.auth.admin.createUser({
    email: "admin@kartiva.dev",
    password: "Admin@kartiva123",
    email_confirm: true,
    user_metadata: { full_name: "Kartiva Admin", role: "admin" },
  });

  if (adminAuthError && !adminAuthError.message.includes("already")) {
    console.error("  ✗ Admin auth error:", adminAuthError.message);
  } else {
    console.log("  ✓ Admin user created: admin@kartiva.dev / Admin@kartiva123");
  }

  // Upsert admin profile with role=admin
  if (adminAuthData?.user) {
    await db.insert(schema.profiles).values({
      id: adminAuthData.user.id,
      email: "admin@kartiva.dev",
      fullName: "Kartiva Admin",
      role: "admin",
    }).onConflictDoUpdate({
      target: schema.profiles.id,
      set: { role: "admin", fullName: "Kartiva Admin" },
    });
    console.log("  ✓ Admin profile upserted with role=admin\n");
  }

  // 2. Categories
  console.log("📁 Inserting categories...");
  const insertedCategories = await db.insert(schema.categories)
    .values(CATEGORIES.map(c => ({ ...c })))
    .onConflictDoUpdate({ target: schema.categories.slug, set: { name: schema.categories.name } })
    .returning();

  const categoryMap = Object.fromEntries(insertedCategories.map(c => [c.slug, c.id]));
  console.log(`  ✓ ${insertedCategories.length} categories inserted\n`);

  // 3. Products + variants
  console.log("📦 Inserting products and variants...");
  let productCount = 0;
  let variantCount = 0;

  for (const p of PRODUCTS_DATA) {
    const categoryId = categoryMap[p.category as string];
    const [product] = await db.insert(schema.products).values({
      categoryId,
      name: p.name,
      slug: p.slug,
      price: p.price,
      compareAtPrice: p.compareAt,
      isFeatured: p.featured,
      images: [...p.images],
      tags: [],
    }).onConflictDoUpdate({
      target: schema.products.slug,
      set: { name: p.name, price: p.price, images: [...p.images] },
    }).returning();

    productCount++;

    for (const v of p.variants) {
      await db.insert(schema.productVariants).values({
        productId: product.id,
        sku: v.sku,
        title: v.title,
        options: v.options as Record<string, string>,
        price: v.price,
        stock: v.stock,
      }).onConflictDoUpdate({
        target: schema.productVariants.sku,
        set: { stock: v.stock, price: v.price },
      });
      variantCount++;
    }
  }

  console.log(`  ✓ ${productCount} products inserted`);
  console.log(`  ✓ ${variantCount} variants inserted\n`);

  console.log("✅ Seed complete!");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("  Admin:    admin@kartiva.dev");
  console.log("  Password: Admin@kartiva123");
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  await client.end();
}

seed().catch(err => {
  console.error("Seed failed:", err);
  process.exit(1);
});
