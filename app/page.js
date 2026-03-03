"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";

export default function Dashboard() {
  const [content, setContent] = useState("");
  const [scheduledFor, setScheduledFor] = useState("");
  const [posting, setPosting] = useState(false);
  const [toast, setToast] = useState(null);
  const [queue, setQueue] = useState([]);
  const [history, setHistory] = useState([]);
  const [expandedError, setExpandedError] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchQueue = useCallback(async () => {
    try {
      const res = await fetch("/api/twitter/queue");
      if (res.ok) setQueue(await res.json());
    } catch {}
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch("/api/twitter/history");
      if (res.ok) setHistory(await res.json());
    } catch {}
  }, []);

  useEffect(() => {
    fetchQueue();
    fetchHistory();
    const interval = setInterval(() => {
      fetchQueue();
      fetchHistory();
    }, 30000);
    return () => clearInterval(interval);
  }, [fetchQueue, fetchHistory]);

  async function handlePost(schedule = false) {
    if (!content.trim()) return;
    if (content.length > 280) {
      showToast("Tweet exceeds 280 characters", "error");
      return;
    }

    setPosting(true);
    try {
      const body = { content: content.trim() };
      if (schedule && scheduledFor) {
        body.scheduled_for = new Date(scheduledFor).toISOString();
      }

      const res = await fetch("/api/twitter/post", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      const data = await res.json();
      if (data.success) {
        showToast(schedule ? "Tweet scheduled!" : "Tweet posted!");
        setContent("");
        setScheduledFor("");
        fetchQueue();
        fetchHistory();
      } else {
        showToast(data.error || "Something went wrong", "error");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setPosting(false);
    }
  }

  async function handleDelete(id) {
    try {
      const res = await fetch(`/api/twitter/queue/${id}`, { method: "DELETE" });
      if (res.ok) {
        fetchQueue();
        showToast("Queued tweet deleted");
      }
    } catch {}
  }

  const charCount = content.length;

  return (
    <div className="min-h-screen bg-neutral-50 p-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <h1 className="text-2xl font-bold text-neutral-900">Twitter Poster</h1>

        {/* Toast */}
        {toast && (
          <div
            className={`rounded-md px-4 py-3 text-sm font-medium ${
              toast.type === "error"
                ? "bg-red-100 text-red-800"
                : "bg-green-100 text-green-800"
            }`}
          >
            {toast.message}
          </div>
        )}

        {/* Compose */}
        <Card>
          <CardHeader>
            <CardTitle>Compose Tweet</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="relative">
                <Textarea
                  placeholder="What's happening?"
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={4}
                  maxLength={300}
                />
                <span
                  className={`absolute bottom-2 right-3 text-xs font-medium ${
                    charCount > 280
                      ? "text-red-600"
                      : charCount > 260
                        ? "text-red-500"
                        : "text-neutral-400"
                  }`}
                >
                  {charCount}/280
                </span>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
                <div className="flex-1">
                  <label className="mb-1 block text-sm text-neutral-600">
                    Schedule (optional)
                  </label>
                  <Input
                    type="datetime-local"
                    value={scheduledFor}
                    onChange={(e) => setScheduledFor(e.target.value)}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => handlePost(false)}
                    disabled={posting || !content.trim() || charCount > 280}
                  >
                    {posting ? "Posting..." : "Post Now"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => handlePost(true)}
                    disabled={posting || !content.trim() || !scheduledFor || charCount > 280}
                  >
                    Schedule
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Queue */}
        <Card>
          <CardHeader>
            <CardTitle>Queued Tweets</CardTitle>
          </CardHeader>
          <CardContent>
            {queue.length === 0 ? (
              <p className="text-sm text-neutral-500">No tweets in queue.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {queue.map((tweet) => (
                  <div
                    key={tweet.id}
                    className="flex items-start justify-between gap-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="text-sm text-neutral-800 break-words">
                        {tweet.content}
                      </p>
                      <p className="mt-1 text-xs text-neutral-500">
                        Scheduled: {new Date(tweet.scheduled_for).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDelete(tweet.id)}
                    >
                      Delete
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* History */}
        <Card>
          <CardHeader>
            <CardTitle>Post History</CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-sm text-neutral-500">No posts yet.</p>
            ) : (
              <div className="divide-y divide-neutral-100">
                {history.map((tweet) => (
                  <div key={tweet.id} className="py-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-neutral-800 break-words">
                          {tweet.content}
                        </p>
                        <p className="mt-1 text-xs text-neutral-500">
                          {tweet.posted_at
                            ? new Date(tweet.posted_at).toLocaleString()
                            : new Date(tweet.created_at).toLocaleString()}
                        </p>
                      </div>
                      <Badge
                        variant={tweet.status === "posted" ? "success" : "destructive"}
                      >
                        {tweet.status}
                      </Badge>
                    </div>
                    {tweet.status === "failed" && tweet.error && (
                      <div className="mt-1">
                        <button
                          className="text-xs text-red-600 underline"
                          onClick={() =>
                            setExpandedError(expandedError === tweet.id ? null : tweet.id)
                          }
                        >
                          {expandedError === tweet.id ? "Hide error" : "Show error"}
                        </button>
                        {expandedError === tweet.id && (
                          <p className="mt-1 rounded bg-red-50 p-2 text-xs text-red-700">
                            {tweet.error}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
