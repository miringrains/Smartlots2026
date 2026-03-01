import { NextRequest } from "next/server";
import { getAuthenticatedUser, getUserProfile, jsonResponse, errorResponse } from "@/lib/api-helpers";
import { mapUser } from "@/lib/dto";

export async function GET(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  const profile = await getUserProfile(supabase, user.id);
  if (!profile) return errorResponse("Profile not found", 404);

  return jsonResponse(mapUser(profile));
}
