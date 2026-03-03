import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { postTweet } from "@/lib/twitterClient";

export async function POST(request) {
  try {
    const body = await request.json();
    const { content, scheduled_for } = body;

    if (!content || typeof content !== "string") {
      return NextResponse.json({ success: false, error: "Content is required" }, { status: 400 });
    }

    if (content.length > 280) {
      return NextResponse.json({ success: false, error: "Content exceeds 280 characters" }, { status: 400 });
    }

    // Schedule for later
    if (scheduled_for) {
      const scheduledDate = new Date(scheduled_for);
      if (isNaN(scheduledDate.getTime())) {
        return NextResponse.json({ success: false, error: "Invalid scheduled_for date" }, { status: 400 });
      }

      const { data, error } = await supabase
        .from("tweets")
        .insert({
          content,
          status: "queued",
          scheduled_for: scheduledDate.toISOString(),
        })
        .select("id")
        .single();

      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
      }

      return NextResponse.json({ success: true, tweet_id: data.id, scheduled: true });
    }

    // Post immediately
    await postTweet(content);

    const { data, error } = await supabase
      .from("tweets")
      .insert({
        content,
        status: "posted",
        posted_at: new Date().toISOString(),
      })
      .select("id")
      .single();

    if (error) {
      console.error("[api/post] DB insert failed after posting:", error.message);
    }

    return NextResponse.json({ success: true, tweet_id: data?.id });
  } catch (err) {
    console.error("[api/post] Error:", err.message);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
