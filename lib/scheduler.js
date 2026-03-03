import cron from "node-cron";
import { supabase } from "./supabase.js";
import { postTweet } from "./twitterClient.js";

let isRunning = false;

async function processQueue() {
  if (isRunning) return;
  isRunning = true;

  try {
    const now = new Date().toISOString();
    const { data: tweets, error } = await supabase
      .from("tweets")
      .select("*")
      .eq("status", "queued")
      .lte("scheduled_for", now)
      .order("scheduled_for", { ascending: true });

    if (error) {
      console.error("[scheduler] Failed to fetch queued tweets:", error.message);
      return;
    }

    for (const tweet of tweets || []) {
      try {
        await postTweet(tweet.content);
        await supabase
          .from("tweets")
          .update({ status: "posted", posted_at: new Date().toISOString() })
          .eq("id", tweet.id);
        console.log(`[scheduler] Posted tweet ${tweet.id}`);
      } catch (err) {
        await supabase
          .from("tweets")
          .update({ status: "failed", error: err.message })
          .eq("id", tweet.id);
        console.error(`[scheduler] Failed to post tweet ${tweet.id}:`, err.message);
      }
    }
  } catch (err) {
    console.error("[scheduler] Unexpected error:", err.message);
  } finally {
    isRunning = false;
  }
}

export function startScheduler() {
  console.log("[scheduler] Starting tweet scheduler (every minute)");
  cron.schedule("* * * * *", processQueue);
}
