import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getUserProfile,
  resolveCompanyId,
  jsonResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || "";

function staticMapUrl(lat: number, lng: number): string {
  if (!MAPBOX_TOKEN || !lat || !lng) return "";
  const pin = `pin-s+ee3f43(${lng},${lat})`;
  return `https://api.mapbox.com/styles/v1/mapbox/dark-v11/static/${pin}/${lng},${lat},15,0/400x200@2x?access_token=${MAPBOX_TOKEN}&logo=false&attribution=false`;
}

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const profile = await getUserProfile(supabase, user.id);
  if (!profile) return errorResponse("Profile not found", 404);

  const companyId = resolveCompanyId(request, profile);

  const admin = createAdminClient();

  const { data: locations, error: qErr } = await admin
    .from("locations")
    .select("*")
    .eq("company_id", companyId)
    .eq("is_deleted", false)
    .order("name");

  if (qErr) return errorResponse(qErr.message);

  const locationIds = (locations || []).map((l: any) => l.id);

  let occupancyMap: Record<string, number> = {};
  if (locationIds.length > 0) {
    const { data: parking } = await admin
      .from("ticket_parking")
      .select("location_id")
      .in("location_id", locationIds);

    if (parking) {
      for (const p of parking) {
        occupancyMap[p.location_id] = (occupancyMap[p.location_id] || 0) + 1;
      }
    }
  }

  const result = (locations || []).map((loc: any) => {
    const occupied = occupancyMap[loc.id] || 0;
    return {
      id: loc.id,
      name: loc.name,
      address: loc.address,
      lat: loc.lat ?? null,
      lng: loc.lng ?? null,
      capacity: loc.capacity || 0,
      occupied,
      available: Math.max(0, (loc.capacity || 0) - occupied),
      mapPreviewUrl: loc.lat && loc.lng ? staticMapUrl(loc.lat, loc.lng) : null,
    };
  });

  return jsonResponse(result);
}

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const profile = await getUserProfile(supabase, user.id);
  if (!profile) return errorResponse("Profile not found", 404);

  if (profile.user_type !== "ADMIN" && profile.user_type !== "SUPER_ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { name, address, lat, lng, capacity } = body;

  if (!name) return errorResponse("name is required");

  const companyId = resolveCompanyId(request, profile);

  const admin = createAdminClient();
  const { data, error: insertErr } = await admin
    .from("locations")
    .insert({
      company_id: companyId,
      name,
      address: address || "",
      lat: lat ?? null,
      lng: lng ?? null,
      capacity: capacity || 0,
    })
    .select("id")
    .single();

  if (insertErr) return errorResponse(insertErr.message);

  return NextResponse.json({ data: { id: data.id } }, { status: 201 });
}

export async function PATCH(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const profile = await getUserProfile(supabase, user.id);
  if (!profile) return errorResponse("Profile not found", 404);

  if (profile.user_type !== "ADMIN" && profile.user_type !== "SUPER_ADMIN") {
    return errorResponse("Forbidden", 403);
  }

  const body = await request.json();
  const { locationId, name, address, lat, lng, capacity } = body;

  if (!locationId) return errorResponse("locationId is required");

  const updates: Record<string, unknown> = {};
  if (name !== undefined) updates.name = name;
  if (address !== undefined) updates.address = address;
  if (lat !== undefined) updates.lat = lat;
  if (lng !== undefined) updates.lng = lng;
  if (capacity !== undefined) updates.capacity = capacity;

  if (Object.keys(updates).length === 0) {
    return errorResponse("No fields to update");
  }

  const admin = createAdminClient();
  const { error: updateErr } = await admin
    .from("locations")
    .update(updates)
    .eq("id", locationId);

  if (updateErr) return errorResponse(updateErr.message);

  return jsonResponse({ ok: true });
}
