import { NextRequest } from "next/server";
import { getAuthenticatedUser, messageResponse, errorResponse } from "@/lib/api-helpers";

export async function PUT(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase) return errorResponse(error || "Unauthorized", 401);

  try {
    const { id, email } = await request.json();
    if (!id || !email) return errorResponse("id and email required");

    const { error: updateError } = await supabase
      .from("users")
      .update({ email })
      .eq("id", id);

    if (updateError) return errorResponse(updateError.message);
    return messageResponse("ok");
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
