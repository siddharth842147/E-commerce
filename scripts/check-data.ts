import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

async function check() {
  const orderId = "cfa1343d-30d2-44d7-9a84-75ca02e9b730";
  const ord = await sql`SELECT id, user_id, status, total, subtotal, discount_amount, coupon_id, shipping_address FROM orders WHERE id = ${orderId}`;
  console.log("Order:", ord);

  const pay = await sql`SELECT id, order_id, status, method, amount, razorpay_order_id, razorpay_payment_id FROM payments WHERE order_id = ${orderId}`;
  console.log("Payment:", pay);

  const notifs = await sql`SELECT id, channel, recipient, status, subject, template_id, sent_at FROM notifications_log ORDER BY created_at DESC LIMIT 5`;
  console.log("Latest Notification Logs:", notifs);
  await sql.end();
}

check().catch((e) => {
  console.error(e);
  process.exit(1);
});
