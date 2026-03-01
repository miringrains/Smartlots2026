import { NextRequest } from "next/server";
import { getAuthenticatedUser, getUserProfile, jsonResponse, errorResponse } from "@/lib/api-helpers";

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  const profile = await getUserProfile(supabase, user.id);
  if (!profile) return errorResponse("Profile not found", 404);

  const { data: lots } = await supabase
    .from("lots")
    .select("id, name, spots(id)")
    .eq("location_id", profile.location_id)
    .eq("is_deleted", false);

  if (!lots) return jsonResponse([]);

  const stats = await Promise.all(
    lots.map(async (lot) => {
      const totalSpots = lot.spots?.length || 0;

      const { count } = await supabase
        .from("ticket_parking")
        .select("id", { count: "exact", head: true })
        .eq("lot_id", lot.id);

      const occupiedSpots = count || 0;
      const availableSpots = Math.max(0, totalSpots - occupiedSpots);
      const occupancyRate = totalSpots > 0 ? Math.round((occupiedSpots / totalSpots) * 100 * 10) / 10 : 0;

      return {
        id: lot.id,
        name: lot.name,
        totalSpots,
        availableSpots,
        occupiedSpots,
        occupancyRate,
      };
    })
  );

  return jsonResponse(stats);
}
