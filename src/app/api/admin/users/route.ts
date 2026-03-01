import { NextRequest } from "next/server";
import {
  getAuthenticatedUser,
  getUserProfile,
  jsonResponse,
  errorResponse,
} from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const caller = await getUserProfile(supabase, user.id);
  if (!caller) return errorResponse("Profile not found", 404);

  if (caller.user_type !== "ADMIN" && caller.user_type !== "SUPER_ADMIN") {
    return errorResponse("Forbidden – ADMIN or above required", 403);
  }

  const body = await request.json();
  const { email, password, userType, locationId, companyId } = body;

  if (!email || !password) {
    return errorResponse("email and password are required");
  }

  const allowedRoles = ["USER", "ADMIN"];
  if (caller.user_type === "SUPER_ADMIN") allowedRoles.push("SUPER_ADMIN");

  const role = userType || "USER";
  if (!allowedRoles.includes(role)) {
    return errorResponse(`Invalid role. Allowed: ${allowedRoles.join(", ")}`);
  }

  const resolvedCompanyId =
    caller.user_type === "SUPER_ADMIN" && companyId
      ? companyId
      : caller.company_id;

  if (!resolvedCompanyId) {
    return errorResponse("Could not determine company");
  }

  const resolvedLocationId = locationId || caller.location_id;

  const admin = createAdminClient();

  const { data: authUser, error: authError } =
    await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

  if (authError || !authUser?.user) {
    return errorResponse(authError?.message || "Failed to create auth user");
  }

  const { error: profileError } = await admin.from("users").insert({
    id: authUser.user.id,
    email,
    user_type: role,
    company_id: resolvedCompanyId,
    location_id: resolvedLocationId,
    requires_password_change: true,
  });

  if (profileError) {
    await admin.auth.admin.deleteUser(authUser.user.id);
    return errorResponse(profileError.message);
  }

  return jsonResponse(
    {
      id: authUser.user.id,
      email,
      userType: role,
      companyId: resolvedCompanyId,
      locationId: resolvedLocationId,
    },
    201
  );
}
