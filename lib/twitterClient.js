import { Scraper } from "agent-twitter-client";
import { supabase } from "./supabase.js";

let scraperInstance = null;

export async function getScraper() {
  if (scraperInstance) {
    const loggedIn = await scraperInstance.isLoggedIn();
    if (loggedIn) return scraperInstance;
  }

  const scraper = new Scraper();

  // Try loading cached cookies from Supabase
  const { data: session } = await supabase
    .from("twitter_sessions")
    .select("cookies")
    .order("updated_at", { ascending: false })
    .limit(1)
    .single();

  if (session?.cookies) {
    try {
      const cookies = session.cookies.map((c) => `${c.key}=${c.value}; Domain=${c.domain}; Path=${c.path}`);
      await scraper.setCookies(cookies);
      const loggedIn = await scraper.isLoggedIn();
      if (loggedIn) {
        console.log("[twitter] Resumed session from cached cookies");
        scraperInstance = scraper;
        return scraper;
      }
      console.log("[twitter] Cached cookies expired, re-authenticating...");
    } catch (err) {
      console.error("[twitter] Failed to restore cookies:", err.message);
    }
  }

  // Fresh login
  return freshLogin(scraper);
}

async function freshLogin(scraper) {
  const username = process.env.TWITTER_USERNAME;
  const password = process.env.TWITTER_PASSWORD;
  const email = process.env.TWITTER_EMAIL;

  if (!username || !password) {
    throw new Error("Missing TWITTER_USERNAME or TWITTER_PASSWORD env vars");
  }

  await scraper.login(username, password, email);
  console.log("[twitter] Logged in successfully");

  // Cache cookies to Supabase
  const cookies = await scraper.getCookies();
  const cookieData = cookies.map((c) => c.toJSON());

  // Upsert: delete old sessions and insert new one
  await supabase.from("twitter_sessions").delete().neq("id", "00000000-0000-0000-0000-000000000000");
  await supabase.from("twitter_sessions").insert({
    cookies: cookieData,
    updated_at: new Date().toISOString(),
  });

  scraperInstance = scraper;
  return scraper;
}

export async function refreshSession() {
  scraperInstance = null;
  const scraper = new Scraper();
  return freshLogin(scraper);
}

export async function postTweet(content) {
  const scraper = await getScraper();
  const response = await scraper.sendTweet(content);

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Tweet failed (${response.status}): ${body}`);
  }

  console.log("[twitter] Tweet posted successfully");
  return response;
}
