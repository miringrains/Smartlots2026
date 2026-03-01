import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getUserProfile, getLocationScope, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { mapLot } from "@/lib/dto";

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  const profile = await getUserProfile(supabase, user.id);
  if (!profile) return errorResponse("Profile not found", 404);

  const locationIds = await getLocationScope(supabase, profile);

  const { data, error: queryError } = await supabase
    .from("lots")
    .select("*, spots(*), locations(*)")
    .in("location_id", locationIds)
    .eq("is_deleted", false)
    .order("name");

  if (queryError) return errorResponse(queryError.message);
  return jsonResponse((data || []).map(mapLot));
}

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  try {
    const profile = await getUserProfile(supabase, user.id);
    if (!profile) return errorResponse("Profile not found", 404);

    const { name, spots, locationId } = await request.json();
    if (!name) return errorResponse("name required");

    let targetLocationId = profile.location_id;

    if (locationId && (profile.user_type === "ADMIN" || profile.user_type === "SUPER_ADMIN")) {
      const companyLocationIds = await getLocationScope(supabase, profile);
      if (!companyLocationIds.includes(locationId)) {
        return errorResponse("Location does not belong to your company");
      }
      targetLocationId = locationId;
    }

    const { data: lot, error: insertError } = await supabase
      .from("lots")
      .insert({ name, location_id: targetLocationId })
      .select("id")
      .single();

    if (insertError || !lot) return errorResponse(insertError?.message || "Failed to create lot");

    if (spots && Array.isArray(spots) && spots.length > 0) {
      const spotRows = spots.map((label: string) => ({ lot_id: lot.id, label }));
      await supabase.from("spots").insert(spotRows);
    }

    return NextResponse.json({ data: { id: lot.id } }, { status: 201 });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
