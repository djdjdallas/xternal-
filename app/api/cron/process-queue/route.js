import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { postTweet } from "@/lib/twitterClient";

export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date().toISOString();
    const { data: tweets, error } = await supabase
      .from("tweets")
      .select("*")
      .eq("status", "queued")
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    let processed = 0;
    let failed = 0;

    for (const tweet of tweets || []) {
      try {
        await postTweet(tweet.content);
        await supabase
          .from("tweets")
          .update({ status: "posted", posted_at: new Date().toISOString() })
          .eq("id", tweet.id);
        processed++;
      } catch (err) {
        await supabase
          .from("tweets")
          .update({ status: "failed", error: err.message })
          .eq("id", tweet.id);
        failed++;
      }
    }

    return NextResponse.json({ processed, failed });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
