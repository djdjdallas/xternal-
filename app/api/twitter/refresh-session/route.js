import { NextResponse } from "next/server";
import { refreshSession } from "@/lib/twitterClient";

export async function POST() {
  try {
    await refreshSession();
    return NextResponse.json({ success: true, message: "Session refreshed" });
  } catch (err) {
    console.error("[api/refresh-session] Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
