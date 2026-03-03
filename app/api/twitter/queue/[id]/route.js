import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function DELETE(request, { params }) {
  const { id } = await params;

  // Only allow deleting queued tweets
  const { data: tweet, error: fetchError } = await supabase
    .from("tweets")
    .select("status")
    .eq("id", id)
    .single();

  if (fetchError || !tweet) {
    return NextResponse.json({ error: "Tweet not found" }, { status: 404 });
  }

  if (tweet.status !== "queued") {
    return NextResponse.json({ error: "Can only delete queued tweets" }, { status: 400 });
  }

  const { error } = await supabase.from("tweets").delete().eq("id", id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
