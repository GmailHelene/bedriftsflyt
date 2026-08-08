export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
    // Kjør trygg auto-migrering ved oppstart (best-effort - skal aldri velte serveren).
    try {
      const { migrer } = await import("./lib/migrate");
      await migrer();
    } catch (e) {
      console.error("[instrumentation] migrering feilet:", e instanceof Error ? e.message : e);
    }
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}
