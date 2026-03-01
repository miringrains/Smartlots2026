import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, getUserProfile, getLocationScope, resolveCompanyId, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { mapTicket } from "@/lib/dto";

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  const profile = await getUserProfile(supabase, user.id);
  if (!profile) return errorResponse("Profile not found", 404);

  const companyId = resolveCompanyId(request, profile);
  const locationIds = await getLocationScope(supabase, profile, companyId);

  const { data, error: queryError } = await supabase
    .from("tickets")
    .select("*, ticket_images(*), spots(*), ticket_parking(*)")
    .in("location_id", locationIds)
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (queryError) return errorResponse(queryError.message);
  return jsonResponse((data || []).map(mapTicket));
}

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown parse error";
    return errorResponse(`Failed to parse form data: ${msg}`);
  }

  const userId = formData.get("userId") as string;
  const locationId = formData.get("locationId") as string;
  const email = formData.get("email") as string;
  const ticketNumber = formData.get("ticketNumber") as string;
  const vin = formData.get("vin") as string;
  const make = formData.get("make") as string;
  const model = formData.get("model") as string;
  const yearRaw = formData.get("year") as string;
  const licensePlate = formData.get("licensePlate") as string;
  const nFiles = parseInt(formData.get("n_files") as string) || 0;
  const spotId = formData.get("spotId") as string;

  if (!userId) return errorResponse("userId is required");
  if (!locationId) return errorResponse("locationId is required");
  if (!vin) return errorResponse("vin is required");
  if (!make) return errorResponse("make is required");
  if (!model) return errorResponse("model is required");
  if (!licensePlate) return errorResponse("licensePlate is required");

  const year = parseInt(yearRaw);
  if (!yearRaw || isNaN(year)) return errorResponse("year is required and must be a number");

  const { data: ticket, error: ticketError } = await supabase
    .from("tickets")
    .insert({
      user_id: userId,
      location_id: locationId,
      email: email || "",
      ticket_number: ticketNumber || null,
      vin,
      make,
      model,
      year,
      license_plate: licensePlate,
      n_files: nFiles,
      spot_id: spotId || null,
    })
    .select("id")
    .single();

  if (ticketError || !ticket) {
    return errorResponse(
      `Ticket insert failed: ${ticketError?.message || "unknown"} (code: ${ticketError?.code || "none"})`,
      ticketError?.code === "42501" ? 403 : 400
    );
  }

  const photoErrors: string[] = [];
  const photos = formData.getAll("photo") as File[];
  const positions = ["front", "back", "left", "right"];

  for (let i = 0; i < photos.length; i++) {
    const file = photos[i];
    if (!file || !file.size) continue;

    const position = positions[i] || `photo_${i}`;
    const ext = file.name.split(".").pop() || "jpg";
    const storagePath = `${locationId}/${ticket.id}/${position}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from("ticket-photos")
      .upload(storagePath, file, { contentType: file.type, upsert: true });

    if (uploadError) {
      photoErrors.push(`${position}: ${uploadError.message}`);
      continue;
    }

    const { data: urlData } = supabase.storage.from("ticket-photos").getPublicUrl(storagePath);

    const { error: imgInsertError } = await supabase.from("ticket_images").insert({
      ticket_id: ticket.id,
      storage_path: storagePath,
      public_url: urlData.publicUrl,
      position,
    });

    if (imgInsertError) {
      photoErrors.push(`${position} db: ${imgInsertError.message}`);
    }
  }

  if (spotId) {
    await supabase.from("spots").update({ spot_state: "OCCUPIED" }).eq("id", spotId);
  }

  return NextResponse.json(
    {
      data: { id: ticket.id },
      ...(photoErrors.length > 0 ? { photoWarnings: photoErrors } : {}),
    },
    { status: 201 }
  );
}
