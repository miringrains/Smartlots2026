import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export function jsonResponse(data: unknown, status = 200) {
  return NextResponse.json({ data }, { status });
}

export function messageResponse(message: string, status = 200) {
  return NextResponse.json({ message }, { status });
}

export function errorResponse(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

export async function getAuthenticatedUser(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return { user: null, supabase: null, error: "Missing or invalid authorization header" };
  }

  const token = authHeader.replace("Bearer ", "");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false },
    }
  );

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { user: null, supabase, error: "Invalid or expired token" };
  }

  return { user, supabase, error: null };
}

/* eslint-disable @typescript-eslint/no-explicit-any */

export async function getUserProfile(
  supabase: any,
  userId: string
) {
  const { data, error } = await supabase
    .from("users")
    .select("*, locations(*)")
    .eq("id", userId)
    .eq("is_deleted", false)
    .single();

  if (error) return null;
  return data;
}

export function resolveCompanyId(request: Request, profile: any): string {
  if (profile.user_type === "SUPER_ADMIN") {
    const url = new URL(request.url);
    const override = url.searchParams.get("companyId");
    if (override) return override;
  }
  return profile.company_id;
}

export async function getLocationScope(
  supabase: any,
  profile: any,
  overrideCompanyId?: string
): Promise<string[]> {
  const companyId = overrideCompanyId || profile.company_id;

  if (profile.user_type === "ADMIN" || profile.user_type === "SUPER_ADMIN") {
    const { data } = await supabase
      .from("locations")
      .select("id")
      .eq("company_id", companyId)
      .eq("is_deleted", false);
    return (data || []).map((l: any) => l.id);
  }
  return [profile.location_id];
}
