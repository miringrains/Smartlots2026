import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  try {
    const { email, code, newPassword } = await request.json();
    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: "Email, code, and newPassword required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data, error } = await supabase.auth.verifyOtp({
      email,
      token: code,
      type: "recovery",
    });

    if (error || !data.session) {
      return NextResponse.json({ error: error?.message || "Invalid code" }, { status: 400 });
    }

    const authedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${data.session.access_token}` } },
        auth: { persistSession: false },
      }
    );

    const { error: updateError } = await authedClient.auth.updateUser({ password: newPassword });
    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 400 });
    }

    return NextResponse.json({ message: "ok" });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
