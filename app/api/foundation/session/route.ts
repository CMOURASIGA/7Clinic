import { NextResponse } from "next/server";
import { getFoundationIdentity } from "../../../../lib/supabase/server";

export const dynamic = "force-dynamic";

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return NextResponse.json({ error: "Ambiente Supabase local indisponível" }, { status: 503 });
  }
  const identity = await getFoundationIdentity();
  if (!identity) return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  const { data, error } = await identity.client
    .from("access_grants")
    .select("organization_id,unit_id,role,valid_from,valid_until")
    .eq("user_id", identity.userId)
    .is("revoked_at", null);
  if (error) return NextResponse.json({ error: "Falha ao consultar acesso" }, { status: 500 });
  return NextResponse.json({ userId: identity.userId, grants: data }, { headers: { "Cache-Control": "no-store" } });
}
