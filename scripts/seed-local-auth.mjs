import { createClient } from "@supabase/supabase-js";

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const password = process.env.CP02_FIXTURE_PASSWORD;
if (!url || !key || !password || password.length < 12) {
  throw new Error("SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY e CP02_FIXTURE_PASSWORD (12+ caracteres) obrigatórios");
}
const endpoint = new URL(url);
if (!["127.0.0.1", "localhost", "::1"].includes(endpoint.hostname)) {
  throw new Error("Seed bloqueado: somente Supabase Auth local");
}
const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
const org = "00000000-0000-4000-8000-000000000001";
const otherOrg = "00000000-0000-4000-8000-000000000002";
const center = "00000000-0000-4000-8000-000000000011";
const north = "00000000-0000-4000-8000-000000000012";
const users = [
  ["admin@example.test", "Admin central", org, "access_admin", null],
  ["recepcao.centro@example.test", "Recepção Centro", org, "reception", center],
  ["recepcao.norte@example.test", "Recepção Norte", org, "reception", north],
  ["profissional.alfa@example.test", "Profissional Alfa", org, "professional", center],
  ["profissional.beta@example.test", "Profissional Beta", org, "professional", north],
  ["financeiro@example.test", "Financeiro", org, "finance", center],
  ["gestao@example.test", "Gestão", org, "management", center],
  ["sem.grant@example.test", "Sem acesso", org, null, null],
  ["revogado@example.test", "Revogado", org, "reception", north],
  ["outra.org@example.test", "Outra organização", otherOrg, null, null],
];

function ensure(result, context) {
  if (result.error) throw new Error(context + ": " + result.error.message);
  return result.data;
}
const listed = ensure(await db.auth.admin.listUsers({ page: 1, perPage: 100 }), "listar usuários").users;
for (const [email, name, organizationId, role, unitId] of users) {
  let user = listed.find((entry) => entry.email === email);
  if (!user) user = ensure(await db.auth.admin.createUser({ email, password, email_confirm: true }), "criar " + email).user;
  if (!user) throw new Error("Identidade não criada: " + email);
  ensure(await db.from("user_profiles").upsert({
    user_id: user.id, organization_id: organizationId, display_name: name, active: true, suspended_at: null,
  }, { onConflict: "organization_id,user_id" }), "perfil " + email);
  if (role) {
    const existing = ensure(await db.from("access_grants").select("id").eq("organization_id", organizationId)
      .eq("user_id", user.id).eq("role", role).is("revoked_at", null), "grant " + email);
    if (existing.length === 0) {
      const grant = ensure(await db.from("access_grants").insert({
        organization_id: organizationId, user_id: user.id, unit_id: unitId,
        role, reason: "bootstrap local sintético",
      }).select("id").single(), "conceder " + email);
      ensure(await db.from("access_events").insert({
        organization_id: organizationId, subject_id: user.id, grant_id: grant.id,
        action: "grant", reason: "bootstrap local sintético",
      }), "auditar " + email);
    }
  }
  if (email === "profissional.alfa@example.test" || email === "profissional.beta@example.test") {
    const professionalId = email.includes("alfa")
      ? "00000000-0000-4000-8000-000000000041"
      : "00000000-0000-4000-8000-000000000042";
    ensure(await db.from("professionals").update({ user_id: user.id }).eq("id", professionalId), "vincular " + email);
  }
  if (email === "revogado@example.test") {
    const grants = ensure(await db.from("access_grants").select("id").eq("user_id", user.id)
      .eq("organization_id", org).is("revoked_at", null), "revogação fixture");
    for (const grant of grants) {
      ensure(await db.from("access_grants").update({
        revoked_at: new Date().toISOString(), revoked_by: user.id,
        revocation_reason: "fixture de revogação",
      }).eq("id", grant.id), "revogar fixture");
      ensure(await db.from("access_events").insert({
        organization_id: org, actor_id: user.id, subject_id: user.id, grant_id: grant.id,
        action: "revoke", reason: "fixture de revogação",
      }), "auditar revogação fixture");
    }
  }
}
console.log("Fixtures Auth locais criadas: 10 identidades sintéticas, 2 unidades e 2 organizações.");
