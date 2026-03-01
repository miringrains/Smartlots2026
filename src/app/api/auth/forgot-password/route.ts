import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const supabase = createAdminClient();
    await supabase.auth.resetPasswordForEmail(email);

    return NextResponse.json({ message: "ok" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
