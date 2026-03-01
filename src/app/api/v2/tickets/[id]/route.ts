import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, messageResponse, errorResponse } from "@/lib/api-helpers";
import { mapTicket } from "@/lib/dto";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  const { data, error: queryError } = await supabase
    .from("tickets")
    .select("*, ticket_images(*), spots(*), ticket_parking(*)")
    .eq("id", id)
    .eq("is_deleted", false)
    .single();

  if (queryError) return errorResponse(queryError.message, 404);
  return jsonResponse(mapTicket(data));
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  try {
    const { ticketState } = await request.json();
    if (!ticketState) return errorResponse("ticketState required");

    const { error: updateError } = await supabase
      .from("tickets")
      .update({ ticket_state: ticketState })
      .eq("id", id);

    if (updateError) return errorResponse(updateError.message);
    return messageResponse("ok");
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
