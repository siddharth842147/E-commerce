import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

const PRODUCT_IMAGES: Record<string, string[]> = {
  // Electronics
  "wireless-nc-headphones": [
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&auto=format&fit=crop&q=80",
  ],
  "smart-led-desk-lamp": [
    "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1540932239986-30128078f3c5?w=800&auto=format&fit=crop&q=80",
  ],
  "mechanical-keyboard": [
    "https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1618384887929-16ec33fab9ef?w=800&auto=format&fit=crop&q=80",
  ],
  "usbc-fast-charger-65w": [
    "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=800&auto=format&fit=crop&q=80",
  ],

  // Clothing
  "classic-cotton-tshirt": [
    "https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&auto=format&fit=crop&q=80",
  ],
  "slim-fit-chinos": [
    "https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=800&auto=format&fit=crop&q=80",
  ],
  "hooded-sweatshirt": [
    "https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1509967419530-da38b4704bc6?w=800&auto=format&fit=crop&q=80",
  ],
  "running-shorts": [
    "https://images.unsplash.com/photo-1506629082955-511b1aa562c8?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=80",
  ],
  "formal-oxford-shirt": [
    "https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=800&auto=format&fit=crop&q=80",
  ],

  // Home & Kitchen
  "steel-water-bottle-1l": [
    "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80",
  ],
  "nonstick-cookware-5pc": [
    "https://images.unsplash.com/photo-1583778176476-4a8b02a64c01?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=800&auto=format&fit=crop&q=80",
  ],
  "bamboo-cutting-board": [
    "https://images.unsplash.com/photo-1594221708779-94832f4320d1?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop&q=80",
  ],
  "electric-kettle-1-5l": [
    "https://images.unsplash.com/photo-1594213114663-d94db9b17125?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=800&auto=format&fit=crop&q=80",
  ],

  // Sports
  "yoga-mat-6mm": [
    "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1592432678016-e910b452f9a2?w=800&auto=format&fit=crop&q=80",
  ],
  "adjustable-dumbbell-10kg": [
    "https://images.unsplash.com/photo-1586401100295-7a8096fd231a?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1638803040283-7a5ffd48dad5?w=800&auto=format&fit=crop&q=80",
  ],
  "resistance-bands-set": [
    "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?w=800&auto=format&fit=crop&q=80",
  ],
  "running-shoes": [
    "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=80",
  ],

  // Books
  "atomic-habits": [
    "https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800&auto=format&fit=crop&q=80",
  ],
  "deep-work": [
    "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=800&auto=format&fit=crop&q=80",
  ],
  "pragmatic-programmer": [
    "https://images.unsplash.com/photo-1516979187457-637abb4f9353?w=800&auto=format&fit=crop&q=80",
    "https://images.unsplash.com/photo-1555066931-4365d14bab8c?w=800&auto=format&fit=crop&q=80",
  ],
};

async function updateImages() {
  console.log("Updating product images in database...");
  let count = 0;

  for (const [slug, images] of Object.entries(PRODUCT_IMAGES)) {
    const res = await sql`
      UPDATE products 
      SET images = ${JSON.stringify(images)}::jsonb, updated_at = NOW() 
      WHERE slug = ${slug}
      RETURNING id, name, slug;
    `;
    if (res.length > 0) {
      console.log(`✓ Updated [${slug}] "${res[0].name}" with ${images.length} images`);
      count++;
    } else {
      console.warn(`! Product slug [${slug}] not found in database`);
    }
  }

  console.log(`\nSuccessfully updated ${count} products with high-resolution photography.`);
  await sql.end();
}

updateImages().catch((err) => {
  console.error("Failed to update product images:", err);
  process.exit(1);
});
