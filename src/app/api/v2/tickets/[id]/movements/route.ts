import { NextRequest, NextResponse } from "next/server";
import {
  getAuthenticatedUser,
  getUserProfile,
  jsonResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { mapMovement } from "@/lib/dto";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const { data, error: queryError } = await supabase
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

    const { data: toLocation } = await supabase
      .from("locations")
      .select("name, capacity")
      .eq("id", toLocationId)
      .single();

    if (!toLocation) return errorResponse("Destination location not found", 404);

    const { count: destOccupied } = await supabase
      .from("ticket_parking")
      .select("id", { count: "exact", head: true })
      .eq("location_id", toLocationId);

    const { data: currentParking } = await supabase
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
        `Destination "${toLocation.name}" is full (${destOccupied}/${toLocation.capacity})`,
        409
      );
    }

    const { data: movement, error: insertError } = await supabase
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

    const { error: parkErr } = await supabase
      .from("ticket_parking")
      .upsert(
        {
          ticket_id: id,
          location_id: toLocationId,
          location_name: toLocation.name,
          is_blocked: false,
          blocking_notes: "",
        },
        { onConflict: "ticket_id" }
      );

    if (parkErr) {
      if (currentParking) {
        await supabase
          .from("ticket_parking")
          .update({
            location_id: toLocationId,
            location_name: toLocation.name,
          })
          .eq("ticket_id", id);
      } else {
        await supabase.from("ticket_parking").insert({
          ticket_id: id,
          location_id: toLocationId,
          location_name: toLocation.name,
          is_blocked: false,
          blocking_notes: "",
        });
      }
    }

    return NextResponse.json({ data: { id: movement.id } }, { status: 201 });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
