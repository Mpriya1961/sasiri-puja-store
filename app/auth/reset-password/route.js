import { NextResponse } from "next/server";
import { consumeResetTokenAndSetPassword } from "@/lib/auth";

export async function POST(request) {
  try {
    const body = await request.json();
    const token = String(body.token || "");
    const password = String(body.password || "");

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Password must be at least 6 characters" },
        { status: 400 }
      );
    }

    const result = await consumeResetTokenAndSetPassword(token, password);

    if (!result.ok) {
      return NextResponse.json(
        { error: result.error || "Reset failed" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Reset failed" }, { status: 500 });
  }
}