import * as Sentry from "@sentry/nextjs";

// No-op uten DSN — trygt å ha inne før du oppretter Sentry-prosjektet.
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,
  sendDefaultPii: false,
  beforeSend(event) {
    // Fjern persondata før hendelsen sendes ut av serveren.
    if (event.request) {
      event.request.cookies = undefined;
      event.request.headers = undefined;
      event.request.data = undefined;
    }
    event.user = undefined;
    return event;
  },
});
