import "server-only";

import { cookies } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { supabasePublicConfig } from "./config";

export async function createFoundationServerClient() {
  const { url, key } = supabasePublicConfig();
  const cookieStore = await cookies();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(values: { name: string; value: string; options: CookieOptions }[]) {
        try {
          values.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot set cookies. The proxy refreshes their session.
        }
      },
    },
  });
}

export async function getFoundationIdentity() {
  const client = await createFoundationServerClient();
  const { data, error } = await client.auth.getClaims();
  if (error || !data?.claims?.sub) return null;
  const userId = data.claims.sub;
  // The database checks current profile/grants; claims supply identity only.
  const { data: profiles, error: profileError } = await client
    .from("user_profiles")
    .select("organization_id,active,suspended_at")
    .eq("user_id", userId)
    .eq("active", true)
    .is("suspended_at", null);
  if (profileError || !profiles?.length) return null;
  return { client, userId, organizationIds: profiles.map((profile) => profile.organization_id as string) };
}
