export async function onRequestError(err, request, context) {
  // Default error handler
}

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startScheduler } = await import("./lib/scheduler.js");
    startScheduler();
  }
}
