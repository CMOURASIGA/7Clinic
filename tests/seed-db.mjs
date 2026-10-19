import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

for (let attempt = 1; attempt <= 2; attempt++) {
  const db = new PGlite();
  try {
    await db.exec(`
      create role anon nologin;
      create role authenticated nologin;
      create role service_role nologin bypassrls;
      create schema auth;
      create table auth.users(id uuid primary key);
      create function auth.uid() returns uuid language sql stable as
        $$ select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid $$;
      grant usage on schema auth to authenticated;
      grant execute on function auth.uid() to authenticated;
    `);
    const migration = await readFile(new URL("../supabase/migrations/20261019121833_cp02_foundation.sql", import.meta.url), "utf8");
    const seed = await readFile(new URL("../supabase/seed.sql", import.meta.url), "utf8");
    await db.exec(migration);
    await db.exec(seed);
    for (const [table, expected] of [["organizations",2],["units",2],["professionals",2],
      ["patients",2],["patient_units",2],["appointments",1],["care_links",1]]) {
      const result = await db.query("select count(*)::int as n from public." + table);
      assert.equal(result.rows[0].n, expected, table + " no reset " + attempt);
    }
    console.log("PASS recriação limpa", attempt, "migração e seed sintética");
  } finally {
    await db.close();
  }
}
