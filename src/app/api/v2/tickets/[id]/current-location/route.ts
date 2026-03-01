import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  const { data, error: queryError } = await supabase
    .from("ticket_parking")
    .select("*")
    .eq("ticket_id", id)
    .single();

  if (queryError) return errorResponse("No parking found", 404);

  return jsonResponse({
    locationId: data.location_id,
    locationName: data.location_name,
    isBlocked: data.is_blocked,
    blockingNotes: data.blocking_notes,
    parkingPhoto: data.parking_photo,
    parkedAt: data.parked_at,
  });
}
