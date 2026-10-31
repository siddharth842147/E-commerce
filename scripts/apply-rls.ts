import { config } from "dotenv";
config({ path: ".env.local" });
import postgres from "postgres";
import fs from "fs";
import path from "path";

const sql = postgres(process.env.DATABASE_URL!, { prepare: false });

async function applyRLS() {
  console.log("Applying Row Level Security policies to Supabase database...");
  const sqlFilePath = path.join(process.cwd(), "db", "migrations", "0001_rls_policies.sql");
  const sqlContent = fs.readFileSync(sqlFilePath, "utf8");

  await sql.unsafe(sqlContent);
  console.log("✓ Successfully applied 0001_rls_policies.sql");

  const tables = await sql`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `;
  console.log("\nUpdated RLS Status in 'public':");
  console.table(tables);

  const policies = await sql`
    SELECT tablename, policyname, cmd
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `;
  console.log(`\nTotal Active Policies in 'public': ${policies.length}`);
  console.table(policies);

  await sql.end();
}

applyRLS().catch((err) => {
  console.error("Failed to apply RLS policies:", err);
  process.exit(1);
});
