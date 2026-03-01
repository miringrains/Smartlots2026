import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getAuthenticatedUser,
  getUserProfile,
  jsonResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const caller = await getUserProfile(supabase, user.id);
  if (!caller) return errorResponse("Profile not found", 404);

  if (caller.user_type !== "SUPER_ADMIN") {
    return errorResponse("Forbidden – SUPER_ADMIN required", 403);
  }

  const admin = createAdminClient();

  const { data: companies, error: qErr } = await admin
    .from("companies")
    .select("*")
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (qErr) return errorResponse(qErr.message);

  const enriched = await Promise.all(
    (companies || []).map(async (c: Record<string, unknown>) => {
      const { count: locationCount } = await admin
        .from("locations")
        .select("id", { count: "exact", head: true })
        .eq("company_id", c.id)
        .eq("is_deleted", false);

      const { count: userCount } = await admin
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("company_id", c.id)
        .eq("is_deleted", false);

      return {
        id: c.id,
        name: c.name,
        createdAt: c.created_at,
        locationCount: locationCount || 0,
        userCount: userCount || 0,
      };
    })
  );

  return jsonResponse(enriched);
}

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const caller = await getUserProfile(supabase, user.id);
  if (!caller) return errorResponse("Profile not found", 404);

  if (caller.user_type !== "SUPER_ADMIN") {
    return errorResponse("Forbidden – SUPER_ADMIN required", 403);
  }

  const body = await request.json();
  const { name, location, adminUser } = body;

  if (!name) return errorResponse("Company name is required");

  const admin = createAdminClient();

  const { data: company, error: companyErr } = await admin
    .from("companies")
    .insert({ name })
    .select("id")
    .single();

  if (companyErr || !company) {
    return errorResponse(companyErr?.message || "Failed to create company");
  }

  let firstLocationId: string | null = null;

  if (location?.name) {
    const { data: loc, error: locErr } = await admin
      .from("locations")
      .insert({
        company_id: company.id,
        name: location.name,
        address: location.address || "",
      })
      .select("id")
      .single();

    if (locErr) {
      return errorResponse(`Company created, but location failed: ${locErr.message}`);
    }
    firstLocationId = loc?.id || null;
  }

  if (adminUser?.email && adminUser?.password) {
    const { data: authUser, error: authErr } =
      await admin.auth.admin.createUser({
        email: adminUser.email,
        password: adminUser.password,
        email_confirm: true,
      });

    if (authErr || !authUser?.user) {
      return errorResponse(
        `Company created, but admin user failed: ${authErr?.message || "Unknown"}`
      );
    }

    const { error: profileErr } = await admin.from("users").insert({
      id: authUser.user.id,
      email: adminUser.email,
      user_type: "ADMIN",
      company_id: company.id,
      location_id: firstLocationId,
      requires_password_change: true,
    });

    if (profileErr) {
      await admin.auth.admin.deleteUser(authUser.user.id);
      return errorResponse(
        `Company created, but admin profile failed: ${profileErr.message}`
      );
    }

    const origin = request.headers.get("origin") || "https://admin.smartlotpro.com";
    const anonClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    await anonClient.auth.resetPasswordForEmail(adminUser.email, {
      redirectTo: `${origin}/reset-password`,
    });
  }

  return jsonResponse(
    {
      id: company.id,
      name,
      locationId: firstLocationId,
    },
    201
  );
}
