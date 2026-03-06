import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  jsonResponse,
  messageResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const admin = createAdminClient();
  const { data, error: qErr } = await admin
    .from("ticket_parking")
    .select("*")
    .eq("ticket_id", id)
    .single();

  if (qErr || !data) {
    return jsonResponse({
      parked: false,
      locationId: null,
      locationName: null,
    });
  }

  return jsonResponse({
    parked: true,
    locationId: data.location_id,
    locationName: data.location_name,
    isBlocked: data.is_blocked,
    blockingNotes: data.blocking_notes,
    parkingPhoto: data.parking_photo,
    parkedAt: data.parked_at,
  });
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  try {
    const body = await request.json();
    const { locationId, isBlocked, blockingNotes, parkingPhoto } = body;

    if (!locationId) return errorResponse("locationId is required");

    const admin = createAdminClient();

    const { data: location } = await admin
      .from("locations")
      .select("name, capacity")
      .eq("id", locationId)
      .single();

    if (!location) return errorResponse("Location not found", 404);

    const { count: occupiedCount } = await admin
      .from("ticket_parking")
      .select("id", { count: "exact", head: true })
      .eq("location_id", locationId);

    const occupied = occupiedCount || 0;
    const { data: existingParking } = await admin
      .from("ticket_parking")
      .select("location_id")
      .eq("ticket_id", id)
      .single();

    const alreadyHere = existingParking?.location_id === locationId;
    if (
      !alreadyHere &&
      location.capacity > 0 &&
      occupied >= location.capacity
    ) {
      return errorResponse(
        `Location "${location.name}" is full (${occupied}/${location.capacity})`,
        409
      );
    }

    const parkingData = {
      ticket_id: id,
      location_id: locationId,
      location_name: location.name,
      is_blocked: isBlocked || false,
      blocking_notes: blockingNotes || "",
      parking_photo: parkingPhoto || null,
    };

    if (existingParking) {
      const { error: updateError } = await admin
        .from("ticket_parking")
        .update(parkingData)
        .eq("ticket_id", id);
      if (updateError) return errorResponse(updateError.message);
    } else {
      const { error: insertError } = await admin
        .from("ticket_parking")
        .insert(parkingData);
      if (insertError) return errorResponse(insertError.message);
    }

    return messageResponse("ok");
  } catch {
    return errorResponse("Internal server error", 500);
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const admin = createAdminClient();
  const { error: delErr } = await admin
    .from("ticket_parking")
    .delete()
    .eq("ticket_id", id);

  if (delErr) return errorResponse(delErr.message);
  return messageResponse("ok");
}
