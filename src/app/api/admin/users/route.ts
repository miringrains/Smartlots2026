import { NextRequest } from "next/server";
import { createClient } from "@supabase/supabase-js";
import {
  getAuthenticatedUser,
  getUserProfile,
  jsonResponse,
  errorResponse,
  messageResponse,
} from "@/lib/api-helpers";
import { createAdminClient } from "@/lib/supabase/admin";

export async function PATCH(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const caller = await getUserProfile(supabase, user.id);
  if (!caller) return errorResponse("Profile not found", 404);

  if (caller.user_type !== "ADMIN" && caller.user_type !== "SUPER_ADMIN") {
    return errorResponse("Forbidden – ADMIN or above required", 403);
  }

  const body = await request.json();
  const { userId, action, userType, locationId } = body;

  if (!userId) return errorResponse("userId is required");

  const admin = createAdminClient();

  const { data: target, error: targetErr } = await admin
    .from("users")
    .select("id, user_type, company_id, email")
    .eq("id", userId)
    .single();

  if (targetErr || !target) return errorResponse("User not found", 404);

  if (caller.user_type !== "SUPER_ADMIN" && target.company_id !== caller.company_id) {
    return errorResponse("Cannot manage users from another company", 403);
  }

  if (caller.user_type === "ADMIN" && target.user_type === "SUPER_ADMIN") {
    return errorResponse("Cannot modify a Super Admin", 403);
  }

  switch (action) {
    case "suspend": {
      await admin.from("users").update({ is_suspended: true }).eq("id", userId);
      await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });
      return messageResponse("User suspended");
    }

    case "unsuspend": {
      await admin.from("users").update({ is_suspended: false }).eq("id", userId);
      await admin.auth.admin.updateUserById(userId, { ban_duration: "none" });
      return messageResponse("User unsuspended");
    }

    case "resetPassword": {
      const origin = request.headers.get("origin") || "https://admin.smartlotpro.com";
      const anonClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      await anonClient.auth.resetPasswordForEmail(target.email, {
        redirectTo: `${origin}/reset-password`,
      });
      return messageResponse("Password reset email sent");
    }

    case "changeRole": {
      if (!userType) return errorResponse("userType is required for changeRole");
      const allowed = ["USER", "ADMIN"];
      if (caller.user_type === "SUPER_ADMIN") allowed.push("SUPER_ADMIN");
      if (!allowed.includes(userType)) return errorResponse(`Invalid role: ${userType}`);
      await admin.from("users").update({ user_type: userType }).eq("id", userId);
      return messageResponse("Role updated");
    }

    case "changeLocation": {
      if (!locationId) return errorResponse("locationId is required for changeLocation");
      await admin.from("users").update({ location_id: locationId }).eq("id", userId);
      return messageResponse("Location updated");
    }

    default:
      return errorResponse(`Unknown action: ${action}`);
  }
}

export async function DELETE(request: NextRequest) {
  const { user, supabase, error } = await getAuthenticatedUser(request);
  if (error || !user || !supabase)
    return errorResponse(error || "Unauthorized", 401);

  const caller = await getUserProfile(supabase, user.id);
  if (!caller) return errorResponse("Profile not found", 404);

  if (caller.user_type !== "ADMIN" && caller.user_type !== "SUPER_ADMIN") {
    return errorResponse("Forbidden – ADMIN or above required", 403);
  }

  const url = new URL(request.url);
  const userId = url.searchParams.get("userId");
  if (!userId) return errorResponse("userId query param is required");

  if (userId === user.id) return errorResponse("Cannot delete yourself");

  const admin = createAdminClient();

  const { data: target, error: targetErr } = await admin
    .from("users")
    .select("id, user_type, company_id")
    .eq("id", userId)
    .single();

  if (targetErr || !target) return errorResponse("User not found", 404);

  if (caller.user_type !== "SUPER_ADMIN" && target.company_id !== caller.company_id) {
    return errorResponse("Cannot delete users from another company", 403);
  }

  if (caller.user_type === "ADMIN" && target.user_type === "SUPER_ADMIN") {
    return errorResponse("Cannot delete a Super Admin", 403);
  }

  await admin.from("users").update({ is_deleted: true }).eq("id", userId);
  await admin.auth.admin.updateUserById(userId, { ban_duration: "876000h" });

  return messageResponse("User deleted");
}

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

  const origin = request.headers.get("origin") || "https://admin.smartlotpro.com";
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  await anonClient.auth.resetPasswordForEmail(email, {
    redirectTo: `${origin}/reset-password`,
  });

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
