import { NextResponse } from "next/server";
import { createResetToken, getEffectiveAdminUsername } from "@/lib/auth";
import { sendResetEmail } from "@/lib/mailer";

export async function POST(request) {
  try {
    const body = await request.json();
    const username = String(body.username || "").trim();

    const adminUsername = await getEffectiveAdminUsername();

    if (username !== adminUsername) {
      return NextResponse.json(
        { error: "Username not found" },
        { status: 404 }
      );
    }

    const token = await createResetToken();
    const resetLink = `${process.env.APP_BASE_URL}/reset-password/${token}`;

    await sendResetEmail(resetLink);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Forgot password error:", error);
    return NextResponse.json(
      { error: "Failed to send reset email" },
      { status: 500 }
    );
  }
}