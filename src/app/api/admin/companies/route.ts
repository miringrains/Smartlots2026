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
        address: c.address || "",
        city: c.city || "",
        state: c.state || "",
        zip: c.zip || "",
        lat: c.lat ?? null,
        lng: c.lng ?? null,
        phone: c.phone || "",
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
  const { name, address, city, state, zip, lat, lng, phone, location, adminUser } = body;

  if (!name) return errorResponse("Company name is required");

  const admin = createAdminClient();

  const { data: company, error: companyErr } = await admin
    .from("companies")
    .insert({
      name,
      address: address || "",
      city: city || "",
      state: state || "",
      zip: zip || "",
      lat: lat ?? null,
      lng: lng ?? null,
      phone: phone || "",
    })
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
        lat: location.lat ?? null,
        lng: location.lng ?? null,
      })
      .select("id")
      .single();

    if (locErr) {
      return errorResponse(
        `Company created, but location failed: ${locErr.message}`
      );
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

    const origin =
      request.headers.get("origin") || "https://admin.smartlotpro.com";
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

export async function PATCH(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const caller = await getUserProfile(supabase, user.id);
  if (!caller) return errorResponse("Profile not found", 404);

  if (caller.user_type !== "SUPER_ADMIN" && caller.user_type !== "ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { companyId, address, city, state, zip, lat, lng, phone } = body;

  if (!companyId) return errorResponse("companyId is required");

  if (caller.user_type === "ADMIN" && caller.company_id !== companyId) {
    return errorResponse("Forbidden – can only edit your own company", 403);
  }

  const admin = createAdminClient();

  const updates: Record<string, unknown> = {};
  if (address !== undefined) updates.address = address;
  if (city !== undefined) updates.city = city;
  if (state !== undefined) updates.state = state;
  if (zip !== undefined) updates.zip = zip;
  if (lat !== undefined) updates.lat = lat;
  if (lng !== undefined) updates.lng = lng;
  if (phone !== undefined) updates.phone = phone;

  if (Object.keys(updates).length === 0) {
    return errorResponse("No fields to update");
  }

  const { error: updateErr } = await admin
    .from("companies")
    .update(updates)
    .eq("id", companyId);

  if (updateErr) return errorResponse(updateErr.message);

  return jsonResponse({ ok: true });
}
