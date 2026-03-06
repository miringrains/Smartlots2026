import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  messageResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const admin = createAdminClient();

  const { error: softDeleteErr } = await admin
    .from("users")
    .update({ is_deleted: true, email: `deleted_${user.id}@removed.local` })
    .eq("id", user.id);

  if (softDeleteErr)
    return errorResponse(softDeleteErr.message, 500);

  const { error: authDeleteErr } =
    await admin.auth.admin.deleteUser(user.id);

  if (authDeleteErr)
    return errorResponse(authDeleteErr.message, 500);

  return messageResponse("Account deleted successfully");
}
