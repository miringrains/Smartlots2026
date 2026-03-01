import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getUserProfile, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { mapMovement } from "@/lib/dto";

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  const { data, error: queryError } = await supabase
    .from("parking_movements")
    .select("*")
    .eq("ticket_id", id)
    .order("moved_at", { ascending: false });

  if (queryError) return errorResponse(queryError.message);
  return jsonResponse((data || []).map(mapMovement));
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  try {
    const profile = await getUserProfile(supabase, user.id);
    if (!profile) return errorResponse("Profile not found", 404);

    const body = await request.json();
    const { toLotId, movementPhoto, reason } = body;

    const { data: toLot } = await supabase.from("lots").select("name").eq("id", toLotId).single();

    const { data: currentParking } = await supabase
      .from("ticket_parking")
      .select("lot_name")
      .eq("ticket_id", id)
      .single();

    const { data: movement, error: insertError } = await supabase
      .from("parking_movements")
      .insert({
        ticket_id: id,
        moved_by: user.id,
        moved_by_email: profile.email,
        from_lot: currentParking?.lot_name || null,
        to_lot: toLot?.name || "Unknown",
        movement_photo: movementPhoto || null,
        reason: reason || null,
      })
      .select("id")
      .single();

    if (insertError) return errorResponse(insertError.message);

    await supabase
      .from("ticket_parking")
      .update({
        lot_id: toLotId,
        lot_name: toLot?.name || null,
      })
      .eq("ticket_id", id);

    return NextResponse.json({ data: { id: movement.id } }, { status: 201 });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
