import { NextRequest } from "next/server";
import { getAuthenticatedUser, messageResponse, errorResponse } from "@/lib/api-helpers";

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  try {
    const body = await request.json();
    const { lotId, isBlocked, blockingNotes, parkingPhoto } = body;

    const { data: lot } = await supabase.from("lots").select("name").eq("id", lotId).single();

    const parkingData = {
      ticket_id: id,
      lot_id: lotId,
      lot_name: lot?.name || null,
      is_blocked: isBlocked || false,
      blocking_notes: blockingNotes || "",
      parking_photo: parkingPhoto || null,
    };

    const { data: existing } = await supabase
      .from("ticket_parking")
      .select("id")
      .eq("ticket_id", id)
      .single();

    if (existing) {
      const { error: updateError } = await supabase
        .from("ticket_parking")
        .update(parkingData)
        .eq("ticket_id", id);
      if (updateError) return errorResponse(updateError.message);
    } else {
      const { error: insertError } = await supabase
        .from("ticket_parking")
        .insert(parkingData);
      if (insertError) return errorResponse(insertError.message);
    }

    return messageResponse("ok");
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
