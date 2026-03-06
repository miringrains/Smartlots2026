import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  jsonResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: locationId } = await params;
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const admin = createAdminClient();

  const { data: location, error: locErr } = await admin
    .from("locations")
    .select("id, name, capacity")
    .eq("id", locationId)
    .single();

  if (locErr || !location)
    return errorResponse("Location not found", 404);

  const { data: parkingRows, error: parkErr } = await admin
    .from("ticket_parking")
    .select("ticket_id, location_name, is_blocked, blocking_notes, parking_photo, parked_at")
    .eq("location_id", locationId);

  if (parkErr) return errorResponse(parkErr.message);

  if (!parkingRows || parkingRows.length === 0) {
    return jsonResponse({
      location: {
        id: location.id,
        name: location.name,
        capacity: location.capacity,
        occupied: 0,
        available: location.capacity,
      },
      vehicles: [],
    });
  }

  const ticketIds = parkingRows.map((p) => p.ticket_id);

  const { data: tickets, error: ticketErr } = await admin
    .from("tickets")
    .select("*, ticket_images(*)")
    .in("id", ticketIds)
    .eq("is_deleted", false);

  if (ticketErr) return errorResponse(ticketErr.message);

  const parkingMap: Record<string, (typeof parkingRows)[0]> = {};
  for (const p of parkingRows) {
    parkingMap[p.ticket_id] = p;
  }

  const vehicles = (tickets || []).map((t: any) => {
    const p = parkingMap[t.id];
    return {
      id: t.id,
      vin: t.vin,
      make: t.make,
      model: t.model,
      year: t.year,
      licensePlate: t.license_plate,
      ticketNumber: t.ticket_number,
      ticketState: t.ticket_state,
      email: t.email,
      images: t.ticket_images
        ? t.ticket_images.map((img: any) => img.public_url)
        : [],
      createdAt: t.created_at,
      parking: p
        ? {
            locationId: locationId,
            locationName: p.location_name,
            parked: true,
            isBlocked: p.is_blocked,
            blockingNotes: p.blocking_notes,
            parkingPhoto: p.parking_photo,
            parkedAt: p.parked_at,
          }
        : null,
    };
  });

  const occupied = parkingRows.length;

  return jsonResponse({
    location: {
      id: location.id,
      name: location.name,
      capacity: location.capacity,
      occupied,
      available: Math.max(0, location.capacity - occupied),
    },
    vehicles,
  });
}
