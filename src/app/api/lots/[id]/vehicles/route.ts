import { NextRequest } from "next/server";
import { getAuthenticatedUser, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { mapTicket } from "@/lib/dto";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  const { data: parkingEntries } = await supabase
    .from("ticket_parking")
    .select("ticket_id")
    .eq("lot_id", id);

  if (!parkingEntries || parkingEntries.length === 0) {
    return jsonResponse({ vehicles: [] });
  }

  const ticketIds = parkingEntries.map((p) => p.ticket_id);

  const { data: tickets, error: queryError } = await supabase
    .from("tickets")
    .select("*, ticket_images(*), spots(*), ticket_parking(*)")
    .in("id", ticketIds)
    .eq("is_deleted", false);

  if (queryError) return errorResponse(queryError.message);

  return jsonResponse({ vehicles: (tickets || []).map(mapTicket) });
}
