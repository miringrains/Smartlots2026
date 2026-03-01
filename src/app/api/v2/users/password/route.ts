import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser, errorResponse } from "@/lib/api-helpers";
import { createClient } from "@supabase/supabase-js";

export async function PUT(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser(request);
  if (error || !user) return errorResponse(error || "Unauthorized", 401);

  try {
    const { currentPassword, newPassword } = await request.json();
    if (!currentPassword || !newPassword) {
      return errorResponse("currentPassword and newPassword required");
    }

    const verifyClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { error: signInError } = await verifyClient.auth.signInWithPassword({
      email: user.email!,
      password: currentPassword,
    });

    if (signInError) return errorResponse("Current password is incorrect", 401);

    const { createAdminClient } = await import("@/lib/supabase/admin");
    const admin = createAdminClient();
    const { error: updateError } = await admin.auth.admin.updateUserById(user.id, {
      password: newPassword,
    });

    if (updateError) return errorResponse(updateError.message);
    return NextResponse.json({ message: "ok" });
  } catch {
    return errorResponse("Internal server error", 500);
  }
}
