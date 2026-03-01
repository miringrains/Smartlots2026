import { NextRequest } from "next/server";
import { getAuthenticatedUser, getUserProfile, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { mapTicket } from "@/lib/dto";

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  const profile = await getUserProfile(supabase, user.id);
  if (!profile) return errorResponse("Profile not found", 404);

  const url = new URL(request.url);
  const vin = url.searchParams.get("vin");
  const ticketNumber = url.searchParams.get("ticketNumber");
  const licensePlate = url.searchParams.get("licensePlate");
  const year = url.searchParams.get("year");
  const fromDate = url.searchParams.get("fromDate");
  const toDate = url.searchParams.get("toDate");

  let query = supabase
    .from("tickets")
    .select("*, ticket_images(*), spots(*), ticket_parking(*)")
    .eq("location_id", profile.location_id)
    .eq("is_deleted", false);

  if (vin) query = query.ilike("vin", `%${vin}%`);
  if (ticketNumber) query = query.ilike("ticket_number", `%${ticketNumber}%`);
  if (licensePlate) query = query.ilike("license_plate", `%${licensePlate}%`);
  if (year) query = query.eq("year", parseInt(year));
  if (fromDate) query = query.gte("created_at", fromDate);
  if (toDate) query = query.lte("created_at", toDate);

  const { data, error: queryError } = await query.order("created_at", { ascending: false });
  if (queryError) return errorResponse(queryError.message);

  return jsonResponse((data || []).map(mapTicket));
}
