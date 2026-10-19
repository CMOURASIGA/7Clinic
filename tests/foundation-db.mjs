import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { PGlite } from "@electric-sql/pglite";

const db = new PGlite();
const ids = {
  org: "00000000-0000-4000-8000-000000000001",
  otherOrg: "00000000-0000-4000-8000-000000000002",
  center: "00000000-0000-4000-8000-000000000011",
  north: "00000000-0000-4000-8000-000000000012",
  admin: "00000000-0000-4000-8000-000000000021",
  receptionCenter: "00000000-0000-4000-8000-000000000022",
  receptionNorth: "00000000-0000-4000-8000-000000000023",
  professional: "00000000-0000-4000-8000-000000000024",
  finance: "00000000-0000-4000-8000-000000000025",
  management: "00000000-0000-4000-8000-000000000026",
  outsider: "00000000-0000-4000-8000-000000000027",
  patient: "00000000-0000-4000-8000-000000000031",
  otherPatient: "00000000-0000-4000-8000-000000000032",
  prof: "00000000-0000-4000-8000-000000000041",
  appointment: "00000000-0000-4000-8000-000000000051",
};
const q = (value) => "'" + value.replaceAll("'", "''") + "'";
let passed = 0;
async function check(name, run) {
  await run();
  passed++;
  process.stdout.write("PASS " + name + "\n");
}
async function as(user, sql) {
  await db.exec("reset role; reset request.jwt.claim.sub;");
  await db.exec("set role authenticated;");
  if (user) await db.exec("set request.jwt.claim.sub = " + q(user));
  return db.query(sql);
}
async function denied(name, user, sql) {
  await check(name, async () => {
    await assert.rejects(() => as(user, sql), /permission denied|access denied|invalid grant|invalid scope|row-level security/);
  });
}
try {
  // PGlite is a real local Postgres engine. Supabase Auth itself is not present:
  // these definitions emulate only the database role/UID interface for RLS tests.
  await db.exec(`
    create role anon nologin;
    create role authenticated nologin;
    create role service_role nologin bypassrls;
    create schema auth;
    create table auth.users(id uuid primary key, email text unique);
    create function auth.uid() returns uuid language sql stable as
      $$ select nullif(current_setting('request.jwt.claim.sub', true),'')::uuid $$;
    grant usage on schema auth to authenticated;
    grant execute on function auth.uid() to authenticated;
  `);
  const migration = await readFile(new URL("../supabase/migrations/20261019121833_cp02_foundation.sql", import.meta.url), "utf8");
  await db.exec(migration);
  await db.exec(`
    insert into public.organizations(id,code,name) values
      ('${ids.org}','demo','7Clinic Demo'),('${ids.otherOrg}','other','Other Demo');
    insert into public.units(id,organization_id,code,name) values
      ('${ids.center}','${ids.org}','centro','Centro'),
      ('${ids.north}','${ids.org}','norte','Norte');
    insert into auth.users(id,email) values
      ('${ids.admin}','admin@example.test'),
      ('${ids.receptionCenter}','recepcao.centro@example.test'),
      ('${ids.receptionNorth}','recepcao.norte@example.test'),
      ('${ids.professional}','profissional@example.test'),
      ('${ids.finance}','financeiro@example.test'),
      ('${ids.management}','gestao@example.test'),
      ('${ids.outsider}','sem-grant@example.test');
    insert into public.user_profiles(user_id,organization_id,display_name) values
      ('${ids.admin}','${ids.org}','Admin'),
      ('${ids.receptionCenter}','${ids.org}','Recepção Centro'),
      ('${ids.receptionNorth}','${ids.org}','Recepção Norte'),
      ('${ids.professional}','${ids.org}','Profissional'),
      ('${ids.finance}','${ids.org}','Financeiro'),
      ('${ids.management}','${ids.org}','Gestão'),
      ('${ids.outsider}','${ids.otherOrg}','Sem grant');
    insert into public.access_grants(organization_id,user_id,unit_id,role,reason) values
      ('${ids.org}','${ids.admin}',null,'access_admin','bootstrap sintético'),
      ('${ids.org}','${ids.receptionCenter}','${ids.center}','reception','fixture'),
      ('${ids.org}','${ids.receptionNorth}','${ids.north}','reception','fixture'),
      ('${ids.org}','${ids.professional}','${ids.center}','professional','fixture'),
      ('${ids.org}','${ids.finance}','${ids.center}','finance','fixture'),
      ('${ids.org}','${ids.management}','${ids.center}','management','fixture');
    insert into public.professionals(id,organization_id,user_id,display_name)
      values('${ids.prof}','${ids.org}','${ids.professional}','Profissional Alfa');
    insert into public.professional_units(organization_id,professional_id,unit_id)
      values('${ids.org}','${ids.prof}','${ids.center}');
    insert into public.patients(id,organization_id,display_name) values
      ('${ids.patient}','${ids.org}','Paciente Alfa'),('${ids.otherPatient}','${ids.org}','Paciente Beta');
    insert into public.patient_units(organization_id,patient_id,unit_id) values
      ('${ids.org}','${ids.patient}','${ids.center}'),
      ('${ids.org}','${ids.otherPatient}','${ids.north}');
    insert into public.appointments(id,organization_id,unit_id,patient_id,professional_id,starts_at,status)
      values('${ids.appointment}','${ids.org}','${ids.center}','${ids.patient}','${ids.prof}',now(),'confirmed');
    insert into public.care_links(organization_id,appointment_id,professional_id)
      values('${ids.org}','${ids.appointment}','${ids.prof}');
  `);
  await check("S01 anonymous has no table privileges", async () => {
    await db.exec("set role anon");
    await assert.rejects(() => db.query("select * from public.patients"), /permission denied/);
  });
  await check("S02 unit isolation by patient UUID and appointment", async () => {
    const a = await as(ids.receptionNorth, "select id from public.patients where id = " + q(ids.patient));
    const b = await as(ids.receptionNorth, "select id from public.appointments where id = " + q(ids.appointment));
    assert.equal(a.rows.length, 0);
    assert.equal(b.rows.length, 0);
    assert.equal((await as(ids.receptionCenter, "select id from public.patients where id = " + q(ids.patient))).rows.length, 1);
  });
  await check("S03 professional linked only to own care", async () => {
    assert.equal((await as(ids.professional, "select appointment_id from public.care_links")).rows.length, 1);
    assert.equal((await as(ids.professional, "select id from public.patients where id = " + q(ids.otherPatient))).rows.length, 0);
  });
  await check("S04 finance and management cannot query care links", async () => {
    assert.equal((await as(ids.finance, "select * from public.care_links")).rows.length, 0);
    assert.equal((await as(ids.management, "select * from public.care_links")).rows.length, 0);
  });
  await check("S05 revocation effective under same UID", async () => {
    await db.exec("reset role");
    await db.exec("update public.access_grants set revoked_at=now(), revoked_by='" + ids.admin + "', revocation_reason='teste' where user_id='" + ids.receptionCenter + "'");
    assert.equal((await as(ids.receptionCenter, "select id from public.patients")).rows.length, 0);
  });
  await denied("S06 direct UPDATE of unit or tenant", ids.receptionNorth, "update public.appointments set unit_id = " + q(ids.center));
  await check("S07 forged metadata and tenant do not authorize", async () => {
    assert.equal((await as(ids.outsider, "select id from public.patients where organization_id = " + q(ids.org))).rows.length, 0);
    assert.equal((await as(ids.outsider, "select * from public.access_grants")).rows.length, 0);
  });
  await denied("S11 transfer reference without destination grant", ids.receptionNorth, "update public.appointments set unit_id = " + q(ids.north));
  await denied("non-admin cannot grant access", ids.management,
    "select api.grant_access(" + [ids.org,ids.outsider].map(q).join(",") + ",'access_admin',null,'forged')");
  await check("central grant and revoke audited, without duplicate revocation", async () => {
    // A user already in this organization can receive a new grant.
    const rows = await as(ids.admin, "select api.grant_access(" + q(ids.org) + "," + q(ids.management) + ",'reception'," + q(ids.north) + ",'teste') as id");
    const grant = rows.rows[0].id;
    assert.equal((await as(ids.management, "select id from public.patients where id = " + q(ids.otherPatient))).rows.length, 1);
    assert.equal((await as(ids.admin, "select api.revoke_access(" + q(grant) + ",'teste') as done")).rows[0].done, true);
    assert.equal((await as(ids.admin, "select api.revoke_access(" + q(grant) + ",'teste') as done")).rows[0].done, false);
    await db.exec("reset role");
    assert.equal((await db.query("select count(*)::int as n from public.access_events where grant_id=" + q(grant))).rows[0].n, 2);
  });
  await check("suspension disables grant despite same session", async () => {
    assert.equal((await as(ids.admin, "select api.set_user_suspension(" + q(ids.org) + "," + q(ids.finance) + ",true,'teste') as done")).rows[0].done, true);
    assert.equal((await as(ids.finance, "select * from public.units")).rows.length, 0);
  });
  await check("cross-organization FK and duplicate active grant rejected", async () => {
    await db.exec("reset role");
    await assert.rejects(
      () => db.exec("insert into public.patient_units(organization_id,patient_id,unit_id) values(" +
        q(ids.otherOrg) + "," + q(ids.patient) + "," + q(ids.center) + ")"),
      /foreign key constraint/,
    );
    await assert.rejects(
      () => db.exec("insert into public.access_grants(organization_id,user_id,unit_id,role,reason) values(" +
        q(ids.org) + "," + q(ids.receptionNorth) + "," + q(ids.north) + ",'reception','duplicado')"),
      /duplicate key/,
    );
  });
  await check("care link cannot attach a different professional to the appointment", async () => {
    await db.exec("reset role");
    const other = "00000000-0000-4000-8000-000000000043";
    await db.exec("insert into public.professionals(id,organization_id,display_name) values(" +
      q(other) + "," + q(ids.org) + ",'Profissional não vinculado')");
    await assert.rejects(
      () => db.exec("insert into public.care_links(organization_id,appointment_id,professional_id) values(" +
        q(ids.org) + "," + q(ids.appointment) + "," + q(other) + ")"),
      /foreign key constraint/,
    );
  });
  await denied("self-grant rejected", ids.admin,
    "select api.grant_access(" + q(ids.org) + "," + q(ids.admin) + ",'management',null,'forged')");
  await check("expired grant does not authorize", async () => {
    await db.exec("reset role");
    await db.exec("update public.access_grants set valid_from = now() - interval '2 days', valid_until = now() - interval '1 day' where user_id = " + q(ids.receptionNorth));
    assert.equal((await as(ids.receptionNorth, "select * from public.units")).rows.length, 0);
  });
  console.log("CP-02 local PostgreSQL RLS:", passed, "checks PASS. Supabase Auth service NOT TESTED.");
} finally {
  await db.close();
}
