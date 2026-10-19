import { NextResponse } from "next/server";
import { getFoundationIdentity } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Ambiente Supabase local indisponível" }, { status: 503 });
  }
  const identity = await getFoundationIdentity();
  if (!identity) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  let input: Record<string, unknown>;
  try {
    input = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 });
  }
  const { action, organizationId, userId, unitId, role, grantId, suspended, reason } = input;
  if (typeof reason !== "string" || !reason.trim() || reason.length > 500) {
    return NextResponse.json({ error: "Motivo obrigatório" }, { status: 400 });
  }
  if (typeof organizationId !== "string" || !identity.organizationIds.includes(organizationId)) {
    return NextResponse.json({ error: "Organização inválida" }, { status: 403 });
  }
  // RPC functions validate the current grant again in the database. No service role.
  let result;
  if (action === "grant" && typeof userId === "string" && typeof role === "string"
    && (unitId === null || typeof unitId === "string")) {
    result = await identity.client.schema("api").rpc("grant_access", {
      p_org: organizationId, p_user: userId, p_role: role, p_unit: unitId, p_reason: reason,
    });
  } else if (action === "revoke" && typeof grantId === "string") {
    result = await identity.client.schema("api").rpc("revoke_access", { p_grant: grantId, p_reason: reason });
  } else if (action === "suspend" && typeof userId === "string" && typeof suspended === "boolean") {
    result = await identity.client.schema("api").rpc("set_user_suspension", {
      p_org: organizationId, p_user: userId, p_suspended: suspended, p_reason: reason,
    });
  } else {
    return NextResponse.json({ error: "Operação inválida" }, { status: 400 });
  }
  if (result.error) return NextResponse.json({ error: "Operação negada ou inválida" }, { status: 403 });
  return NextResponse.json({ result: result.data }, { headers: { "Cache-Control": "no-store" } });
}
