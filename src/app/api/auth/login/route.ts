import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { mapUser } from "@/lib/dto";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { auth: { persistSession: false } }
    );

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({ email, password });
    if (authError || !authData.session) {
      return NextResponse.json({ error: authError?.message || "Invalid credentials" }, { status: 401 });
    }

    const authedClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        global: { headers: { Authorization: `Bearer ${authData.session.access_token}` } },
        auth: { persistSession: false },
      }
    );

    const { data: profile } = await authedClient
      .from("users")
      .select("*, locations(*)")
      .eq("id", authData.user.id)
      .eq("is_deleted", false)
      .single();

    return NextResponse.json({
      data: {
        token: authData.session.access_token,
        user: profile ? mapUser(profile) : null,
      },
    });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
