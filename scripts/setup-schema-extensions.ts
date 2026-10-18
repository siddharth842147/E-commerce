import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

async function run() {
  console.log("Adding schema extensions if not already present...");

  // 1. Add tracking_id and carrier to orders
  await sql.unsafe(`
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "tracking_id" text;
    ALTER TABLE "orders" ADD COLUMN IF NOT EXISTS "carrier" text;
  `);
  console.log("✓ Added tracking_id and carrier to orders");

  // 2. Create review_status enum & reviews table
  await sql.unsafe(`
    DO $$ BEGIN
      CREATE TYPE "public"."review_status" AS ENUM('pending', 'approved', 'rejected');
    EXCEPTION
      WHEN duplicate_object THEN null;
    END $$;

    CREATE TABLE IF NOT EXISTS "reviews" (
      "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
      "product_id" uuid NOT NULL REFERENCES "products"("id") ON DELETE cascade,
      "user_id" uuid REFERENCES "profiles"("id") ON DELETE set null,
      "author_name" text NOT NULL,
      "author_email" text,
      "rating" integer NOT NULL DEFAULT 5,
      "title" text,
      "comment" text NOT NULL,
      "status" "review_status" DEFAULT 'pending' NOT NULL,
      "created_at" timestamp DEFAULT now() NOT NULL,
      "updated_at" timestamp DEFAULT now() NOT NULL
    );
  `);
  console.log("✓ Created reviews table");

  // 3. Seed some coupons if empty
  const [couponCount] = await sql`SELECT count(*) FROM coupons`;
  if (parseInt(couponCount.count) === 0) {
    console.log("Seeding sample coupons...");
    await sql`
      INSERT INTO coupons (code, discount_type, discount_value, min_order_amount, max_uses, used_count, is_active, expires_at)
      VALUES
        ('WELCOME10', 'percentage', 10.00, 500.00, 100, 14, true, NOW() + INTERVAL '30 days'),
        ('FLAT200', 'fixed', 200.00, 1499.00, 50, 8, true, NOW() + INTERVAL '15 days'),
        ('FESTIVE25', 'percentage', 25.00, 2000.00, 200, 31, true, NOW() + INTERVAL '45 days'),
        ('SUMMER50', 'fixed', 50.00, 299.00, 500, 120, false, NOW() - INTERVAL '5 days');
    `;
    console.log("✓ Sample coupons seeded");
  }

  // 4. Seed reviews if empty
  const [reviewCount] = await sql`SELECT count(*) FROM reviews`;
  const products = await sql`SELECT id, name FROM products LIMIT 5`;

  if (parseInt(reviewCount.count) === 0 && products.length > 0) {
    console.log("Seeding sample reviews...");
    await sql`
      INSERT INTO reviews (product_id, author_name, author_email, rating, title, comment, status, created_at)
      VALUES
        (${products[0].id}, 'Aarav Sharma', 'aarav.sharma@gmail.com', 5, 'Exceptional quality!', 'Build quality exceeded my expectations. Sound is punchy and crisp.', 'approved', NOW() - INTERVAL '3 days'),
        (${products[0].id}, 'Priya Patel', 'priya.patel@outlook.com', 4, 'Very comfortable', 'Battery life lasts throughout my work week. Active noise cancellation is solid.', 'pending', NOW() - INTERVAL '1 days'),
        (${products[1]?.id ?? products[0].id}, 'Rohan Mehta', 'rohan.mehta@yahoo.com', 1, 'Delivery was late', 'Package arrived slightly damaged outside, but product works.', 'rejected', NOW() - INTERVAL '5 days'),
        (${products[2]?.id ?? products[0].id}, 'Sneha Iyer', 'sneha.iyer@gmail.com', 5, 'Best purchase this month', 'Super tactile keystrokes, lighting looks sleek on my desk setup.', 'approved', NOW() - INTERVAL '2 days'),
        (${products[3]?.id ?? products[0].id}, 'Karan Verma', 'karan.v@gmail.com', 4, 'Solid build', 'Charges my phone and laptop rapidly without heating up.', 'pending', NOW() - INTERVAL '6 hours');
    `;
    console.log("✓ Sample reviews seeded");
  }

  // 5. Seed sample customers & orders if orders empty
  const [orderCount] = await sql`SELECT count(*) FROM orders`;
  if (parseInt(orderCount.count) === 0) {
    console.log("Seeding sample customers & orders for dashboard...");
    const [adminUser] = await sql`SELECT id FROM profiles WHERE role = 'admin' LIMIT 1`;
    const variants = await sql`SELECT id, product_id, title, price, sku FROM product_variants LIMIT 6`;

    if (adminUser && variants.length > 0) {
      // Create a few sample customer profiles
      const cust1 = 'c0000000-0000-0000-0000-000000000001';
      const cust2 = 'c0000000-0000-0000-0000-000000000002';
      const cust3 = 'c0000000-0000-0000-0000-000000000003';

      await sql`
        INSERT INTO profiles (id, email, full_name, phone, role)
        VALUES
          (${cust1}, 'vikram.singh@example.com', 'Vikram Singh', '+919876543210', 'customer'),
          (${cust2}, 'ananya.deshmukh@example.com', 'Ananya Deshmukh', '+919812345678', 'customer'),
          (${cust3}, 'rahul.kapoor@example.com', 'Rahul Kapoor', '+919898989898', 'customer')
        ON CONFLICT (id) DO NOTHING;
      `;

      // Insert orders
      const orderData = [
        {
          userId: cust1,
          status: 'delivered',
          subtotal: '4999.00',
          discount: '0.00',
          shipping: '0.00',
          tax: '899.82',
          total: '5898.82',
          trackingId: 'BLUEDART-89234190',
          carrier: 'BlueDart',
          daysAgo: 14,
          name: 'Vikram Singh',
          city: 'Mumbai',
          variant: variants[0],
          paymentStatus: 'captured',
          method: 'upi'
        },
        {
          userId: cust2,
          status: 'shipped',
          subtotal: '3499.00',
          discount: '200.00',
          shipping: '99.00',
          tax: '593.82',
          total: '3991.82',
          trackingId: 'DELHIVERY-7782190',
          carrier: 'Delhivery',
          daysAgo: 3,
          name: 'Ananya Deshmukh',
          city: 'Bengaluru',
          variant: variants[1] ?? variants[0],
          paymentStatus: 'captured',
          method: 'card'
        },
        {
          userId: cust3,
          status: 'processing',
          subtotal: '2499.00',
          discount: '0.00',
          shipping: '0.00',
          tax: '449.82',
          total: '2948.82',
          trackingId: null,
          carrier: null,
          daysAgo: 1,
          name: 'Rahul Kapoor',
          city: 'Delhi',
          variant: variants[2] ?? variants[0],
          paymentStatus: 'captured',
          method: 'netbanking'
        },
        {
          userId: cust1,
          status: 'confirmed',
          subtotal: '1299.00',
          discount: '129.90',
          shipping: '99.00',
          tax: '228.42',
          total: '1496.52',
          trackingId: null,
          carrier: null,
          daysAgo: 0,
          name: 'Vikram Singh',
          city: 'Mumbai',
          variant: variants[3] ?? variants[0],
          paymentStatus: 'captured',
          method: 'upi'
        },
        {
          userId: cust2,
          status: 'pending',
          subtotal: '899.00',
          discount: '0.00',
          shipping: '99.00',
          tax: '161.82',
          total: '1159.82',
          trackingId: null,
          carrier: null,
          daysAgo: 0,
          name: 'Ananya Deshmukh',
          city: 'Bengaluru',
          variant: variants[4] ?? variants[0],
          paymentStatus: 'pending',
          method: 'cod'
        },
      ];

      for (const ord of orderData) {
        const [insertedOrder] = await sql`
          INSERT INTO orders (
            user_id, status, subtotal, discount_amount, shipping_amount, tax_amount, total,
            shipping_address, notes, tracking_id, carrier, created_at, updated_at
          ) VALUES (
            ${ord.userId}, ${ord.status}, ${ord.subtotal}, ${ord.discount}, ${ord.shipping}, ${ord.tax}, ${ord.total},
            ${JSON.stringify({
              fullName: ord.name,
              phone: '+919876543210',
              addressLine1: '42 Marine Drive, Apt 3B',
              city: ord.city,
              state: 'Maharashtra',
              postalCode: '400020',
              country: 'IN'
            })},
            ${'Standard priority shipping'},
            ${ord.trackingId},
            ${ord.carrier},
            NOW() - (${ord.daysAgo} || ' days')::INTERVAL,
            NOW() - (${ord.daysAgo} || ' days')::INTERVAL
          ) RETURNING id;
        `;

        await sql`
          INSERT INTO order_items (
            order_id, variant_id, product_name, variant_title, sku, unit_price, quantity, total
          ) VALUES (
            ${insertedOrder.id}, ${ord.variant.id}, ${'Kartiva Product'}, ${ord.variant.title}, ${ord.variant.sku}, ${ord.variant.price}, 1, ${ord.variant.price}
          );
        `;

        await sql`
          INSERT INTO payments (
            order_id, razorpay_order_id, razorpay_payment_id, amount, currency, status, method, created_at
          ) VALUES (
            ${insertedOrder.id}, ${'order_' + insertedOrder.id.slice(0, 12)}, ${'pay_' + insertedOrder.id.slice(0, 12)}, ${ord.total}, 'INR', ${ord.paymentStatus}, ${ord.method}, NOW() - (${ord.daysAgo} || ' days')::INTERVAL
          );
        `;
      }
      console.log("✓ Sample orders, order items & payments seeded");
    }
  }

  await sql.end();
  console.log("All extensions and seed data verified successfully!");
}

run().catch((e) => {
  console.error("Execution failed:", e);
  process.exit(1);
});
