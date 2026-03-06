import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  getUserProfile,
  jsonResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase/admin";
import { mapMovement } from "@/lib/dto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const admin = createAdminClient();
  const { data, error: queryError } = await admin
    .from("parking_movements")
    .select("*")
    .eq("ticket_id", id)
    .order("moved_at", { ascending: false });

  if (queryError) return errorResponse(queryError.message);
  return jsonResponse((data || []).map(mapMovement));
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  try {
    const profile = await getUserProfile(supabase, user.id);
    if (!profile) return errorResponse("Profile not found", 404);

    const body = await request.json();
    const { toLocationId, reason, movementPhoto } = body;

    if (!toLocationId) return errorResponse("toLocationId is required");

    const admin = createAdminClient();

    const { data: toLocation } = await admin
      .from("locations")
      .select("name, capacity")
      .eq("id", toLocationId)
      .single();

    if (!toLocation) return errorResponse("Destination location not found", 404);

    const { count: destOccupied } = await admin
      .from("ticket_parking")
      .select("id", { count: "exact", head: true })
      .eq("location_id", toLocationId);

    const { data: currentParking } = await admin
      .from("ticket_parking")
      .select("location_id, location_name")
      .eq("ticket_id", id)
      .single();

    const alreadyAtDest = currentParking?.location_id === toLocationId;
    if (
      !alreadyAtDest &&
      toLocation.capacity > 0 &&
      (destOccupied || 0) >= toLocation.capacity
    ) {
      return errorResponse(
        `Location "${toLocation.name}" is full (${destOccupied}/${toLocation.capacity})`,
        409
      );
    }

    const { data: movement, error: insertError } = await admin
      .from("parking_movements")
      .insert({
        ticket_id: id,
        moved_by: user.id,
        moved_by_email: profile.email,
        from_location_id: currentParking?.location_id || null,
        from_location_name: currentParking?.location_name || null,
        to_location_id: toLocationId,
        to_location_name: toLocation.name,
        movement_photo: movementPhoto || null,
        reason: reason || null,
      })
      .select("id")
      .single();

    if (insertError) return errorResponse(insertError.message);

    if (currentParking) {
      const { error: updateErr } = await admin
        .from("ticket_parking")
        .update({
          location_id: toLocationId,
          location_name: toLocation.name,
          parked_at: new Date().toISOString(),
        })
        .eq("ticket_id", id);

      if (updateErr) return errorResponse(updateErr.message);
    } else {
      const { error: insertErr } = await admin
        .from("ticket_parking")
        .insert({
          ticket_id: id,
          location_id: toLocationId,
          location_name: toLocation.name,
          is_blocked: false,
          blocking_notes: "",
        });

      if (insertErr) return errorResponse(insertErr.message);
    }

    return jsonResponse({ id: movement.id });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
